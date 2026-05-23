"""导游讲解团模型"""
from datetime import datetime, timedelta, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base


class GuideTour(Base):
    """导游创建的讲解团"""
    __tablename__ = "guide_tours"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(50), nullable=False, index=True)
    guide_id = Column(String(100), nullable=False, index=True)
    guide_name = Column(String(50), nullable=False)
    celebrity_name = Column(String(50), nullable=False)
    celebrity_age = Column(String(50), nullable=True)
    poi_name = Column(String(100), nullable=False)
    tour_code = Column(String(20), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expire_at = Column(DateTime, nullable=True)
    participant_count = Column(Integer, default=0)

    @property
    def is_expired(self) -> bool:
        """检查讲解团是否已过期"""
        if self.expire_at and datetime.now(timezone.utc) > self.expire_at:
            return True
        return False
