import json
from google import genai
from google.genai import types
from app.config import settings

class GeminiAnalysisService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY

    def analyze_transcript(self, transcript_text: str) -> dict:
        if not transcript_text or not transcript_text.strip():
            return {
                "summary": "No speech recorded during meeting.",
                "decisions": [],
                "action_items": []
            }

        prompt = f"""
You are an expert AI meeting assistant. Analyze the following meeting transcript carefully and extract:
1. Executive Summary: A concise 2-3 sentence overview of the meeting discussion.
2. Key Decisions: A list of key decisions agreed upon during the meeting.
3. Action Items: A list of tasks assigned, identifying the owner and deadline ONLY if explicitly stated in the transcript. Do NOT invent owners or deadlines if not present in text.

Meeting Transcript:
"{transcript_text}"

Return ONLY a valid JSON object matching this exact schema:
{{
  "summary": "...",
  "decisions": ["...", "..."],
  "action_items": [
    {{
      "task": "...",
      "owner": "Name or null",
      "deadline": "Date/Time or null"
    }}
  ]
}}
"""

        try:
            client = genai.Client(
                api_key=self.api_key,
                http_options={'headers': {'User-Agent': 'aistudio-build'}}
            )

            response = client.models.generateContent(
                model="gemini-3.6-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )

            result_text = response.text.strip()
            parsed_data = json.loads(result_text)

            return {
                "summary": parsed_data.get("summary", "Summary unavailable."),
                "decisions": parsed_data.get("decisions", []),
                "action_items": parsed_data.get("action_items", [])
            }

        except Exception as e:
            print(f"Gemini analysis error: {e}")
            return {
                "summary": f"Meeting transcript recorded ({len(transcript_text.split())} words). Gemini analysis fallback applied.",
                "decisions": ["Review full transcript text in details view."],
                "action_items": [
                    {
                        "task": "Review recorded transcript segments",
                        "owner": "Meeting Lead",
                        "deadline": "As soon as possible"
                    }
                ]
            }

gemini_analysis_service = GeminiAnalysisService()
