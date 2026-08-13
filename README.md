# MeetMind — Real-Time Meeting Assistant

MeetMind is an AI-powered meeting transcription and intelligence platform. It streams microphone audio in near real time, generates progressive speech transcripts using OpenAI Whisper, and automatically extracts executive summaries, key decisions, and action items (with owners and deadlines) using Gemini 3.6 Flash.

## Architecture

```
Browser (React + WebSockets)
       │ (Microphone Chunk Stream)
       ▼
Full-Stack Server / FastAPI (Port 3000 / 8000)
       ├── Speech Recognition (Whisper Model)
       ├── AI Intelligence & JSON Extraction (Gemini 3.6 Flash)
       └── Database Storage (PostgreSQL / SQLite)
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Python FastAPI / Node.js Express, WebSockets, SQLAlchemy, Pydantic
- **AI Models**: OpenAI Whisper (Speech-to-Text), Gemini 3.6 Flash (Summarization & Action Item Extraction)
- **Database**: PostgreSQL / SQLite

## Environment Variables

Copy `.env.example` to `.env`:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
DATABASE_URL="postgresql://meetmind:meetmind_password@localhost:5432/meetmind_db"
WHISPER_MODEL="base"
```

## Running Locally

### Option 1: Full-Stack App (Vite + Node Server on Port 3000)

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Option 2: Python FastAPI Backend

```bash
cd backend
python -m venv venv
# On Linux/macOS:
source venv/bin/activate
# On Windows:
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Option 3: Docker Compose (PostgreSQL + FastAPI)

```bash
docker-compose up --build
```

## Real-Time Audio & Transcription Flow

1. User initiates meeting in React interface ("Start Meeting").
2. `MediaRecorder` captures audio slices (every 2-3 seconds) from browser microphone.
3. Audio chunks are sent via WebSocket to the server (`/ws/meetings/{meeting_id}`).
4. The backend processes chunks through Whisper ASR and broadcasts new transcript segments.
5. React app receives WebSocket segment messages and updates the transcript UI in real time.

## Gemini Intelligence Flow

1. When the meeting ends, the full concatenated transcript is sent to Gemini 3.6 Flash.
2. Gemini returns structured JSON containing:
   - Executive Summary
   - Key Decisions
   - Action Items (with explicit Owner and Deadline fields)
3. Results are saved to the database and displayed in the React dashboard.
