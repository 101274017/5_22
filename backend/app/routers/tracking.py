"""技术埋点路由"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.tenant import get_tenant_id
from app.models import TrackingLog
from app.schemas import TrackRequest, TrackResponse

logger = logging.getLogger("AncientEncounter")
router = APIRouter(prefix="/api/v1", tags=["tracking"])


@router.post("/track", response_model=TrackResponse)
def save_tracking(
    req: TrackRequest,
    tenant_id: str = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    """接收前端技术埋点事件并持久化"""
    log = TrackingLog(
        tenant_id=tenant_id,
        event_type=req.event_type,
        event_key=req.event_key,
        payload=req.payload,
    )
    db.add(log)
    db.commit()

    logger.info(
        f"【埋点记录】租户={tenant_id} type={req.event_type} key={req.event_key}"
    )

    return TrackResponse(success=True, status="event_tracked")
