from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class TranscriptSegmentSchema(BaseModel):
    id: str
    text: str
    start_time: float
    end_time: float
    speaker: Optional[str] = "Speaker"

    class Config:
        from_attributes = True

class DecisionSchema(BaseModel):
    id: str
    text: str

    class Config:
        from_attributes = True

class ActionItemSchema(BaseModel):
    id: str
    task: str
    owner: Optional[str] = None
    deadline: Optional[str] = None
    status: str = "pending"

    class Config:
        from_attributes = True

class MeetingCreate(BaseModel):
    title: Optional[str] = "Untitled Meeting"

class MeetingAnalysis(BaseModel):
    summary: str
    decisions: List[str] = []
    action_items: List[dict] = []

class MeetingResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    status: str
    duration_seconds: int
    summary: Optional[str] = None
    segments: List[TranscriptSegmentSchema] = []
    decisions: List[DecisionSchema] = []
    action_items: List[ActionItemSchema] = []

    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    total_meetings: int
    total_duration_seconds: int
    total_action_items: int
    total_decisions: int
