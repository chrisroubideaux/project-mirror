# backend/routes/emotion_routes.py

# backend/routes/emotion_routes.py


from flask import Blueprint, request, jsonify
from services.hf_emotion import analyze_emotion, EmotionServiceError

emotion_bp = Blueprint("emotion", __name__, url_prefix="/api/emotion")

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@emotion_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Accepts multipart/form-data with field "image"
    Calls HF GPU emotion service (hf_emotion.analyze_emotion)
    """
    if "image" not in request.files:
        return jsonify({"error": "image file required"}), 400

    file = request.files["image"]

    if not file or file.filename == "":
        return jsonify({"error": "empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "invalid file type"}), 400

    try:
        image_bytes = file.read()

        if not image_bytes:
            return jsonify({"error": "empty image data"}), 400

        result = analyze_emotion(image_bytes)
        # result already has emotion, confidence, valence, arousal, dominance
        return jsonify(result), 200

    except EmotionServiceError as e:
        print("HF EmotionServiceError:", repr(e))
        return jsonify({"error": str(e)}), 502

    except Exception as e:
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
