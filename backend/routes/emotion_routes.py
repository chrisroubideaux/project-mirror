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
    """
    Analyze emotion from image.  
    Token is optional:
      - Guest users: works normally
      - Logged-in users: emotion can be tied to their account
    """
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


""""""""""
# backend/routes/emotion_routes.py

from flask import Blueprint, request, jsonify
from utils.decorators import token_required_optional
from services.hf_emotion import analyze_emotion, EmotionServiceError
from services.emotion_logic import generate_response

emotion_bp = Blueprint("emotion", __name__, url_prefix="/api/emotion")


@emotion_bp.route("/analyze", methods=["POST"])
@token_required_optional
def analyze(current_user):
   

    try:
        # 1) Extract Image Bytes
        image_bytes = None

        if "image" in request.files:
            image_bytes = request.files["image"].read()
        elif request.content_type and request.content_type.startswith("image/"):
            image_bytes = request.data

        if not image_bytes:
            return jsonify({"error": "No image provided"}), 400

        # 2) HuggingFace Model (emotion + PAD)
        result = analyze_emotion(image_bytes)

        p = result["valence"]
        a = result["arousal"]
        d = result["dominance"]

        # 3) Emotional State + Aurora Response
        response_info = generate_response(p, a, d)

        # 4) Final unified response
        response = {
            "emotion": result["emotion"],
            "score": result["score"],
            "valence": p,
            "arousal": a,
            "dominance": d,
            "state": response_info["state"],
            "aurora_response": response_info["aurora_response"],
            "raw": result["raw"],
        }

        if current_user:
            response["user_id"] = str(current_user.id)

        return jsonify(response), 200

    except EmotionServiceError as e:
        return jsonify({"error": str(e)}), 502

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500




"""""""""""""""""""""
