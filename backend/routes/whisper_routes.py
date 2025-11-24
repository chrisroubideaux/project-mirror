# backend/routes/whisper_routes.py

import os
from flask import Blueprint, request, jsonify
from openai import OpenAI

whisper_bp = Blueprint("whisper", __name__, url_prefix="/api/whisper")

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@whisper_bp.route("/transcribe", methods=["POST"])
def transcribe_audio():
    """
    Expects: multipart/form-data with field 'audio'
      - audio/webm
      - audio/wav
      - audio/mp3
      - audio/m4a

    Returns:
      {
        "text": "user's spoken words"
      }
    """
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]

    try:
        transcript = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file
        )
        return jsonify({"text": transcript.text}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
