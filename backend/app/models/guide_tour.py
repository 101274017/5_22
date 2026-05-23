"""导游讲解团模型"""
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base


class GuideTour(Base):
    """导游创建的讲解团"""
    __tablename__ = "guide_tours"

    id = Column(Integer, primary_key=True, index=True)
    guide_id = Column(String(100), nullable=False, index=True)  # 导游用户ID
    guide_name = Column(String(50), nullable=False)  # 导游姓名
    celebrity_name = Column(String(50), nullable=False)  # 名人姓名
    celebrity_age = Column(String(50), nullable=True)  # 名人年龄/时期
    poi_name = Column(String(100), nullable=False)  # 名胜古迹名称
    tour_code = Column(String(20), nullable=False, unique=True, index=True)  # 讲解团唯一码
    description = Column(Text, nullable=True)  # 讲解团描述
    status = Column(String(20), default="active")  # active / closed / expired
    created_at = Column(DateTime, default=datetime.utcnow)
    expire_at = Column(DateTime, nullable=True)  # P1-7: 过期时间
    participant_count = Column(Integer, default=0)  # 参与人数

    @property
    def is_expired(self) -> bool:
        """检查讲解团是否已过期"""
        if self.expire_at and datetime.utcnow() > self.expire_at:
            return True
        return False
