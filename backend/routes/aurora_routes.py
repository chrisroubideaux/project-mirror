# backend/routes/aurora_routes.py

from flask import Blueprint, request, jsonify, send_file
from services.emotion_logic import generate_response
from services.aurora_speech import text_to_speech

from io import BytesIO

aurora_bp = Blueprint("aurora", __name__, url_prefix="/api/aurora")

@aurora_bp.route("/speak", methods=["POST"])
def speak():
    """
    Expects:
      {
        "valence": 0.9,
        "arousal": 0.6,
        "dominance": 0.7
      }
    Returns:
      - JSON + MP3 audio stream
    """
    data = request.get_json()

    p = data.get("valence")
    a = data.get("arousal")
    d = data.get("dominance")

    if p is None or a is None or d is None:
        return jsonify({"error": "Missing PAD values"}), 400

    # 1️⃣ Get emotional state + message
    result = generate_response(p, a, d)
    message = result["aurora_response"]

    # 2️⃣ Convert to speech
    audio_bytes = text_to_speech(message)

    # 3️⃣ Return MP3 audio
    return send_file(
        BytesIO(audio_bytes),
        mimetype="audio/mpeg",
        as_attachment=False
    )
