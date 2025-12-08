# backend/services/vision_emotion.py
# backend/services/vision_emotion.py

import os
import io
import base64
import json
import time
from typing import Dict, Any
from collections import deque

import cv2
import numpy as np
from PIL import Image
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Rolling confidence history for smoothing
_conf_history = deque(maxlen=5)

# Optional: last good result for rate-limit fallback
_last_good_result: Dict[str, Any] | None = None

# OpenCV Haar Cascade (face detector)
FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


class EmotionServiceError(Exception):
    """Custom exception for emotion analysis failures."""
    pass


def _clamp01(value, default: float = 0.5) -> float:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return default
    return max(0.0, min(1.0, v))


def _smooth_conf(value: float) -> float:
    """
    Smooth confidence scores to reduce jitter & prevent noisy emotion flips.
    """
    _conf_history.append(value)
    avg = sum(_conf_history) / len(_conf_history)
    # Blend current value with rolling average
    return (avg + value) / 2.0


# -------------------------------------------------------------
# FACE CROP
# -------------------------------------------------------------
def _extract_face(image_bytes: bytes) -> bytes:
    """
    Try to detect a single face and crop around it.
    If detection fails, return the original image bytes.
    """
    # PIL → numpy
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_np = np.array(img)

    # Gray for detector
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

    faces = FACE_CASCADE.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(80, 80),
    )

    if len(faces) == 0:
        print("⚠️ No face detected → using full frame")
        return image_bytes  # fallback to whole image

    # Take the first face
    x, y, w, h = faces[0]
    face_crop = img_np[y : y + h, x : x + w]

    # Back to JPEG bytes
    face_img = Image.fromarray(face_crop)
    buf = io.BytesIO()
    face_img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


# -------------------------------------------------------------
# MAIN EMOTION ANALYZER (WITH FACE CROP + RATE LIMIT HANDLING)
# -------------------------------------------------------------
def analyze_emotion(image_bytes: bytes) -> Dict[str, Any]:
    """
    Uses OpenAI GPT-4o-mini Vision to analyze facial emotion.

    - Crops to face first (when possible).
    - Smooths confidence.
    - Falls back to last good result when rate-limited.
    """
    global _last_good_result

    if not image_bytes:
        raise EmotionServiceError("Empty image")

    # Try face crop first
    try:
        image_bytes = _extract_face(image_bytes)
    except Exception as e:
        print("⚠️ Face crop failed:", e)

    # Encode as base64 data URL
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{b64}"

    system_prompt = """
You are an emotion recognition module for Aurora.

Return ONE of:
["happy","sad","angry","fearful","surprised","disgusted",
 "tired","stressed","confused","neutral","uncertain"]

Rules:
- Assume there is a single visible face (human or animated avatar).
- Use "uncertain" ONLY if the FACE is hidden, extremely blurry, or not detectable.
- If the face looks neutral/relaxed, choose "neutral" (NOT "uncertain").

Output STRICT JSON:
{
  "emotion": "...",
  "confidence": 0-1,
  "valence": 0-1,
  "arousal": 0-1,
  "dominance": 0-1
}
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Analyze the face and return ONLY the JSON object."
                },
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        },
    ]

    MAX_RETRIES = 3

    for attempt in range(MAX_RETRIES):
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=150,
            )

            content = resp.choices[0].message.content
            parsed = json.loads(content)

            normalized = _normalize_output(parsed)
            _last_good_result = normalized
            return normalized

        except Exception as e:
            err = str(e).lower()
            print("Vision emotion error:", repr(e))

            # Rate limit: use last_good_result if we have one
            if "429" in err or "rate_limit" in err:
                if _last_good_result is not None:
                    print("⚠️ Vision rate-limited — using cached emotion")
                    return _last_good_result
                time.sleep(0.4 * (attempt + 1))
                continue

            # Non-retryable error → break out
            break

    # Hard fallback
    fallback = _last_good_result or {
        "emotion": "neutral",
        "confidence": 0.15,
        "score": 0.15,
        "valence": 0.5,
        "arousal": 0.5,
        "dominance": 0.5,
        "raw": {"error": "vision_failed_or_rate_limited"},
    }
    print("⚠️ Using hard fallback emotion:", fallback)
    return fallback


def _normalize_output(parsed: Dict[str, Any]) -> Dict[str, Any]:
    """
    Final cleanup:
    - Clamp values into [0,1]
    - Filter very low confidence → neutral
    - Smooth confidence so HUD doesn’t jump
    """
    emotion = (parsed.get("emotion") or "neutral").lower().strip()
    raw_conf = _clamp01(parsed.get("confidence"), default=0.5)

    # If confidence is weak, treat as neutral
    if raw_conf < 0.40:
        emotion = "neutral"

    smoothed_conf = _smooth_conf(raw_conf)

    result = {
        "emotion": emotion,
        "confidence": smoothed_conf,
        "score": smoothed_conf,
        "valence": _clamp01(parsed.get("valence"), default=0.5),
        "arousal": _clamp01(parsed.get("arousal"), default=0.5),
        "dominance": _clamp01(parsed.get("dominance"), default=0.5),
        "raw": parsed,
    }

    print("✅ VISION EMOTION >>>", result)
    return result
