
# backend/services/heygen_video.py
import os
import time
import requests

HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY")
HEYGEN_BASE_URL = "https://api.heygen.com"


class HeyGenVideoError(Exception):
    pass


# ⚠️ TODO: replace this with your real avatar image URL from HeyGen / Leonardo
AVATAR_IMAGE_URL = os.getenv("HEYGEN_AVATAR_IMAGE_URL", "").strip()


def _get_headers():
    if not HEYGEN_API_KEY:
        raise HeyGenVideoError("Missing HEYGEN_API_KEY in environment")

    return {
        "Authorization": f"Bearer {HEYGEN_API_KEY}",
        "Content-Type": "application/json",
    }


def create_talking_photo_video(
    script: str,
    voice_id: str,
    motion_prompt: str | None = None,
    ratio: str = "16:9",
    resolution: str = "1080p",
):
    """
    Calls HeyGen's 'photo to video' / talking photo API.

    Returns a dict like:
    {
      "video_id": "...",
      "status": "pending"
    }
    """
    if not AVATAR_IMAGE_URL:
        raise HeyGenVideoError(
            "AVATAR_IMAGE_URL not set. Put your avatar image URL in HEYGEN_AVATAR_IMAGE_URL."
        )

    if not script or len(script.strip()) == 0:
        raise HeyGenVideoError("Script text is required")

    if not voice_id:
        raise HeyGenVideoError("voice_id is required")

    payload = {
        "source": {
            "type": "image",
            "image_url": AVATAR_IMAGE_URL,  # your static avatar
        },
        "voice": {
            "type": "heygen_voice",
            "voice_id": voice_id,
        },
        "video": {
            "ratio": ratio,       # "16:9" or "9:16" etc.
            "resolution": resolution,
            "background": "#000000",
        },
        "script": {
            "type": "text",
            "input_text": script,
            "input_text_language": "en",
        },
        # Optional: Avatar IV extra motion
        "config": {
            "avatar": {
                # This key may differ slightly depending on latest docs,
                # but this is the general idea:
                "style": "avatar_v4",
                "motion": {
                    "more_expressive": True,
                    "motion_prompt": motion_prompt or "",
                },
            }
        },
    }

    headers = _get_headers()

    try:
        resp = requests.post(
            f"{HEYGEN_BASE_URL}/v1/video/generate",
            headers=headers,
            json=payload,
            timeout=30,
        )
    except requests.RequestException as e:
        raise HeyGenVideoError(f"HeyGen connection failed: {e}")

    if not resp.ok:
        raise HeyGenVideoError(
            f"HeyGen video generate error: {resp.status_code} {resp.text}"
        )

    data = resp.json()
    # Their response typically has an id; adjust key to match actual API
    return {
        "video_id": data.get("video_id") or data.get("id"),
        "status": data.get("status", "pending"),
    }


def poll_video_result(video_id: str, max_wait: int = 120, poll_interval: float = 3.0):
    """
    Polls the HeyGen API until the video is ready or timeout.

    Returns:
      {
        "status": "completed" | "processing" | "failed",
        "video_url": "https://..." (when completed)
      }
    """
    if not video_id:
        raise HeyGenVideoError("video_id is required")

    headers = _get_headers()
    start = time.time()

    while True:
        try:
            resp = requests.get(
                f"{HEYGEN_BASE_URL}/v1/video/status/{video_id}",
                headers=headers,
                timeout=15,
            )
        except requests.RequestException as e:
            raise HeyGenVideoError(f"HeyGen status check failed: {e}")

        if not resp.ok:
            raise HeyGenVideoError(
                f"HeyGen status error: {resp.status_code} {resp.text}"
            )

        data = resp.json()
        status = data.get("status", "").lower()

        if status in ("completed", "done", "finished"):
            video_url = data.get("video_url") or data.get("download_url")
            return {"status": "completed", "video_url": video_url, "raw": data}

        if status in ("failed", "error"):
            raise HeyGenVideoError(f"HeyGen video failed: {data}")

        # still processing
        if time.time() - start > max_wait:
            # give the frontend something to continue polling with
            return {"status": status or "processing", "raw": data}

        time.sleep(poll_interval)
