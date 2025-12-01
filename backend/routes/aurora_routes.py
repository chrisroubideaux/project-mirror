# backend/routes/aurora_routes.py
# backend/routes/aurora_routes.py

from flask import Blueprint, request, jsonify, send_file
from io import BytesIO
from typing import Optional, Dict

from services.aurora_whisper import aurora_whisper_reply, speech_to_text
from services.aurora_speech import text_to_speech

aurora_bp = Blueprint("aurora", __name__, url_prefix="/api/aurora")


@aurora_bp.route("/greet", methods=["GET"])
def greet():
    """
    Simple session greeting.
    Aurora introduces herself once when the user starts the emotion scan.
    """
    message = (
        "Hi, I’m Aurora. Whenever you’re ready, you can just talk to me, "
        "and I’ll listen."
    )
    audio = text_to_speech(message)
    return send_file(BytesIO(audio), mimetype="audio/mpeg")


@aurora_bp.route("/converse", methods=["POST"])
def converse():
    """
    Main voice endpoint:
    - Accepts mic audio from the browser
    - Whisper → text
    - Aurora GPT → reply (with optional emotion + interruption context)
    - ElevenLabs → MP3
    """
    if "audio" not in request.files:
        return jsonify({"error": "audio required"}), 400

    audio_bytes = request.files["audio"].read()

    # 1) STT
    user_text = speech_to_text(audio_bytes)
    if not user_text:
        # No meaningful speech detected, don't TTS noise
        return jsonify({"error": "no speech detected"}), 200

    # 2) Optional contextual fields from frontend
    state: Optional[str] = request.form.get("state") or None
    valence_raw = request.form.get("valence")
    arousal_raw = request.form.get("arousal")
    dominance_raw = request.form.get("dominance")
    was_interrupted = request.form.get("was_interrupted") == "true"

    pad: Optional[Dict[str, float]] = None
    if valence_raw and arousal_raw and dominance_raw:
        try:
            pad = {
                "valence": float(valence_raw),
                "arousal": float(arousal_raw),
                "dominance": float(dominance_raw),
            }
        except ValueError:
            pad = None

    # 3) GPT Brain
    reply_text = aurora_whisper_reply(
        user_text=user_text,
        persona="therapist",       # could later be user-configurable
        emotion_state=state,
        pad=pad,
        was_interrupted=was_interrupted,
    )

    # 4) TTS
    audio_out = text_to_speech(reply_text)

    return send_file(
        BytesIO(audio_out),
        mimetype="audio/mpeg",
        as_attachment=False,
    )




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