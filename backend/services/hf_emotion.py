# backend/services/hf_emotion.py
# backend/services/hf_emotion.py

import os
import requests
from typing import Dict, Any
import base64

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_EMOTION_ENDPOINT = os.getenv("HF_EMOTION_ENDPOINT")

if not HF_EMOTION_ENDPOINT:
    raise Exception("Missing HF_EMOTION_ENDPOINT in .env")


class EmotionServiceError(Exception):
    pass


def _call_hf_api(image_bytes: bytes) -> Any:
    """Calls HuggingFace endpoint with base64 image."""
    if not HUGGINGFACE_API_KEY:
        raise EmotionServiceError("Missing HUGGINGFACE_API_KEY")

    encoded = base64.b64encode(image_bytes).decode("utf-8")

    payload = {"inputs": encoded}
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            HF_EMOTION_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=60,
        )
    except Exception as e:
        raise EmotionServiceError(f"HF API request failed: {e}")

    if response.status_code != 200:
        raise EmotionServiceError(
            f"HF API Error {response.status_code}: {response.text}"
        )

    return response.json()


def _emotion_to_pad(label: str) -> Dict[str, float]:
    """Maps emotion label → PAD model values."""
    label = (label or "").lower()

    PAD_MAPPING = {
        "happy": (0.9, 0.6, 0.7),
        "sad": (0.2, 0.3, 0.3),
        "angry": (0.2, 0.8, 0.9),
        "fear": (0.2, 0.9, 0.1),
        "surprise": (0.7, 0.8, 0.5),
        "disgust": (0.2, 0.7, 0.8),
        "neutral": (0.5, 0.3, 0.5),
    }

    v, a, d = PAD_MAPPING.get(label, (0.5, 0.5, 0.5))
    return {"valence": v, "arousal": a, "dominance": d}


def analyze_emotion(image_bytes: bytes) -> Dict[str, Any]:
    """Returns only emotion data. Aurora no longer comments on expression."""
    raw = _call_hf_api(image_bytes)

    if not isinstance(raw, list) or len(raw) == 0:
        raise EmotionServiceError(f"Unexpected HF response format: {raw}")

    top = max(raw, key=lambda x: x.get("score", 0.0))

    label = top.get("label", "unknown").lower()
    score = float(top.get("score", 0.0))

    pad = _emotion_to_pad(label)

    return {
        "emotion": label,
        "score": score,
        "valence": pad["valence"],
        "arousal": pad["arousal"],
        "dominance": pad["dominance"],
        "raw": raw,
    }


"""""""""""""""""""""
# backend/services/hf_emotion.py

import os
import requests
from typing import Dict, Any
import base64

from services.emotion_logic import generate_response

# Load API Key
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Load Endpoint URL
HF_EMOTION_ENDPOINT = os.getenv("HF_EMOTION_ENDPOINT")

if not HF_EMOTION_ENDPOINT:
    raise Exception("Missing HF_EMOTION_ENDPOINT in .env")


class EmotionServiceError(Exception):
   
    pass


def _call_hf_api(image_bytes: bytes) -> Any:
   
    if not HUGGINGFACE_API_KEY:
        raise EmotionServiceError("Missing HUGGINGFACE_API_KEY")

    encoded = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "inputs": encoded
    }

    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            HF_EMOTION_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=60,
        )
    except Exception as e:
        raise EmotionServiceError(f"HF API request failed: {e}")

    if response.status_code != 200:
        raise EmotionServiceError(
            f"HF API Error {response.status_code}: {response.text}"
        )

    return response.json()


def _emotion_to_pad(label: str) -> Dict[str, float]:
    
    label = (label or "").lower()

    PAD_MAPPING = {
        "happy":     (0.9, 0.6, 0.7),
        "sad":       (0.2, 0.3, 0.3),
        "angry":     (0.2, 0.8, 0.9),
        "fear":      (0.2, 0.9, 0.1),
        "surprise":  (0.7, 0.8, 0.5),
        "disgust":   (0.2, 0.7, 0.8),
        "neutral":   (0.5, 0.3, 0.5),
    }

    valence, arousal, dominance = PAD_MAPPING.get(label, (0.5, 0.5, 0.5))
    return {
        "valence": valence,
        "arousal": arousal,
        "dominance": dominance,
    }


def analyze_emotion(image_bytes: bytes) -> Dict[str, Any]:
   
    raw = _call_hf_api(image_bytes)

    if not isinstance(raw, list) or len(raw) == 0:
        raise EmotionServiceError(f"Unexpected HF response format: {raw}")

    top = max(raw, key=lambda x: x.get("score", 0.0))

    label = top.get("label", "unknown").lower()
    score = float(top.get("score", 0.0))

    # ✅ 3D PAD Model
    pad = _emotion_to_pad(label)

    # ✅ Emotional state + Aurora natural response
    aurora = generate_response(
        pad["valence"],
        pad["arousal"],
        pad["dominance"]
    )

    return {
        "emotion": label,
        "score": score,
        "valence": pad["valence"],
        "arousal": pad["arousal"],
        "dominance": pad["dominance"],
        "state": aurora["state"],
        "aurora_response": aurora["aurora_response"],
        "raw": raw,
    }


    

"""""""""""""""""
