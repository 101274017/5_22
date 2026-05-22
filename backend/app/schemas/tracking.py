"""技术埋点 DTO"""
from pydantic import BaseModel


class TrackRequest(BaseModel):
    event_type: str
    event_key: str
    payload: str = ""


class TrackResponse(BaseModel):
    success: bool
    status: str
