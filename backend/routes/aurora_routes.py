# backend/routes/aurora_routes.py
# backend/routes/aurora_routes.py

from flask import Blueprint, request, jsonify, send_file
from io import BytesIO

from services.aurora_whisper import (
    speech_to_text,
    aurora_whisper_reply,
)
from services.aurora_speech import text_to_speech

aurora_bp = Blueprint("aurora", __name__, url_prefix="/api/aurora")


@aurora_bp.route("/greet", methods=["GET"])
def greet():
    """
    Simple one-shot greeting when the session starts.
    """
    greeting = (
        "Hi, I’m Aurora. I’m here with you. "
        "Whenever you’re ready, you can just talk, and I’ll listen."
    )
    audio = text_to_speech(greeting)
    return send_file(BytesIO(audio), mimetype="audio/mpeg")


@aurora_bp.route("/converse", methods=["POST"])
def converse():
    """
    Voice-only conversation endpoint:

    1) Receive short audio snippet (webm)
    2) Whisper → text
    3) Aurora brain → reply text (with emotion shaping)
    4) ElevenLabs → reply audio
    """
    if "audio" not in request.files:
        return jsonify({"error": "audio required"}), 400

    audio_bytes = request.files["audio"].read()
    if not audio_bytes:
        return jsonify({"error": "empty audio"}), 400

    # 1) STT
    user_text = speech_to_text(audio_bytes)
    if not user_text:
        # fallback: don't call GPT if STT failed
        fallback = (
            "I didn’t catch that clearly. "
            "Would you mind repeating that, maybe a little closer to the microphone?"
        )
        audio_out = text_to_speech(fallback)
        return send_file(BytesIO(audio_out), mimetype="audio/mpeg")

    # 2) Aurora brain (with tiny context + emotion shaping)
    reply = aurora_whisper_reply(user_text)

    # 3) TTS
    audio_out = text_to_speech(reply)
    return send_file(BytesIO(audio_out), mimetype="audio/mpeg")




"""""""""""""""""
from flask import Blueprint, request, jsonify, send_file
from io import BytesIO

# Emotion-based speech
from services.emotion_logic import generate_response
from services.aurora_speech import text_to_speech

# Conversational Aurora (Whisper + GPT persona)
from services.aurora_whisper import speech_to_text, aurora_reply


aurora_bp = Blueprint("aurora", __name__, url_prefix="/api/aurora")


# -------------------------------------------------------------
# 1) GREETING (fires when camera session begins)
# -------------------------------------------------------------
@aurora_bp.route("/greet", methods=["GET"])
def greet():
   
    greeting = "Hello, I'm Aurora. How are you feeling today?"
    audio_bytes = text_to_speech(greeting)

    return send_file(
        BytesIO(audio_bytes),
        mimetype="audio/mpeg",
        as_attachment=False
    )


# -------------------------------------------------------------
# 2) SPEAK BASED ON EMOTIONAL STATE (PAD values)
# -------------------------------------------------------------
@aurora_bp.route("/speak", methods=["POST"])
def speak():
   
    
    data = request.get_json()
    p = data.get("valence")
    a = data.get("arousal")
    d = data.get("dominance")

    if p is None or a is None or d is None:
        return jsonify({"error": "Missing PAD values"}), 400

    # Generate emotional state + Aurora's reaction
    result = generate_response(p, a, d)
    aurora_text = result["aurora_response"]

    audio_bytes = text_to_speech(aurora_text)

    return send_file(
        BytesIO(audio_bytes),
        mimetype="audio/mpeg",
        as_attachment=False
    )


# -------------------------------------------------------------
# 3) FULL VOICE CONVERSATION
# Whisper → GPT → ElevenLabs TTS
# -------------------------------------------------------------
@aurora_bp.route("/converse", methods=["POST"])
def aurora_converse():
   
    if "audio" not in request.files:
        return jsonify({"error": "Audio file required"}), 400

    # 1) Read audio blob from request
    audio_bytes = request.files["audio"].read()

    # 2) Convert voice → text
    user_text = speech_to_text(audio_bytes)
    if not user_text:
        return jsonify({"error": "Whisper failed to transcribe"}), 500

    # 3) Generate GPT-based Aurora response (persona included)
    reply_text = aurora_reply(user_text)

    # 4) Convert text → voice
    audio_out = text_to_speech(reply_text)

    # 5) Return MP3 stream
    return send_file(
        BytesIO(audio_out),
        mimetype="audio/mpeg",
        as_attachment=False
    )
"""""""""""""""