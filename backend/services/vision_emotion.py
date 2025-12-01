# backend/services/vision_emotion.py

import os
import base64
import json
from typing import Dict, Any

from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class EmotionServiceError(Exception):
    """Custom exception for emotion analysis failures."""
    pass


def _clamp01(value, default=0.5) -> float:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return default
    if v < 0.0:
        return 0.0
    if v > 1.0:
        return 1.0
    return v


def analyze_emotion(image_bytes: bytes) -> Dict[str, Any]:
    """
    Use OpenAI Vision (gpt-4o-mini) to:
      - detect high-level emotion
      - estimate valence, arousal, dominance (PAD)
      - return both, for blending in Aurora

    Returns dict:
      {
        "emotion": "happy" | "sad" | ... | "uncertain",
        "confidence": 0–1,
        "score": same as confidence (for backward compat),
        "valence": 0–1,
        "arousal": 0–1,
        "dominance": 0–1,
        "raw": {...}   # original JSON from model
      }
    """
    if not image_bytes:
        raise EmotionServiceError("Empty image")

    # Encode as data URL for Vision
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{b64}"

    system_prompt = """
You are an emotion recognition module for a real-time webcam therapist assistant called Aurora.

You MUST analyze a single human face in an image and output a STRICT JSON object with:
- "emotion": one of ["happy","sad","angry","fearful","surprised","disgusted","tired","stressed","confused","neutral","uncertain"]
- "confidence": float between 0 and 1 (overall confidence in the emotion classification)
- "valence": float between 0 and 1 (0 = very negative, 1 = very positive)
- "arousal": float between 0 and 1 (0 = very calm/sleepy, 1 = very activated/energized)
- "dominance": float between 0 and 1 (0 = very submissive/overwhelmed, 1 = very in control/empowered)

If the face is not clearly visible, occluded, or ambiguous:
  - set "emotion": "uncertain"
  - set "confidence" <= 0.3
  - set valence/arousal/dominance near 0.5

IMPORTANT:
- Respond with JSON ONLY. No extra text.
- All numeric values MUST be valid floats in [0,1].
"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this face and return the JSON object exactly in the requested format.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url},
                        },
                    ],
                },
            ],
            temperature=0.0,  # deterministic for consistency
            max_tokens=200,
        )

        content = resp.choices[0].message.content
        parsed = json.loads(content)

    except Exception as e:
        print("Vision emotion model error:", repr(e))
        raise EmotionServiceError("Vision model failed")

    # Safely extract and clamp values
    emotion = (parsed.get("emotion") or "uncertain").lower().strip()
    confidence = _clamp01(parsed.get("confidence"), default=0.5)
    valence = _clamp01(parsed.get("valence"), default=0.5)
    arousal = _clamp01(parsed.get("arousal"), default=0.5)
    dominance = _clamp01(parsed.get("dominance"), default=0.5)

    result: Dict[str, Any] = {
        "emotion": emotion,
        "confidence": confidence,
        "score": confidence,  # backward compat with old client code
        "valence": valence,
        "arousal": arousal,
        "dominance": dominance,
        "raw": parsed,
    }

    print("VISION EMOTION RESULT >>>", result)
    return result
