# backend/routes/aurora_routes.py

from flask import Blueprint, request, jsonify, send_file
from services.emotion_logic import generate_response
from services.aurora_speech import text_to_speech
from services.aurora_dialogue import generate_dialogue_response

from services.aurora_brain import aurora_reply
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

@aurora_bp.route("/reply", methods=["POST"])
def reply():
    """
    Conversational mode:
    User text + emotional state → Aurora's spoken reply

    Expects:
    {
      "user_text": "I'm just stressed",
      "state": "distress",
      "valence": 0.2,
      "arousal": 0.8,
      "dominance": 0.3
    }

    Returns:
      - JSON + MP3 audio stream
    """
    data = request.get_json()

    user_text = data.get("user_text", "")
    state = data.get("state", "uncertain")
    p = data.get("valence")
    a = data.get("arousal")
    d = data.get("dominance")

    if not user_text:
        return jsonify({"error": "Missing user_text"}), 400

    # 1️⃣ Generate Aurora's text reply
    aurora_text = generate_dialogue_response(user_text, state, p, a, d)

    # 2️⃣ Convert to speech
    audio_bytes = text_to_speech(aurora_text)

    # 3️⃣ Return JSON + audio
    return send_file(
        BytesIO(audio_bytes),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name="aurora_reply.mp3"
    )
    
@aurora_bp.route("/greet", methods=["GET"])
def greet():
    """
    Aurora's automatic session greeting.
    Returns MP3 audio.
    """
    greeting = "Hello, my name is Aurora. How are you feeling today?"

    audio_bytes = text_to_speech(greeting)

    return send_file(
        BytesIO(audio_bytes),
        mimetype="audio/mpeg",
        as_attachment=False
    )
    
    
@aurora_bp.route("/voice-chat", methods=["POST"])
def voice_chat():
    """
    Accepts audio -> Whisper STT -> Aurora GPT -> ElevenLabs TTS -> MP3
    """
    if "audio" not in request.files:
        return jsonify({"error": "No audio provided"}), 400

    audio_bytes = request.files["audio"].read()

    # 1️⃣ Speech-to-Text
    user_text = speech_to_text(audio_bytes)

    # 2️⃣ Aurora's conversational reply
    ai_reply = aurora_reply(user_text)

    # 3️⃣ Convert to speech
    audio_bytes_out = text_to_speech(ai_reply)

    return send_file(
        BytesIO(audio_bytes_out),
        mimetype="audio/mpeg",
        as_attachment=False
    )