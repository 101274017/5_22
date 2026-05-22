"""古迹与古人配置模型"""
from sqlalchemy import Column, Integer, String, Float, Text
from app.database import Base


class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(50), nullable=False, index=True)
    poi_name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius = Column(Integer, default=500)
    character_name = Column(String(50), nullable=False)
    avatar_url = Column(String(255), nullable=True)
    system_prompt = Column(Text, nullable=True)
    opening_speech = Column(Text, nullable=True)
    question = Column(Text, nullable=True)
