# backend/routes/voice_chat_routes.py

from flask import Blueprint, request, jsonify, send_file
import tempfile
import os
import openai

from services.hf_emotion import analyze_emotion
from services.aurora_speech import text_to_speech

voice_chat_bp = Blueprint("voice_chat", __name__, url_prefix="/api/voice")

openai.api_key = os.getenv("OPENAI_API_KEY")

# -----------------------------
# Whisper speech-to-text
# -----------------------------
def whisper_transcribe(audio_path):
    with open(audio_path, "rb") as f:
        transcript = openai.Audio.transcribe("whisper-1", f)
    return transcript["text"]


# -----------------------------
# ChatGPT with emotion context
# -----------------------------
def chat_with_emotion(user_text, emotion):
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Aurora, a warm conversational AI. "
                    f"The user is currently feeling **{emotion}**. "
                    "Respond empathetically, naturally, and conversationally."
                )
            },
            {"role": "user", "content": user_text}
        ]
    )

    return response["choices"][0]["message"]["content"]


# -----------------------------
# MAIN ROUTE
# -----------------------------
@voice_chat_bp.route("/chat", methods=["POST"])
def chat():
    if "audio" not in request.files:
        return jsonify({"error": "audio file required"}), 400

    # Get audio
    audio_file = request.files["audio"]
    temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    audio_file.save(temp_audio.name)

    # Get emotion from frontend
    emotion = request.form.get("emotion", "neutral")

    # Transcribe
    user_text = whisper_transcribe(temp_audio.name)

    # ChatGPT with emotion
    ai_text = chat_with_emotion(user_text, emotion)

    # ElevenLabs voice
    audio_bytes = text_to_speech(ai_text)

    return jsonify({
        "emotion": emotion,
        "response_text": ai_text,
        "audio_base64": audio_bytes.decode("latin1"),
        "transcript": user_text
    })
