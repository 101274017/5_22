"""导游讲解团 DTO"""
from typing import Optional
from pydantic import BaseModel


class CreateTourRequest(BaseModel):
    guide_id: str
    guide_name: str
    celebrity_name: str
    celebrity_age: Optional[str] = None
    poi_name: str
    description: Optional[str] = None


class CreateTourResponse(BaseModel):
    tour_id: int
    tour_code: str


class JoinTourRequest(BaseModel):
    user_id: str
    tour_code: str


class JoinTourResponse(BaseModel):
    tour_id: int
    guide_name: str
    celebrity_name: str
    celebrity_age: Optional[str] = None
    poi_name: str
    description: Optional[str] = None


class TourNarrateRequest(BaseModel):
    tour_id: int
    user_id: str
    message: Optional[str] = None  # 用户追问（可选）


class TourNarrateResponse(BaseModel):
    narration: str
    celebrity_name: str
    poi_name: str


class TourListItem(BaseModel):
    id: int
    celebrity_name: str
    celebrity_age: Optional[str] = None
    poi_name: str
    tour_code: str
    status: str
    participant_count: int
    description: Optional[str] = None
    created_at: Optional[str] = None
    is_expired: bool = False
