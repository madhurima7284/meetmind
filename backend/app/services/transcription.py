import os
import tempfile
from app.config import settings

class WhisperTranscriptionService:
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.WHISPER_MODEL
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                import whisper
                self._model = whisper.load_model(self.model_name)
            except Exception as e:
                print(f"Whisper model load error: {e}")
                return None
        return self._model

    def transcribe_audio_bytes(self, audio_bytes: bytes) -> str:
        if not audio_bytes:
            return ""
        
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name

        try:
            model = self._get_model()
            if model is None:
                return ""
            result = model.transcribe(temp_file_path)
            return result.get("text", "").strip()
        except Exception as e:
            print(f"Transcription error: {e}")
            return ""
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

transcription_service = WhisperTranscriptionService()

