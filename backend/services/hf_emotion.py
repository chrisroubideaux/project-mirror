# backend/services/hf_emotion.py
# backend/services/hf_emotion.py
import os
import requests
from typing import Dict, Any

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

HF_EMOTION_MODEL_NAME = os.getenv(
    "HF_EMOTION_MODEL_NAME",
    "m3hrdadfi/fer-v2"
)

HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_EMOTION_MODEL_NAME}"


class EmotionServiceError(Exception):
    pass


def _call_hf_api(image_bytes: bytes) -> Any:
    if not HUGGINGFACE_API_KEY:
        raise EmotionServiceError("Missing HUGGINGFACE_API_KEY")

    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

    response = requests.post(
        HF_API_URL,
        headers=headers,
        data=image_bytes,
        timeout=30,
    )

    if response.status_code != 200:
        raise EmotionServiceError(
            f"HF API error {response.status_code}: {response.text}"
        )

    return response.json()


def _emotion_to_valence_arousal(label: str) -> Dict[str, float]:
    label = (label or "").lower()

    mapping = {
        "happy": (0.9, 0.6),
        "sad": (0.2, 0.3),
        "angry": (0.2, 0.8),
        "fear": (0.2, 0.9),
        "surprise": (0.7, 0.8),
        "disgust": (0.2, 0.7),
        "neutral": (0.5, 0.3),
    }

    return {
        "valence": mapping.get(label, (0.5, 0.5))[0],
        "arousal": mapping.get(label, (0.5, 0.5))[1],
    }


def analyze_emotion(image_bytes: bytes) -> Dict[str, Any]:
    raw = _call_hf_api(image_bytes)

    if not isinstance(raw, list) or len(raw) == 0:
        raise EmotionServiceError(f"Unexpected response: {raw}")

    top = max(raw, key=lambda x: x.get("score", 0.0))
    label = top.get("label", "unknown")
    score = float(top.get("score", 0.0))

    va = _emotion_to_valence_arousal(label)

    return {
        "emotion": label,
        "score": score,
        "valence": va["valence"],
        "arousal": va["arousal"],
        "raw": raw,
    }





"""""""""""""""""""""
# backend/services/hf_emotion.py
import os
import requests
from typing import Dict, Any

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Updated default model (old one was removed)
HF_EMOTION_MODEL_NAME = os.getenv(
    "HF_EMOTION_MODEL_NAME",
    "nateraw/fer"   # <-- NEW: stable working model
)

HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_EMOTION_MODEL_NAME}"


class EmotionServiceError(Exception):
    pass


def _call_hf_api(image_bytes: bytes) -> Any:
    if not HUGGINGFACE_API_KEY:
        raise EmotionServiceError("Missing HUGGINGFACE_API_KEY in environment.")

    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

    response = requests.post(
        HF_API_URL,
        headers=headers,
        data=image_bytes,
        timeout=30,
    )

    if response.status_code != 200:
        raise EmotionServiceError(
            f"HuggingFace API error {response.status_code}: {response.text}"
        )

    return response.json()


def _emotion_to_valence_arousal(label: str) -> Dict[str, float]:
    label = (label or "").lower()

    valence = 0.5
    arousal = 0.5

    if "happy" in label:
        valence, arousal = 0.9, 0.6
    elif "sad" in label:
        valence, arousal = 0.2, 0.3
    elif "angry" in label:
        valence, arousal = 0.2, 0.8
    elif "fear" in label:
        valence, arousal = 0.2, 0.9
    elif "surprise" in label:
        valence, arousal = 0.7, 0.8
    elif "disgust" in label:
        valence, arousal = 0.2, 0.7
    elif "neutral" in label:
        valence, arousal = 0.5, 0.3

    return {"valence": valence, "arousal": arousal}


def analyze_emotion(image_bytes: bytes) -> Dict[str, Any]:
    raw = _call_hf_api(image_bytes)

    if not isinstance(raw, list) or len(raw) == 0:
        raise EmotionServiceError(f"Unexpected HF response format: {raw}")

    top = max(raw, key=lambda x: x.get("score", 0.0))
    label = top.get("label", "unknown")
    score = float(top.get("score", 0.0))

    va = _emotion_to_valence_arousal(label)

    return {
        "emotion": label,
        "score": score,
        "valence": va["valence"],
        "arousal": va["arousal"],
        "raw": raw,
    }

    
    

"""""""""""""""""
