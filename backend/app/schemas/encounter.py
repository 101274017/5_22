"""神交业务 DTO"""
from typing import Optional
from pydantic import BaseModel


class SummonRequest(BaseModel):
    user_id: str
    poi_name: str


class SummonResponse(BaseModel):
    encounter_id: int
    character_name: str
    opening_speech: str
    question: str


class AnswerRequest(BaseModel):
    encounter_id: int
    user_answer: str


class AnswerResponse(BaseModel):
    gift_words: str
    badge_name: str
    badge_icon: str


class ChatRequest(BaseModel):
    encounter_id: int
    message: str


class ChatResponse(BaseModel):
    reply: str
    reference: str


class EncounterListItem(BaseModel):
    id: int
    character_name: str
    poi_name: str
    question: str
    user_answer: Optional[str] = None
    gift_words: Optional[str] = None
    badge_name: Optional[str] = None
    status: str


class EncounterDetailResponse(BaseModel):
    id: int
    character_name: str
    poi_name: str
    question: str
    user_answer: str
    gift_words: str
    badge_name: str
