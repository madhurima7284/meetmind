import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "MeetMind — Real-Time Meeting Assistant"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./meetmind.db")
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    CORS_ORIGINS: list = ["*"]

settings = Settings()
