# backend/routes/emotion_routes.py

from flask import Blueprint, request, jsonify
from utils.decorators import token_required_optional
from services.hf_emotion import analyze_emotion, EmotionServiceError

emotion_bp = Blueprint("emotion", __name__, url_prefix="/api/emotion")

@emotion_bp.route("/analyze", methods=["POST"])
@token_required_optional
def analyze(current_user):
    """
    Analyze facial emotion from an image.

    Accepts:
      - multipart/form-data with field 'image'
      - OR raw bytes (image/jpeg/png)
    """
    try:
        # ------------------------------
        # 1) Extract image
        # ------------------------------
        image_bytes = None

        if "image" in request.files:
            image_bytes = request.files["image"].read()

        elif request.data:
            image_bytes = request.data

        if not image_bytes:
            return jsonify({"error": "No image provided"}), 400

        # ------------------------------
        # 2) Run Emotion Service
        # ------------------------------
        result = analyze_emotion(image_bytes)

        # ------------------------------
        # 3) Return correct fields
        # ------------------------------
        return jsonify({
            "emotion":   result["emotion"],
            "score":     result["score"],      # <-- SCORE, not "confidence"
            "valence":   result["valence"],
            "arousal":   result["arousal"],
            "raw":       result["raw"],
            "user_id":   str(current_user.id) if current_user else None,
        }), 200

    except EmotionServiceError as e:
        return jsonify({"error": str(e)}), 502

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500





""""""""""
from flask import Blueprint, request, jsonify
from utils.decorators import token_required_optional
from services.hf_emotion import analyze_emotion, EmotionServiceError

emotion_bp = Blueprint("emotion", __name__, url_prefix="/api/emotion")


@emotion_bp.route("/analyze", methods=["POST"])
@token_required_optional
def analyze(current_user):
  
    try:
        # ------------------------------
        # 1) Extract image bytes
        # ------------------------------
        image_bytes = None

        if "image" in request.files:
            image_bytes = request.files["image"].read()
        elif request.data:
            image_bytes = request.data

        if not image_bytes:
            return jsonify({"error": "No image provided"}), 400

        # ------------------------------
        # 2) Run Emotion Engine
        # ------------------------------
        result = analyze_emotion(image_bytes)

        # ------------------------------
        # 3) Normalize safe return
        # ------------------------------
        return jsonify({
            "emotion": result.get("emotion"),
            "confidence": result.get("confidence"),  # <-- UPDATED
            "valence": result.get("valence"),
            "arousal": result.get("arousal"),
            "raw": result.get("raw"),
            "source": result.get("source"),         # <-- NEW, GPU or FREE
            "user_id": str(current_user.id) if current_user else None,
        }), 200

    except EmotionServiceError as e:
        return jsonify({"error": str(e)}), 502  # Bad upstream (HF)
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500
        
        
"""""""""""""""""""""
