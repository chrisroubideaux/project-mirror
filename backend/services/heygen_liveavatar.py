# backend/services/heygen_liveavatar.py
import os
import requests
import time

HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY")
HEYGEN_AVATAR_ID = os.getenv("HEYGEN_AVATAR_ID")
HEYGEN_VOICE_ID = os.getenv("HEYGEN_VOICE_ID")

HEYGEN_BASE_URL = "https://api.heygen.com"


class HeyGenError(Exception):
    pass


# ------------------------------------------------------
# ✅ CREATE A LIVE AVATAR SESSION (WebRTC Broker)
# ------------------------------------------------------
def create_liveavatar_session():
    """
    Creates a new real-time LiveAvatar streaming session.
    Returns:
        {
            "session_id": "...",
            "webrtc_url": "...",
            "access_token": "..."
        }
    """

    if not HEYGEN_API_KEY:
        raise HeyGenError("Missing HEYGEN_API_KEY in environment")

    if not HEYGEN_AVATAR_ID:
        raise HeyGenError("Missing HEYGEN_AVATAR_ID in environment")

    headers = {
        "Authorization": f"Bearer {HEYGEN_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "avatar_id": HEYGEN_AVATAR_ID,
        "voice_id": HEYGEN_VOICE_ID,
        "video_quality": "1080p",
        "stream_mode": "webrtc",
        "latency_mode": "low",
        "session_timeout_seconds": 900,  # 15 minutes
    }

    try:
        res = requests.post(
            f"{HEYGEN_BASE_URL}/v1/liveavatar/sessions",
            headers=headers,
            json=payload,
            timeout=15,
        )
    except requests.RequestException as e:
        raise HeyGenError(f"HeyGen connection failed: {e}")

    if not res.ok:
        raise HeyGenError(f"HeyGen API error: {res.status_code} {res.text}")

    data = res.json()

    return {
        "session_id": data.get("session_id"),
        "webrtc_url": data.get("webrtc_url"),
        "access_token": data.get("access_token"),
    }


# ------------------------------------------------------
# ✅ OPTIONAL: TERMINATE SESSION (Clean Exit)
# ------------------------------------------------------
def close_liveavatar_session(session_id: str):
    if not session_id:
        return

    headers = {
        "Authorization": f"Bearer {HEYGEN_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        requests.delete(
            f"{HEYGEN_BASE_URL}/v1/liveavatar/sessions/{session_id}",
            headers=headers,
            timeout=10,
        )
    except Exception:
        pass
