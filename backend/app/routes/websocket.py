import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.services.transcription import transcription_service

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, meeting_id: str, websocket: WebSocket):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        self.active_connections[meeting_id].append(websocket)

    def disconnect(self, meeting_id: str, websocket: WebSocket):
        if meeting_id in self.active_connections:
            if websocket in self.active_connections[meeting_id]:
                self.active_connections[meeting_id].remove(websocket)
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]

    async def broadcast(self, meeting_id: str, message: dict):
        if meeting_id in self.active_connections:
            for connection in self.active_connections[meeting_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/ws/health")
async def health_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        await websocket.send_json({"type": "connected", "status": "ok"})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass

@router.websocket("/ws/meetings/{meeting_id}")
async def meeting_websocket_endpoint(websocket: WebSocket, meeting_id: str):
    await manager.connect(meeting_id, websocket)
    db: Session = SessionLocal()
    
    try:
        while True:
            # Receive either binary audio data or text commands
            message = await websocket.receive()
            
            if "bytes" in message and message["bytes"]:
                audio_bytes = message["bytes"]
                # Transcribe audio chunk with Whisper
                transcript_text = transcription_service.transcribe_audio_bytes(audio_bytes)
                
                if transcript_text and transcript_text.strip():
                    # Save transcript segment
                    segment = models.TranscriptSegment(
                        meeting_id=meeting_id,
                        text=transcript_text.strip(),
                        start_time=0.0,
                        end_time=0.0,
                        speaker="Speaker"
                    )
                    db.add(segment)
                    db.commit()
                    db.refresh(segment)

                    # Broadcast update to frontend clients
                    await manager.broadcast(meeting_id, {
                        "type": "transcript_segment",
                        "segment": {
                            "id": segment.id,
                            "text": segment.text,
                            "start_time": segment.start_time,
                            "end_time": segment.end_time,
                            "speaker": segment.speaker
                        }
                    })
            
            elif "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")

                    if msg_type == "text_segment":
                        text = data.get("text", "").strip()
                        speaker = data.get("speaker", "Speaker")
                        if text:
                            segment = models.TranscriptSegment(
                                meeting_id=meeting_id,
                                text=text,
                                start_time=data.get("start_time", 0.0),
                                end_time=data.get("end_time", 0.0),
                                speaker=speaker
                            )
                            db.add(segment)
                            db.commit()
                            db.refresh(segment)

                            await manager.broadcast(meeting_id, {
                                "type": "transcript_segment",
                                "segment": {
                                    "id": segment.id,
                                    "text": segment.text,
                                    "start_time": segment.start_time,
                                    "end_time": segment.end_time,
                                    "speaker": segment.speaker
                                }
                            })
                    
                    elif msg_type == "update_duration":
                        meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
                        if meeting:
                            meeting.duration_seconds = data.get("duration", 0)
                            db.commit()

                except json.JSONDecodeError:
                    pass

    except WebSocketDisconnect:
        manager.disconnect(meeting_id, websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(meeting_id, websocket)
    finally:
        db.close()
