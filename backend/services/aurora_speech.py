# backend/services/aurora_speech.py

import os
import requests

ELEVEN_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")  # Default voice

class SpeechServiceError(Exception):
    pass

def text_to_speech(text: str) -> bytes:
    """
    Sends Aurora's response to ElevenLabs
    and returns raw audio bytes (mp3).
    """
    if not ELEVEN_KEY:
        raise SpeechServiceError("Missing ELEVENLABS_API_KEY")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    headers = {
        "xi-api-key": ELEVEN_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "text": text,
        "voice_settings": {
            "stability": 0.4,
            "similarity_boost": 0.85
        }
    }

    res = requests.post(url, headers=headers, json=payload)

    if res.status_code != 200:
        raise SpeechServiceError(f"ElevenLabs Error {res.status_code}: {res.text}")

    return res.content  # MP3 bytes
