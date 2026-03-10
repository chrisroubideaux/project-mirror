# backend/aurora/routes_emotion.py

from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.hf_emotion import analyze_emotion, EmotionServiceError
from aurora.emotion_fusion import fuse_face_text
from aurora.emotion_state import get_user_emotion_engine
from utils.decorators import token_required

aurora_emotion_bp = Blueprint(
    "aurora_emotion_bp",
    __name__,
    url_prefix="/api/user/aurora"
)


def _safe_float(value):
    try:
        if value is None or value == "":
            return None
        return float(value)
    except Exception:
        return None


@aurora_emotion_bp.post("/emotion")
@token_required
def detect_face_emotion(current_user):
    frame = request.files.get("frame")
    if not frame:
        return jsonify({"error": "frame_required"}), 400

    image_bytes = frame.read()
    if not image_bytes:
        return jsonify({"error": "empty_frame"}), 400

    if len(image_bytes) > 2_000_000:
        return jsonify({"error": "frame_too_large"}), 400

    try:
        face = analyze_emotion(image_bytes)
    except EmotionServiceError as e:
        return jsonify({"error": str(e)}), 502
    except Exception as e:
        return jsonify({"error": f"emotion_detection_failed: {e}"}), 500

    text_v = _safe_float(request.form.get("text_valence"))
    text_a = _safe_float(request.form.get("text_arousal"))
    text_d = _safe_float(request.form.get("text_dominance"))

    text_pad = None
    if text_v is not None and text_a is not None and text_d is not None:
        text_pad = {
            "valence": text_v,
            "arousal": text_a,
            "dominance": text_d,
        }

    face_pad = {
        "valence": float(face["valence"]),
        "arousal": float(face["arousal"]),
        "dominance": float(face["dominance"]),
    }

    fused = fuse_face_text(face_pad=face_pad, text_pad=text_pad)
    engine = get_user_emotion_engine(str(current_user.id))
    smoothed = engine.update(fused, alpha=0.22)

    return jsonify({
        "emotion": face["emotion"],
        "score": face["score"],
        "face_pad": face_pad,
        "fused_pad": fused,
        "smoothed_pad": smoothed,
        "raw": face.get("raw", []),
    }), 200


@aurora_emotion_bp.post("/emotion/decay")
@token_required
def decay_emotion(current_user):
    engine = get_user_emotion_engine(str(current_user.id))
    decayed = engine.decay(rate=0.02)
    return jsonify({"smoothed_pad": decayed}), 200