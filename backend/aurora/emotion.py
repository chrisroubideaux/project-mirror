# backend/aurora/emotion.py

# backend/aurora/emotion.py

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any, Optional
import re

# Lazy-load transformers so your Flask server doesn't feel "stuck" on boot.
_sentiment_pipe = None
_emotion_pipe = None


@dataclass
class EmotionResult:
    sentiment_label: Optional[str] = None
    sentiment_score: Optional[float] = None
    emotion_label: Optional[str] = None
    emotion_score: Optional[float] = None
    valence: Optional[float] = None
    arousal: Optional[float] = None
    dominance: Optional[float] = None
    raw: Optional[Dict[str, Any]] = None


def _normalize(text: str) -> str:
    text = (text or "").strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _load_pipelines():
    global _sentiment_pipe, _emotion_pipe
    if _sentiment_pipe is None or _emotion_pipe is None:
        from transformers import pipeline

        _sentiment_pipe = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest"
        )

        _emotion_pipe = pipeline(
            "text-classification",
            model="bhadresh-savani/distilbert-base-uncased-emotion"
        )


def _sentiment_to_valence(label: str, score: float) -> float:
    """
    Map sentiment label -> valence in [-1, 1]
    roberta sentiment labels are typically: 'positive', 'neutral', 'negative'
    """
    label = (label or "").lower()
    score = float(score or 0.0)

    if label == "positive":
        return min(1.0, 0.2 + 0.8 * score)
    if label == "negative":
        return max(-1.0, -(0.2 + 0.8 * score))
    # neutral
    return 0.0


def _emotion_to_pad(label: str) -> Dict[str, float]:
    """
    Reuse your PAD idea. Values are heuristic but consistent and useful for trends.
    valence/arousal/dominance in [0,1]
    """
    label = (label or "").lower()

    PAD_MAPPING = {
        "joy": (0.9, 0.6, 0.7),
        "love": (0.9, 0.5, 0.6),
        "sadness": (0.2, 0.3, 0.3),
        "anger": (0.2, 0.8, 0.9),
        "fear": (0.2, 0.9, 0.2),
        "surprise": (0.7, 0.8, 0.5),
        "neutral": (0.5, 0.3, 0.5),
    }

    v, a, d = PAD_MAPPING.get(label, (0.5, 0.5, 0.5))
    return {"valence": v, "arousal": a, "dominance": d}


def analyze_text_emotion(text: str) -> Dict[str, Any]:
    """
    Lightweight text emotion + sentiment tagging.
    Never throws: returns safe defaults on failure.
    """
    try:
        _load_pipelines()

        t = _normalize(text)
        if not t:
            return EmotionResult(raw={"reason": "empty_text"}).__dict__

        sent = _sentiment_pipe(t)[0]
        emo = _emotion_pipe(t)[0]

        sentiment_label = sent.get("label")
        sentiment_score = float(sent.get("score", 0.0))

        emotion_label = emo.get("label")
        emotion_score = float(emo.get("score", 0.0))

        pad = _emotion_to_pad(emotion_label)

        # Optional: valence from sentiment in [-1,1] + PAD valence in [0,1]
        # We'll keep both: PAD is [0,1], sentiment-valence is [-1,1]
        sentiment_valence = _sentiment_to_valence(sentiment_label, sentiment_score)

        return EmotionResult(
            sentiment_label=sentiment_label,
            sentiment_score=round(sentiment_score, 4),
            emotion_label=emotion_label,
            emotion_score=round(emotion_score, 4),
            valence=pad["valence"],
            arousal=pad["arousal"],
            dominance=pad["dominance"],
            raw={
                "sentiment_valence": round(sentiment_valence, 4),
                "sentiment_raw": sent,
                "emotion_raw": emo,
            }
        ).__dict__

    except Exception as e:
        # Never block conversation
        return EmotionResult(raw={"error": str(e)}).__dict__
