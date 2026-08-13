from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.services.meeting_analysis import gemini_analysis_service

router = APIRouter(prefix="/api", tags=["Meetings"])

@router.post("/meetings", response_model=schemas.MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    meeting = models.Meeting(title=payload.title or "Untitled Meeting", status="active")
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting

@router.get("/meetings", response_model=List[schemas.MeetingResponse])
def list_meetings(db: Session = Depends(get_db)):
    return db.query(models.Meeting).order_by(models.Meeting.created_at.desc()).all()

@router.get("/meetings/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    meetings = db.query(models.Meeting).all()
    total_meetings = len(meetings)
    total_duration = sum(m.duration_seconds or 0 for m in meetings)
    total_action_items = db.query(models.ActionItem).count()
    total_decisions = db.query(models.Decision).count()

    return {
        "total_meetings": total_meetings,
        "total_duration_seconds": total_duration,
        "total_action_items": total_action_items,
        "total_decisions": total_decisions
    }

@router.get("/meetings/{meeting_id}", response_model=schemas.MeetingResponse)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@router.delete("/meetings/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(meeting)
    db.commit()
    return None

@router.post("/meetings/{meeting_id}/analyze", response_model=schemas.MeetingResponse)
def analyze_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    full_transcript = " ".join([seg.text for seg in meeting.segments if seg.text])
    analysis = gemini_analysis_service.analyze_transcript(full_transcript)

    # Save summary
    meeting.summary = analysis.get("summary")
    meeting.status = "completed"
    meeting.ended_at = datetime.now(timezone.utc)

    # Clear old decisions & action items
    db.query(models.Decision).filter(models.Decision.meeting_id == meeting_id).delete()
    db.query(models.ActionItem).filter(models.ActionItem.meeting_id == meeting_id).delete()

    for dec in analysis.get("decisions", []):
        db.add(models.Decision(meeting_id=meeting_id, text=dec))

    for item in analysis.get("action_items", []):
        task = item.get("task") if isinstance(item, dict) else str(item)
        owner = item.get("owner") if isinstance(item, dict) else None
        deadline = item.get("deadline") if isinstance(item, dict) else None
        if owner == "null" or owner == "None":
            owner = None
        if deadline == "null" or deadline == "None":
            deadline = None
        
        if task:
            db.add(models.ActionItem(
                meeting_id=meeting_id,
                task=task,
                owner=owner,
                deadline=deadline,
                status="pending"
            ))

    db.commit()
    db.refresh(meeting)
    return meeting

@router.patch("/action-items/{item_id}")
def toggle_action_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(models.ActionItem).filter(models.ActionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    
    item.status = "completed" if item.status == "pending" else "pending"
    db.commit()
    return {"id": item.id, "status": item.status}
