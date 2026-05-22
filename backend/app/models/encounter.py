"""用户神交资产记录模型"""
from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(50), nullable=False, index=True)
    user_id = Column(String(100), nullable=False)
    character_name = Column(String(50), nullable=False)
    poi_name = Column(String(100), nullable=False)
    question = Column(Text, nullable=False)
    user_answer = Column(Text, nullable=True)
    gift_words = Column(Text, nullable=True)
    badge_name = Column(String(100), nullable=True)
    status = Column(String(20), default="summoned")
