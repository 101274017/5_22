"""核心神交业务路由 - 地理围栏 + AI 大模型"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.tenant import get_tenant_id
from app.models import Character, Encounter
from app.schemas import (
    SummonRequest, SummonResponse,
    AnswerRequest, AnswerResponse,
    ChatRequest, ChatResponse,
    EncounterListItem, EncounterDetailResponse,
)
from app.ai_client import call_ai, call_ai_with_history
from app.knowledge_base import (
    build_system_prompt,
    build_summon_prompt,
    build_answer_prompt,
    build_chat_prompt,
)
from app.utils.bounded_cache import BoundedHistoryCache

logger = logging.getLogger("AncientEncounter")
router = APIRouter(prefix="/api/v1/encounter", tags=["encounter"])

# 有界缓存：存储追问对话历史
_encounter_chat_histories = BoundedHistoryCache[int, list[dict]](maxsize=500)


@router.post("/summon", response_model=SummonResponse)
async def summon_ancient(
    req: SummonRequest,
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """召唤古人——地理围栏匹配后触发，使用 AI 生成开场白"""
    char = (
        db.query(Character)
        .filter(Character.tenant_id == tenant_id, Character.poi_name == req.poi_name)
        .first()
    )

    if not char:
        logger.warning(
            f"【多租户安全拦截】租户 [{tenant_id}] 试图访问未配置古迹: {req.poi_name}"
        )
        raise HTTPException(
            status_code=404,
            detail="此地空余黄鹤楼，古人未在此租户辖区内留步。",
        )

    # 使用 AI 生成开场白和问题
    system_prompt = build_system_prompt(char.character_name, char.poi_name)
    user_prompt = build_summon_prompt(char.character_name, char.poi_name)

    ai_reply = None
    for attempt in range(3):
        ai_reply = await call_ai(system_prompt, user_prompt, temperature=0.85)
        if ai_reply:
            break
        logger.warning(f"【AI生成开场白重试】古人={char.character_name} attempt={attempt+1}")

    if not ai_reply:
        raise HTTPException(
            status_code=503,
            detail="古人正在穿越时空，请稍后再试。",
        )

    # 解析开场白和问题
    opening_speech = ai_reply
    question = ""

    last_question_mark = ai_reply.rfind("？")
    if last_question_mark == -1:
        last_question_mark = ai_reply.rfind("?")

    if last_question_mark > 0:
        question_start = max(
            ai_reply.rfind("。", 0, last_question_mark),
            ai_reply.rfind("\n", 0, last_question_mark),
            ai_reply.rfind("，", 0, last_question_mark - 20),
        )
        if question_start > 0 and question_start < last_question_mark:
            opening_speech = ai_reply[:question_start + 1].strip()
            question = ai_reply[question_start + 1:].strip()
        else:
            opening_speech = ai_reply[:last_question_mark + 1].strip()
            question = ""

    if not question:
        question = ai_reply

    logger.info(f"【AI生成开场白成功】古人={char.character_name}")

    encounter = Encounter(
        tenant_id=tenant_id,
        user_id=req.user_id,
        character_name=char.character_name,
        poi_name=char.poi_name,
        question=question,
        status="summoned",
    )
    db.add(encounter)
    db.commit()
    db.refresh(encounter)

    logger.info(
        f"【召唤成功】租户={tenant_id} 用户={req.user_id} 古人={char.character_name} POI={req.poi_name}"
    )

    return SummonResponse(
        encounter_id=encounter.id,
        character_name=char.character_name,
        opening_speech=opening_speech,
        question=question,
    )


@router.post("/answer", response_model=AnswerResponse)
async def answer_question(
    req: AnswerRequest,
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """后生递交答卷——使用 AI 生成专属赠语与精神徽章"""
    encounter = (
        db.query(Encounter)
        .filter(Encounter.id == req.encounter_id, Encounter.tenant_id == tenant_id)
        .first()
    )
    if not encounter:
        raise HTTPException(status_code=403, detail="无权操作此神交记录")

    system_prompt = build_system_prompt(encounter.character_name, encounter.poi_name)
    user_prompt = build_answer_prompt(encounter.character_name, req.user_answer)

    ai_reply = None
    for attempt in range(3):
        ai_reply = await call_ai(system_prompt, user_prompt, temperature=0.8)
        if ai_reply:
            break
        logger.warning(f"【AI生成赠语重试】encounter_id={encounter.id} attempt={attempt+1}")

    if not ai_reply:
        raise HTTPException(
            status_code=503,
            detail="古人正在斟酌赠语，请稍后再试。",
        )

    gift_words = ai_reply

    # 生成个性化徽章名
    badge_prompt = (
        f"你是{encounter.character_name}。根据后生的回答'{req.user_answer[:50]}'，"
        f"为其赐一个4-8字的精神徽章称号（如'竹林清风客'、'明月知己人'等），只输出称号本身，不要其他内容。"
    )
    badge_reply = await call_ai(system_prompt, badge_prompt, temperature=0.9)
    badge_name = badge_reply.strip().strip("'\"《》「」") if badge_reply else f"{encounter.character_name}的千年知己"

    encounter.user_answer = req.user_answer
    encounter.gift_words = gift_words
    encounter.badge_name = badge_name
    encounter.status = "completed"
    db.commit()

    logger.info(f"【缔结完成】encounter_id={encounter.id} badge={badge_name}")

    return AnswerResponse(
        gift_words=gift_words,
        badge_name=badge_name,
        badge_icon="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100",
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ancient(
    req: ChatRequest,
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """自由追问——AI + 知识库严格 RAG 防幻觉对话"""
    encounter = (
        db.query(Encounter)
        .filter(Encounter.id == req.encounter_id, Encounter.tenant_id == tenant_id)
        .first()
    )
    if not encounter:
        raise HTTPException(status_code=403, detail="访问越权")

    msg = req.message.strip()

    # 获取或初始化对话历史
    history = _encounter_chat_histories.get(encounter.id, [])
    if history is None:
        history = []
    history.append({"role": "user", "content": msg})

    system_prompt = build_system_prompt(encounter.character_name, encounter.poi_name)

    # 使用多轮对话
    ai_reply = await call_ai_with_history(
        system_prompt,
        history[-8:],
        temperature=0.7,
    )

    if not ai_reply:
        history.pop()
        raise HTTPException(
            status_code=503,
            detail="古人正在沉思，请稍后再试。",
        )

    history.append({"role": "assistant", "content": ai_reply})
    _encounter_chat_histories.set(encounter.id, history)

    # 检查防幻觉机制
    defense_keywords = ["未见记载", "非我朝所有", "不敢断言", "无法考证", "未见文献"]
    is_defended = any(kw in ai_reply for kw in defense_keywords)

    reference = (
        "🛡️ 知识库边界防御：AI 诚实回应，未编造超出史料范围的内容"
        if is_defended
        else f"📚 基于{encounter.character_name}知识库生成回复"
    )

    return ChatResponse(reply=ai_reply, reference=reference)


@router.get("/list", response_model=List[EncounterListItem])
def list_encounters(
    user_id: str = Query(..., description="用户ID"),
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """获取用户的所有神交记录（人生地理志）"""
    encounters = (
        db.query(Encounter)
        .filter(Encounter.tenant_id == tenant_id, Encounter.user_id == user_id)
        .order_by(Encounter.id.desc())
        .all()
    )
    return [
        EncounterListItem(
            id=e.id,
            character_name=e.character_name,
            poi_name=e.poi_name,
            question=e.question or "",
            user_answer=e.user_answer,
            gift_words=e.gift_words,
            badge_name=e.badge_name,
            status=e.status or "summoned",
        )
        for e in encounters
    ]


@router.get("/{encounter_id}", response_model=EncounterDetailResponse)
def get_encounter_detail(
    encounter_id: int,
    user_id: str = Query(..., description="用户ID"),
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """获取单条神交记录详情（用于精神名片）"""
    encounter = (
        db.query(Encounter)
        .filter(
            Encounter.id == encounter_id,
            Encounter.tenant_id == tenant_id,
            Encounter.user_id == user_id,
        )
        .first()
    )
    if not encounter:
        raise HTTPException(status_code=404, detail="未找到此段缘分记录")

    return EncounterDetailResponse(
        id=encounter.id,
        character_name=encounter.character_name,
        poi_name=encounter.poi_name,
        question=encounter.question or "",
        user_answer=encounter.user_answer or "",
        gift_words=encounter.gift_words or "",
        badge_name=encounter.badge_name or "",
    )
