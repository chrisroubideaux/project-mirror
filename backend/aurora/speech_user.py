# backend/aurora/speech_user.py

from __future__ import annotations

import os
import uuid
from pathlib import Path

import requests
from flask import current_app


ELEVEN_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5000")


class AuroraSpeechError(Exception):
    pass


def text_to_speech_bytes(text: str) -> bytes:
    if not ELEVEN_KEY:
        raise AuroraSpeechError("Missing ELEVENLABS_API_KEY")

    if not VOICE_ID:
        raise AuroraSpeechError("Missing ELEVENLABS_VOICE_ID")

    if not text or not text.strip():
        raise AuroraSpeechError("Cannot generate speech from empty text")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    headers = {
        "xi-api-key": ELEVEN_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    payload = {
        "model_id": "eleven_turbo_v2",
        "text": text,
        "voice_settings": {
            "stability": 0.35,
            "similarity_boost": 0.55,
            "style": 0.65,
            "use_speaker_boost": True,
        },
        "optimize_streaming_latency": 2,
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=20)
    except Exception as e:
        raise AuroraSpeechError(f"ElevenLabs request failed: {e}")

    if res.status_code != 200:
        raise AuroraSpeechError(f"ElevenLabs Error {res.status_code}: {res.text}")

    if not res.content:
        raise AuroraSpeechError("ElevenLabs returned empty audio content")

    return res.content


def generate_and_store_user_speech(
    text: str,
    user_id: str,
    session_id: str,
) -> str | None:
    """
    Generates Aurora reply audio, stores it inside Flask's real static folder,
    and returns a dedicated Aurora audio endpoint URL.
    """
    try:
        audio_bytes = text_to_speech_bytes(text)

        static_root = Path(current_app.static_folder)
        user_dir = static_root / "audio" / "aurora" / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{session_id}_{uuid.uuid4().hex}.mp3"
        filepath = user_dir / filename

        with open(filepath, "wb") as f:
            f.write(audio_bytes)

        if not filepath.exists():
            raise AuroraSpeechError(f"Audio file was not created: {filepath}")

        file_size = filepath.stat().st_size
        if file_size <= 0:
            raise AuroraSpeechError(f"Audio file is empty: {filepath}")

        public_url = f"{APP_BASE_URL}/api/user/aurora/audio/{user_id}/{filename}"

        print("\n===== AURORA AUDIO DEBUG =====")
        print("Flask static folder:", static_root)
        print("Saved file:", filepath)
        print("File size:", file_size)
        print("Public URL:", public_url)
        print("==============================\n")

        return public_url

    except Exception as e:
        print("\n!!!! AURORA SPEECH ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return None


""""""""""""""""""""""""""""""""""""""""
# backend/aurora/speech_user.py
from __future__ import annotations

import os
import uuid
from pathlib import Path

import requests
from flask import current_app


ELEVEN_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5000")


class AuroraSpeechError(Exception):
    pass


def text_to_speech_bytes(text: str) -> bytes:
    if not ELEVEN_KEY:
        raise AuroraSpeechError("Missing ELEVENLABS_API_KEY")

    if not VOICE_ID:
        raise AuroraSpeechError("Missing ELEVENLABS_VOICE_ID")

    if not text or not text.strip():
        raise AuroraSpeechError("Cannot generate speech from empty text")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    headers = {
        "xi-api-key": ELEVEN_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    payload = {
        "model_id": "eleven_turbo_v2",
        "text": text,
        "voice_settings": {
            "stability": 0.35,
            "similarity_boost": 0.55,
            "style": 0.65,
            "use_speaker_boost": True,
        },
        "optimize_streaming_latency": 2,
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=20)
    except Exception as e:
        raise AuroraSpeechError(f"ElevenLabs request failed: {e}")

    if res.status_code != 200:
        raise AuroraSpeechError(f"ElevenLabs Error {res.status_code}: {res.text}")

    if not res.content:
        raise AuroraSpeechError("ElevenLabs returned empty audio content")

    return res.content


def generate_and_store_user_speech(
    text: str,
    user_id: str,
    session_id: str,
) -> str | None:
    
    try:
        audio_bytes = text_to_speech_bytes(text)

        static_root = Path(current_app.static_folder)
        user_dir = static_root / "audio" / "aurora" / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{session_id}_{uuid.uuid4().hex}.mp3"
        filepath = user_dir / filename

        with open(filepath, "wb") as f:
            f.write(audio_bytes)

        if not filepath.exists():
            raise AuroraSpeechError(f"Audio file was not created: {filepath}")

        file_size = filepath.stat().st_size
        if file_size <= 0:
            raise AuroraSpeechError(f"Audio file is empty: {filepath}")

        public_url = f"{APP_BASE_URL}/static/audio/aurora/{user_id}/{filename}"

        print("\n===== AURORA AUDIO DEBUG =====")
        print("Flask static folder:", static_root)
        print("Saved file:", filepath)
        print("File size:", file_size)
        print("Public URL:", public_url)
        print("==============================\n")

        return public_url

    except Exception as e:
        print("\n!!!! AURORA SPEECH ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return None





"""""""""""""""""""""""""""""""""""""""""""""