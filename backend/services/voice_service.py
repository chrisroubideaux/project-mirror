# backend/services/voice_service.py

import uuid
from datetime import datetime

from services.aurora_speech import text_to_speech, SpeechServiceError
from gcs_client import upload_file_to_gcs


class VoiceGenerationError(Exception):
    pass


def generate_voice_and_store(text: str, user_id: str, session_id: str) -> str | None:
    """
    Generates ElevenLabs voice, uploads to GCS, returns public URL.
    Returns None if generation fails (non-blocking).
    """

    try:
        audio_bytes = text_to_speech(text)
    except SpeechServiceError:
        return None

    filename = f"aurora/{user_id}/{session_id}/{uuid.uuid4()}.mp3"

    try:
        url = upload_file_to_gcs(
            file_bytes=audio_bytes,
            destination_blob_name=filename,
            content_type="audio/mpeg"
        )
    except Exception:
        return None

    return url
