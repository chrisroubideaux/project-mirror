# backend/aurora/emotion_fusion.py

from __future__ import annotations

from typing import Dict, Optional


def _clip(v: float) -> float:
    return max(0.0, min(1.0, float(v)))


def fuse_face_text(
    face_pad: Optional[Dict[str, float]] = None,
    text_pad: Optional[Dict[str, float]] = None,
) -> Dict[str, float]:
    """
    Face gets slightly more weight than text by default.
    """

    if not face_pad and not text_pad:
        return {"valence": 0.5, "arousal": 0.5, "dominance": 0.5}

    if face_pad and not text_pad:
        return {
            "valence": _clip(face_pad["valence"]),
            "arousal": _clip(face_pad["arousal"]),
            "dominance": _clip(face_pad["dominance"]),
        }

    if text_pad and not face_pad:
        return {
            "valence": _clip(text_pad["valence"]),
            "arousal": _clip(text_pad["arousal"]),
            "dominance": _clip(text_pad["dominance"]),
        }

    return {
        "valence": _clip((face_pad["valence"] * 0.6) + (text_pad["valence"] * 0.4)),
        "arousal": _clip((face_pad["arousal"] * 0.7) + (text_pad["arousal"] * 0.3)),
        "dominance": _clip((face_pad["dominance"] * 0.5) + (text_pad["dominance"] * 0.5)),
    }