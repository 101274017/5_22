"""导游讲解团路由"""
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.tenant import get_tenant_id
from app.models.guide_tour import GuideTour
from app.schemas.guide import (
    CreateTourRequest,
    CreateTourResponse,
    JoinTourRequest,
    JoinTourResponse,
    TourNarrateRequest,
    TourNarrateResponse,
    TourListItem,
)
from app.ai_client import call_ai, call_ai_with_history
from app.knowledge_base import get_character_knowledge
from app.celebrity_engine import research_celebrity, build_celebrity_system_prompt
from app.strong_links import check_celebrity_poi_link
from app.utils.bounded_cache import BoundedHistoryCache

logger = logging.getLogger("AncientEncounter")
router = APIRouter(prefix="/api/v1/guide", tags=["guide"])

# 有界缓存：存储讲解对话历史
_tour_chat_histories = BoundedHistoryCache[str, list[dict]](maxsize=500)


def _generate_tour_code() -> str:
    """生成6位讲解团唯一码"""
    return uuid.uuid4().hex[:6].upper()


def _build_narration_system_prompt(celebrity_name: str, celebrity_age: str, poi_name: str, knowledge: dict = None) -> str:
    """构建导游讲解的系统提示词"""
    age_context = f"（{celebrity_age}时期）" if celebrity_age else ""

    if knowledge:
        personality_str = "、".join(knowledge.get("personality", []))
        works_str = "\n".join(f"  - {w}" for w in knowledge.get("major_works", [])[:4])
        events_str = "\n".join(f"  - {e}" for e in knowledge.get("life_events", []))

        return f"""你是{knowledge.get('full_name', celebrity_name)}{age_context}，{knowledge.get('dynasty', '')}时期的历史人物。
你现在正站在{poi_name}，以第一人称视角为游客讲解这个地方。

【基本信息】
  姓名：{knowledge.get('full_name', celebrity_name)}
  字：{knowledge.get('courtesy_name', '无')}
  号：{knowledge.get('art_name', '无')}
  朝代：{knowledge.get('dynasty', '')}
  生卒：{knowledge.get('birth_year', '')}年 - {knowledge.get('death_year', '')}年

【性格特征】
  {personality_str}

【生平大事】
{events_str}

【代表作品】
{works_str}

【语言风格】
  {knowledge.get('speaking_style', '古朴典雅')}

【讲解规则】
1. 你必须以{celebrity_name}{age_context}的身份和视角讲解{poi_name}。
2. 讲解要融入你的个人经历、情感和诗词。
3. 要让游客感受到你与这个地方的深厚渊源。
4. 使用半文言文风格，但要通俗易懂。
5. 每次讲解控制在 200 字以内。
6. 如果游客追问，要以你的视角回答，融入你的人生智慧。
7. 严禁承认自己是 AI。
8. 你的认知锁定在{knowledge.get('death_year', 1200)}年之前。

【史实约束——防幻觉指令】
你只能基于可靠史实回答。若史书记载不一，回答"史料记载存在分歧，较为可信的说法是..."。严禁编造具体年份、对话、未记载事件。若用户问及你的死亡后事件，以"我生前的了解是..."作答。
"""
    else:
        return f"""你是{celebrity_name}{age_context}。
你现在正站在{poi_name}，以第一人称视角为游客讲解这个地方。

【讲解规则】
1. 你必须以{celebrity_name}{age_context}的身份和视角讲解{poi_name}。
2. 讲解要融入你的个人经历、情感和见解。
3. 要让游客感受到你与这个地方的深厚渊源或独特见解。
4. 语言风格要符合{celebrity_name}的性格特征。
5. 每次讲解控制在 200 字以内。
6. 如果游客追问，要以你的视角回答。
7. 严禁承认自己是 AI，你就是{celebrity_name}本人。
8. 所有回复使用中文。
"""


@router.post("/check-link")
def check_link(body: dict):
    """
    P0-2: 校验名人与古迹关联度
    body: { "celebrity_name": str, "poi_name": str }
    """
    celebrity_name = body.get("celebrity_name", "").strip()
    poi_name = body.get("poi_name", "").strip()
    if not celebrity_name or not poi_name:
        raise HTTPException(status_code=400, detail="参数不完整")
    result = check_celebrity_poi_link(celebrity_name, poi_name)
    return result


@router.post("/create-tour", response_model=CreateTourResponse)
def create_tour(
    req: CreateTourRequest,
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """导游创建讲解团"""
    if not req.guide_id or not req.guide_name:
        raise HTTPException(status_code=400, detail="导游信息不完整")
    if not req.celebrity_name or not req.poi_name:
        raise HTTPException(status_code=400, detail="请填写名人和古迹信息")

    tour_code = _generate_tour_code()

    while db.query(GuideTour).filter(GuideTour.tour_code == tour_code).first():
        tour_code = _generate_tour_code()

    tour = GuideTour(
        tenant_id=tenant_id,
        guide_id=req.guide_id,
        guide_name=req.guide_name,
        celebrity_name=req.celebrity_name,
        celebrity_age=req.celebrity_age,
        poi_name=req.poi_name,
        tour_code=tour_code,
        description=req.description,
        status="active",
        expire_at=datetime.now(timezone.utc) + timedelta(hours=2),
    )
    db.add(tour)
    db.commit()
    db.refresh(tour)

    logger.info(f"【导游创建讲解团】租户={tenant_id} 导游={req.guide_name} 名人={req.celebrity_name} 古迹={req.poi_name} code={tour_code}")

    return CreateTourResponse(
        tour_id=tour.id,
        tour_code=tour_code,
    )


@router.post("/join-tour", response_model=JoinTourResponse)
def join_tour(
    req: JoinTourRequest,
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """游客扫码加入讲解团"""
    tour = db.query(GuideTour).filter(
        GuideTour.tour_code == req.tour_code,
        GuideTour.tenant_id == tenant_id,
    ).first()
    if not tour:
        raise HTTPException(status_code=404, detail="讲解团不存在或已关闭")
    if tour.status != "active":
        raise HTTPException(status_code=400, detail="该讲解团已结束")
    if tour.is_expired:
        tour.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="该讲解团已过期（超过2小时）")

    tour.participant_count += 1
    db.commit()

    logger.info(f"【游客加入讲解团】租户={tenant_id} code={req.tour_code} user={req.user_id} 当前人数={tour.participant_count}")

    return JoinTourResponse(
        tour_id=tour.id,
        guide_name=tour.guide_name,
        celebrity_name=tour.celebrity_name,
        celebrity_age=tour.celebrity_age,
        poi_name=tour.poi_name,
        description=tour.description,
    )


@router.post("/narrate", response_model=TourNarrateResponse)
async def narrate_tour(
    req: TourNarrateRequest,
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """名人视角讲解（首次生成开场讲解，后续为追问回答）"""
    tour = db.query(GuideTour).filter(
        GuideTour.id == req.tour_id,
        GuideTour.tenant_id == tenant_id,
    ).first()
    if not tour:
        raise HTTPException(status_code=404, detail="讲解团不存在")

    chat_key = f"{tour.id}_{req.user_id}"
    knowledge = get_character_knowledge(tour.celebrity_name)

    celebrity_data = None
    if not knowledge:
        celebrity_data = await research_celebrity(tour.celebrity_name)

    if knowledge:
        system_prompt = _build_narration_system_prompt(
            tour.celebrity_name, tour.celebrity_age, tour.poi_name, knowledge
        )
    elif celebrity_data:
        system_prompt = build_celebrity_system_prompt(celebrity_data)
        system_prompt += f"""

【额外讲解规则】
你现在正站在{tour.poi_name}，以第一人称视角为游客讲解这个地方。
1. 讲解要融入你的个人经历和见解。
2. 每次讲解控制在 200 字以内。
3. 如果游客追问，以你的视角回答。
"""
    else:
        system_prompt = _build_narration_system_prompt(
            tour.celebrity_name, tour.celebrity_age, tour.poi_name
        )

    history = _tour_chat_histories.get(chat_key, [])
    if history is None:
        history = []

    if req.message:
        history.append({"role": "user", "content": req.message})
    elif not history:
        age_context = f"（{tour.celebrity_age}时期）" if tour.celebrity_age else ""
        first_prompt = f"请以{tour.celebrity_name}{age_context}的身份，为刚到{tour.poi_name}的游客做一段开场讲解。要融入你的个人经历和情感，让游客感受到这个地方的历史韵味和你与此地的渊源。"
        history.append({"role": "user", "content": first_prompt})

    reply = await call_ai_with_history(system_prompt, history[-10:], temperature=0.8)

    if not reply:
        raise HTTPException(status_code=503, detail="名人正在酝酿讲解词，请稍后再试。")

    history.append({"role": "assistant", "content": reply})
    _tour_chat_histories.set(chat_key, history)

    return TourNarrateResponse(
        narration=reply,
        celebrity_name=tour.celebrity_name,
        poi_name=tour.poi_name,
    )


@router.get("/my-tours", response_model=List[TourListItem])
def list_guide_tours(
    guide_id: str = Query(..., description="导游ID"),
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """获取导游创建的所有讲解团"""
    tours = (
        db.query(GuideTour)
        .filter(GuideTour.guide_id == guide_id, GuideTour.tenant_id == tenant_id)
        .order_by(GuideTour.id.desc())
        .all()
    )
    return [
        TourListItem(
            id=t.id,
            celebrity_name=t.celebrity_name,
            celebrity_age=t.celebrity_age,
            poi_name=t.poi_name,
            tour_code=t.tour_code,
            status="expired" if t.is_expired else t.status,
            participant_count=t.participant_count,
            description=t.description,
            created_at=t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else None,
            is_expired=t.is_expired,
        )
        for t in tours
    ]


@router.post("/close-tour")
def close_tour(
    body: dict,
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """导游关闭讲解团"""
    tour_id = body.get("tour_id")
    guide_id = body.get("guide_id")

    if not tour_id or not guide_id:
        raise HTTPException(status_code=400, detail="参数不完整")

    tour = db.query(GuideTour).filter(
        GuideTour.id == tour_id,
        GuideTour.guide_id == guide_id,
        GuideTour.tenant_id == tenant_id,
    ).first()

    if not tour:
        raise HTTPException(status_code=404, detail="讲解团不存在或无权操作")

    tour.status = "closed"
    db.commit()

    logger.info(f"【导游关闭讲解团】租户={tenant_id} tour_id={tour_id} guide={guide_id}")

    return {"success": True, "message": "讲解团已关闭"}
