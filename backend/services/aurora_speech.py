# backend/services/aurora_speech.py
import os
import requests

ELEVEN_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")


class SpeechServiceError(Exception):
    pass


def text_to_speech(text: str) -> bytes:
    if not ELEVEN_KEY:
        raise SpeechServiceError("Missing ELEVENLABS_API_KEY")

    if not VOICE_ID:
        raise SpeechServiceError("Missing ELEVENLABS_VOICE_ID")

    if not text or not text.strip():
        raise SpeechServiceError("Cannot generate speech from empty text")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    headers = {
        "xi-api-key": ELEVEN_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "model_id": "eleven_turbo_v2",  # ✅ FAST MODEL
        "text": text,
        "voice_settings": {
            "stability": 0.35,          # ✅ removes robotic monotone
            "similarity_boost": 0.55, 
            "style": 0.65,              # ✅ emotional cadence
            "use_speaker_boost": True,
        },
        "optimize_streaming_latency": 2,  # ✅ MAJOR speed-up
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=15)
    except Exception as e:
        raise SpeechServiceError(f"Request failed: {e}")

    if res.status_code != 200:
        raise SpeechServiceError(f"ElevenLabs Error {res.status_code}: {res.text}")

    return res.content




""""""""""""""""
import os
import requests

ELEVEN_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")  # Default voice

class SpeechServiceError(Exception):
    pass

def text_to_speech(text: str) -> bytes:
   
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
"""""""""""