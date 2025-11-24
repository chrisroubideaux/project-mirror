# backend/services/speech_recognition.py

import os
import requests

OPENAI_KEY = os.getenv("OPENAI_API_KEY")

class SpeechToTextError(Exception):
    pass

def speech_to_text(audio_bytes: bytes) -> str:
    """
    Sends raw audio bytes to Whisper API
    and returns transcribed text.
    """
    if not OPENAI_KEY:
        raise SpeechToTextError("Missing OPENAI_API_KEY")

    url = "https://api.openai.com/v1/audio/transcriptions"

    files = {
        "file": ("audio.wav", audio_bytes, "audio/wav")
    }

    data = {
        "model": "whisper-1",
        "temperature": 0.2
    }

    headers = {
        "Authorization": f"Bearer {OPENAI_KEY}"
    }

    res = requests.post(url, headers=headers, files=files, data=data)

    if res.status_code != 200:
        raise SpeechToTextError(f"Whisper Error {res.status_code}: {res.text}")

    return res.json().get("text", "").strip()
