"""名人对话路由 - 支持任意中外名人"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Encounter
from app.ai_client import call_ai_with_history
from app.celebrity_engine import (
    research_celebrity,
    build_celebrity_system_prompt,
    generate_opening,
    generate_card_summary,
    get_cached_celebrity,
)

logger = logging.getLogger("AncientEncounter")
router = APIRouter(prefix="/api/v1/celebrity", tags=["celebrity"])

# 内存中存储对话历史
_chat_histories: dict[int, list[dict]] = {}


@router.post("/start")
async def start_celebrity_chat(
    body: dict,
    db: Session = Depends(get_db),
):
    """
    开始与名人对话
    body: { "user_id": str, "celebrity_name": str }
    """
    user_id = body.get("user_id", "")
    celebrity_name = body.get("celebrity_name", "").strip()

    if not celebrity_name:
        raise HTTPException(status_code=400, detail="请输入名人名字")
    if not user_id:
        raise HTTPException(status_code=400, detail="缺少用户ID")

    # AI 研究名人资料
    logger.info(f"【开始研究名人】{celebrity_name} 用户={user_id}")
    celebrity_data = await research_celebrity(celebrity_name)

    if not celebrity_data:
        raise HTTPException(status_code=503, detail="正在研究该名人的资料，请稍后再试。")

    # 生成开场白
    opening = await generate_opening(celebrity_data)
    if not opening:
        raise HTTPException(status_code=503, detail="名人正在穿越时空，请稍后再试。")

    # 创建对话记录
    encounter = Encounter(
        tenant_id="celebrity_chat",
        user_id=user_id,
        character_name=celebrity_name,
        poi_name=celebrity_data.get("identity", "名人"),
        question=opening,
        status="chatting",
    )
    db.add(encounter)
    db.commit()
    db.refresh(encounter)

    # 初始化对话历史
    _chat_histories[encounter.id] = [
        {"role": "assistant", "content": opening}
    ]

    logger.info(f"【名人对话开始】{celebrity_name} encounter_id={encounter.id}")

    return {
        "encounter_id": encounter.id,
        "celebrity_name": celebrity_name,
        "identity": celebrity_data.get("identity", ""),
        "era": celebrity_data.get("era", ""),
        "opening": opening,
    }


@router.post("/chat")
async def chat_with_celebrity(
    body: dict,
    db: Session = Depends(get_db),
):
    """
    与名人对话
    body: { "encounter_id": int, "message": str }
    返回: { "reply": str, "message_count": int }
    """
    encounter_id = body.get("encounter_id")
    message = body.get("message", "").strip()

    if not encounter_id or not message:
        raise HTTPException(status_code=400, detail="参数不完整")

    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="对话记录不存在")

    # 获取名人资料
    celebrity_data = get_cached_celebrity(encounter.character_name)
    if not celebrity_data:
        celebrity_data = await research_celebrity(encounter.character_name)
        if not celebrity_data:
            raise HTTPException(status_code=503, detail="名人资料加载失败，请重试")

    # 获取对话历史
    history = _chat_histories.get(encounter_id, [])
    history.append({"role": "user", "content": message})

    # 构建系统提示词并调用 AI
    system_prompt = build_celebrity_system_prompt(celebrity_data)
    reply = await call_ai_with_history(system_prompt, history[-10:], temperature=0.8)

    if not reply:
        history.pop()
        raise HTTPException(status_code=503, detail="名人正在思考，请稍后再试。")

    history.append({"role": "assistant", "content": reply})
    _chat_histories[encounter_id] = history

    user_message_count = sum(1 for msg in history if msg["role"] == "user")

    return {
        "reply": reply,
        "message_count": user_message_count,
    }


@router.post("/generate-card")
async def generate_celebrity_card(
    body: dict,
    db: Session = Depends(get_db),
):
    """
    生成精神名片（需要至少2条用户消息）
    body: { "encounter_id": int }
    """
    encounter_id = body.get("encounter_id")
    if not encounter_id:
        raise HTTPException(status_code=400, detail="参数不完整")

    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="对话记录不存在")

    history = _chat_histories.get(encounter_id, [])
    user_message_count = sum(1 for msg in history if msg["role"] == "user")

    if user_message_count < 2:
        raise HTTPException(status_code=400, detail="至少需要与名人对话2轮才能生成名片")

    celebrity_data = get_cached_celebrity(encounter.character_name)
    if not celebrity_data:
        celebrity_data = await research_celebrity(encounter.character_name)
        if not celebrity_data:
            raise HTTPException(status_code=503, detail="名人资料加载失败")

    card_data = await generate_card_summary(celebrity_data, history)
    if not card_data:
        raise HTTPException(status_code=503, detail="名片生成中，请稍后再试")

    gift_words = card_data.get("gift_words", f"与{encounter.character_name}的跨时空对话")
    badge_name = card_data.get("badge_name", f"{encounter.character_name}的知己")

    encounter.gift_words = gift_words
    encounter.badge_name = badge_name
    encounter.status = "completed"
    db.commit()

    return {
        "gift_words": gift_words,
        "badge_name": badge_name,
        "celebrity_name": encounter.character_name,
        "identity": celebrity_data.get("identity", ""),
        "era": celebrity_data.get("era", ""),
    }


@router.get("/list")
def list_celebrity_encounters(
    user_id: str = Query(..., description="用户ID"),
    db: Session = Depends(get_db),
):
    """获取用户的名人对话记录"""
    encounters = (
        db.query(Encounter)
        .filter(Encounter.user_id == user_id, Encounter.tenant_id == "celebrity_chat")
        .order_by(Encounter.id.desc())
        .all()
    )
    return [
        {
            "id": e.id,
            "character_name": e.character_name,
            "identity": e.poi_name,
            "gift_words": e.gift_words,
            "badge_name": e.badge_name,
            "status": e.status or "chatting",
        }
        for e in encounters
    ]


@router.get("/{encounter_id}")
def get_celebrity_detail(
    encounter_id: int,
    db: Session = Depends(get_db),
):
    """获取名人对话详情"""
    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="未找到此段对话记录")

    return {
        "id": encounter.id,
        "character_name": encounter.character_name,
        "identity": encounter.poi_name,
        "gift_words": encounter.gift_words or "",
        "badge_name": encounter.badge_name or "",
        "status": encounter.status,
    }
