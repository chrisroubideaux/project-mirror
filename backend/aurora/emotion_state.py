# backend/aurora/emotion_state.py

from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Dict


def _clip(v: float) -> float:
    return max(0.0, min(1.0, float(v)))


@dataclass
class PADState:
    valence: float = 0.5
    arousal: float = 0.5
    dominance: float = 0.5


class EmotionTemporalEngine:
    """
    Process-local smoothing engine.
    For multi-worker production, move this state to Redis or DB.
    """

    def __init__(self):
        self.state = PADState()

    def update(self, new_pad: Dict[str, float], alpha: float = 0.22) -> Dict[str, float]:
        self.state.valence = _clip((1 - alpha) * self.state.valence + alpha * new_pad["valence"])
        self.state.arousal = _clip((1 - alpha) * self.state.arousal + alpha * new_pad["arousal"])
        self.state.dominance = _clip((1 - alpha) * self.state.dominance + alpha * new_pad["dominance"])
        return self.to_dict()

    def decay(self, rate: float = 0.015) -> Dict[str, float]:
        neutral = 0.5
        self.state.valence = _clip(self.state.valence + (neutral - self.state.valence) * rate)
        self.state.arousal = _clip(self.state.arousal + (neutral - self.state.arousal) * rate)
        self.state.dominance = _clip(self.state.dominance + (neutral - self.state.dominance) * rate)
        return self.to_dict()

    def to_dict(self) -> Dict[str, float]:
        return {
            "valence": _clip(self.state.valence),
            "arousal": _clip(self.state.arousal),
            "dominance": _clip(self.state.dominance),
        }


_ENGINES: Dict[str, EmotionTemporalEngine] = {}
_ENGINES_LOCK = Lock()


def get_user_emotion_engine(user_id: str) -> EmotionTemporalEngine:
    with _ENGINES_LOCK:
        if user_id not in _ENGINES:
            _ENGINES[user_id] = EmotionTemporalEngine()
        return _ENGINES[user_id]