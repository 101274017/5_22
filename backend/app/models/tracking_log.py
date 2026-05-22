"""多租户技术埋点与日志审计模型"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base


class TrackingLog(Base):
    __tablename__ = "tracking_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(50), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    event_key = Column(String(100), nullable=False)
    payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
