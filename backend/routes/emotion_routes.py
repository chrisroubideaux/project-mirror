# backend/routes/emotion_routes.py

from flask import Blueprint, request, jsonify
from services.vision_emotion import analyze_emotion, EmotionServiceError

emotion_bp = Blueprint("emotion", __name__, url_prefix="/api/emotion")

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@emotion_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Accepts multipart/form-data with field "image"
    Calls vision_emotion.analyze_emotion()
    """
    # -------------------------
    # Validate presence of file
    # -------------------------
    if "image" not in request.files:
        return jsonify({"error": "image file required"}), 400

    file = request.files["image"]

    if not file or file.filename == "":
        return jsonify({"error": "empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "invalid file type"}), 400

    try:
        # -------------------------
        # Read bytes
        # -------------------------
        image_bytes = file.read()

        if not image_bytes or len(image_bytes) < 20:  # prevents empty/invalid frames
            return jsonify({"error": "empty or invalid image data"}), 400

        # -------------------------
        # Run Vision Emotion AI
        # -------------------------
        result = analyze_emotion(image_bytes)

        # Always respond with JSON for frontend HUD
        return jsonify(result), 200

    except EmotionServiceError as e:
        # Custom error from emotion service (bad image, invalid JSON from model, etc.)
        return jsonify({"error": str(e)}), 500

    except Exception as e:
        # General catch-all for debugging
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
