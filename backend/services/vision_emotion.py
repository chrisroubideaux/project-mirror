# backend/services/vision_emotion.py

import os
import base64
import json
import time
from typing import Dict, Any
from collections import deque

from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Rolling smoothing buffer for confidence
_conf_history = deque(maxlen=5)


class EmotionServiceError(Exception):
    """Custom exception for emotion analysis failures."""
    pass


def _clamp01(value, default=0.5) -> float:
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
    return (avg + value) / 2


def analyze_emotion(image_bytes: bytes) -> Dict[str, Any]:
    """
    Uses OpenAI GPT-4o-mini Vision to analyze facial emotion.

    Improvements:
    - Uses strict JSON.
    - Filters out low-confidence emotions.
    - Smooths noisy outputs.
    - Avoids excessive "uncertain".
    - Designed for webcam or avatar face input.
    """
    if not image_bytes:
        raise EmotionServiceError("Empty image")

    # Encode as base64
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{b64}"

    system_prompt = """
You are an emotion recognition module for Aurora, a real-time supportive AI companion.

Requirements:
- Assume a single visible face (human or animated avatar).
- Classify emotion as ONE of:
  ["happy","sad","angry","fearful","surprised",
   "disgusted","tired","stressed","confused",
   "neutral","uncertain"]
- Use "uncertain" ONLY if the face is hidden, extremely blurry, or not detectable.
- If the face looks neutral or relaxed: choose "neutral" (not uncertain).
- Output JSON ONLY with:
  { "emotion", "confidence", "valence", "arousal", "dominance" }.

Guidelines:
- High valence for happy; low valence for sad/stressed.
- High arousal for anger/fear; low arousal for tired.
- Confidence should reflect clarity of the expression.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Analyze the face and return ONLY the JSON object."},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        },
    ]

    MAX_RETRIES = 3

    for attempt in range(MAX_RETRIES):
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=messages,
                temperature=0.0,
                max_tokens=200,
            )

            content = resp.choices[0].message.content
            try:
                parsed = json.loads(content)
            except Exception:
                raise EmotionServiceError(f"Invalid JSON returned: {content}")

            normalized = _normalize_output(parsed)
            return normalized

        except Exception as e:
            print("Vision emotion model error:", repr(e))
            err = str(e).lower()

            # Retry on rate limit
            if "429" in err or "rate" in err:
                time.sleep(0.4 * (attempt + 1))
                continue

            # Fail permanently if not a retryable error
            break

    # Hard fallback
    return {
        "emotion": "uncertain",
        "confidence": 0.1,
        "score": 0.1,
        "valence": 0.5,
        "arousal": 0.5,
        "dominance": 0.5,
        "raw": {"error": "vision_failed_or_rate_limited"},
    }


def _normalize_output(parsed: Dict[str, Any]) -> Dict[str, Any]:
    """
    Final cleanup phase:
    - Filters low confidence → returns neutral
    - Smooths confidence
    - Ensures stable output for Aurora
    """
    emotion = (parsed.get("emotion") or "uncertain").lower().strip()
    raw_conf = _clamp01(parsed.get("confidence"), default=0.5)

    # Weak confidence? Do NOT trust the emotion.
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

    print("VISION EMOTION RESULT >>>", result)
    return result

