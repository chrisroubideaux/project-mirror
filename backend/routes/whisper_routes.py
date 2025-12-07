# backend/routes/whisper_routes.py
# backend/routes/whisper_routes.py

import io
from flask import Blueprint, request, jsonify
from services.aurora_whisper import speech_to_text

whisper_bp = Blueprint("whisper", __name__, url_prefix="/api/whisper")


@whisper_bp.route("/transcribe", methods=["POST"])
def whisper_transcribe():
    # -------------------------
    # Validate presence of audio field
    # -------------------------
    if "audio" not in request.files:
        return jsonify({"error": "audio file required"}), 400

    audio_file = request.files["audio"]

    # -------------------------
    # Validate audio content
    # -------------------------
    audio_bytes = audio_file.read()
    if not audio_bytes or len(audio_bytes) < 2000:
        # Whisper models fail silently on tiny/empty buffers
        return jsonify({"text": ""}), 200

    # -------------------------
    # Run Whisper STT
    # -------------------------
    try:
        text = speech_to_text(audio_bytes)
    except Exception as e:
        print("WHISPER ROUTE ERROR:", repr(e))
        return jsonify({"text": ""}), 200

    if not text:
        return jsonify({"text": ""}), 200

    return jsonify({"text": text}), 200
