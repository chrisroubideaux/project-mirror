# backend/routes/emotion_routes.py

from flask import Blueprint, request, jsonify

from services.vision_emotion import analyze_emotion, EmotionServiceError

emotion_bp = Blueprint("emotion", __name__, url_prefix="/api/emotion")


@emotion_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Accepts: multipart/form-data with field "image"
      - image: webcam frame (JPEG/PNG)

    Returns (200 on success):
      {
        "emotion": "happy" | "sad" | ... | "uncertain",
        "confidence": 0–1,
        "score": same as confidence,
        "valence": 0–1,
        "arousal": 0–1,
        "dominance": 0–1,
        "raw": { ... original JSON from Vision ... }
      }
    """
    if "image" not in request.files:
        return jsonify({"error": "image file required"}), 400

    image_bytes = request.files["image"].read()

    if not image_bytes:
        return jsonify({"error": "empty image"}), 400

    try:
        result = analyze_emotion(image_bytes)
        return jsonify(result), 200

    except EmotionServiceError as e:
        # Controlled failures from the emotion service
        return jsonify({"error": str(e)}), 500

    except Exception as e:
        # Unexpected error
        print("Emotion analyze route error:", repr(e))
        return jsonify({"error": "internal emotion service error"}), 500




""""""""""
# backend/routes/emotion_routes.py
# backend/routes/emotion_routes.py

from flask import Blueprint, request, jsonify
from services.hf_emotion import analyze_emotion
from services.emotion_logic import emotion_signal
from utils.decorators import token_required_optional   # ⭐ RESTORED

emotion_bp = Blueprint("emotion", __name__, url_prefix="/api/emotion")

@emotion_bp.route("/analyze", methods=["POST"])
@token_required_optional   # ⭐ RESTORED
def analyze_emotion_route(current_user=None):
  
    try:
        # Get image bytes
        if "image" in request.files:
            image_bytes = request.files["image"].read()
        else:
            return jsonify({"error": "No image provided"}), 400

        # HuggingFace → emotion + PAD
        result = analyze_emotion(image_bytes)

        p, a, d = result["valence"], result["arousal"], result["dominance"]

        # Only state + PAD (no therapist speech)
        emotion = emotion_signal(p, a, d)

        # Optional: attach user info
        user_id = current_user.id if current_user else None

        return jsonify({
            "user_id": user_id,
            "emotion": result["emotion"],
            "score": result["score"],
            "state": emotion["state"],
            "valence": emotion["valence"],
            "arousal": emotion["arousal"],
            "dominance": emotion["dominance"],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

"""""""""""""""""""""
