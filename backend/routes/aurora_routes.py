# backend/routes/aurora_routes.py
# backend/routes/aurora_routes.py

from flask import Blueprint, request, jsonify, send_file
from io import BytesIO

from services.aurora_whisper import speech_to_text, aurora_whisper_reply
from services.aurora_speech import text_to_speech

aurora_bp = Blueprint("aurora", __name__, url_prefix="/api/aurora")


@aurora_bp.route("/greet", methods=["GET"])
def greet():
    """
    Initial greeting when the user starts a session.
    """
    message = "Hi, I’m Aurora. Whenever you’re ready, you can talk to me."
    audio = text_to_speech(message)
    return send_file(BytesIO(audio), mimetype="audio/mpeg")


@aurora_bp.route("/converse", methods=["POST"])
def converse():
    """
    Main voice endpoint:
    - Accepts audio from the browser (MediaRecorder/webm)
    - Whisper → text
    - Aurora (GPT) → reply (with short memory + emotion tone)
    - ElevenLabs → MP3 audio
    """
    if "audio" not in request.files:
        return jsonify({"error": "audio required"}), 400

    audio_bytes = request.files["audio"].read()
    if not audio_bytes:
        return jsonify({"error": "empty audio"}), 400

    # 1) STT
    user_text = speech_to_text(audio_bytes)
    if not user_text:
        # No usable speech; just return 204 so frontend skips playback
        return "", 204

    # 2) Optional emotion context (passed from frontend)
    state = request.form.get("state")

    def parse_float(name: str):
        raw = request.form.get(name)
        if raw is None or raw == "":
            return None
        try:
            return float(raw)
        except ValueError:
            return None

    valence = parse_float("valence")
    arousal = parse_float("arousal")
    dominance = parse_float("dominance")

    # 3) GPT reply with persona + emotion tone + short memory
    reply = aurora_whisper_reply(
        user_text=user_text,
        persona="therapist",
        state=state,
        valence=valence,
        arousal=arousal,
        dominance=dominance,
    )

    # 4) TTS (ElevenLabs)
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