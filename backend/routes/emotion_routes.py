# backend/routes/emotion_routes.py

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
      - OR raw image bytes (Content-Type: image/jpeg/png)
    """

    try:
        # 1) Extract Image
        image_bytes = None

        if "image" in request.files:
            image_bytes = request.files["image"].read()
        elif request.content_type and request.content_type.startswith("image/"):
            image_bytes = request.data

        if not image_bytes:
            return jsonify({"error": "No image provided"}), 400

        # 2) Run Emotion Analysis
        result = analyze_emotion(image_bytes)

        # 3) Full emotional intelligence response
        response = {
            "emotion": result["emotion"],
            "score": result["score"],
            "valence": result["valence"],
            "arousal": result["arousal"],
            "dominance": result["dominance"],
            "state": result["state"],
            "aurora_response": result["aurora_response"],
            "raw": result["raw"],
        }

        if current_user:
            response["user_id"] = str(current_user.id)

        return jsonify(response), 200

    except EmotionServiceError as e:
        return jsonify({"error": str(e)}), 502

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500




""""""""""
# backend/routes/emotion_routes.py

from flask import Blueprint, request, jsonify
from utils.decorators import token_required_optional
from services.hf_emotion import analyze_emotion, EmotionServiceError

emotion_bp = Blueprint("emotion", __name__, url_prefix="/api/emotion")


@emotion_bp.route("/analyze", methods=["POST"])
@token_required_optional
def analyze(current_user):
  

    try:
        # -------------------------------------------------
        # 1. Extract Image Input (BEST POSSIBLE APPROACH)
        # -------------------------------------------------

        image_bytes = None

        # Case 1: multipart form-data (image file upload)
        if "image" in request.files:
            image_bytes = request.files["image"].read()

        # Case 2: Raw image in request body
        elif request.content_type and request.content_type.startswith("image/"):
            image_bytes = request.data

        # Case 3: (Optional future) JSON Base64 input
        # Keeping structure clean for now — will add later

        if not image_bytes:
            return jsonify({"error": "No image provided"}), 400

        # -------------------------------------------------
        # 2. Call HuggingFace Emotion Model
        # -------------------------------------------------
        result = analyze_emotion(image_bytes)

        # -------------------------------------------------
        # 3. Construct response
        # -------------------------------------------------
        response = {
            "emotion": result["emotion"],
            "score": result["score"],        # confidence score
            "valence": result["valence"],
            "arousal": result["arousal"],
            "raw": result["raw"],
        }

        # Add user ID only if logged in
        if current_user:
            response["user_id"] = str(current_user.id)

        return jsonify(response), 200

    except EmotionServiceError as e:
        return jsonify({"error": str(e)}), 502

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500




"""""""""""""""""""""
