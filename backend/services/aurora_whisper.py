# backend/services/aurora_whisper.py

import os
import io
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

PERSONAS = {
    "therapist": """
You are Aurora — a gentle, emotionally mature therapist.
Your tone is warm, grounding, validating, and calm.
Avoid clinical terms. Keep responses human, supportive, 2–4 sentences.
""",
    "friend": """
You are Aurora — a supportive, funny, down-to-earth friend.
Use casual modern language. Be warm, relatable, and encouraging.
Keep responses 2–4 sentences.
""",
    "companion": """
You are Aurora — a soft, affectionate companion.
Warm, caring, emotionally intuitive. Nurturing tone.
Keep responses 2–4 sentences.
""",
    "guide": """
You are Aurora — a wise, intuitive guide.
Calm, grounded, thoughtful. 2–4 sentences.
"""
}

# ---------------------------------------------------------
# SPEECH → TEXT
# ---------------------------------------------------------
def speech_to_text(audio_bytes: bytes) -> str:
    print("DEBUG — incoming audio size:", len(audio_bytes))

    if not audio_bytes or len(audio_bytes) < 1500:
        print("Whisper Error: audio too short")
        return ""

    try:
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "speech.webm"

        transcript = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
        )

        text = (transcript.text or "").strip()
        print("DEBUG — Whisper text:", text)
        return text

    except Exception as e:
        print("Whisper STT Error:", repr(e))
        return ""


# ---------------------------------------------------------
# GPT REPLY
# ---------------------------------------------------------
def aurora_reply(user_text: str, persona: str = "therapist") -> str:
    if not user_text.strip():
        return "I didn’t hear anything. Try speaking again."

    persona_prompt = PERSONAS.get(persona.lower(), PERSONAS["therapist"])

    system_prompt = persona_prompt + "\nRespond naturally and supportively."

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            temperature=0.6,
            max_tokens=150,
        )

        reply = response.choices[0].message.content.strip()
        print("AURORA REPLY:", reply)
        return reply

    except Exception as e:
        print("GPT ERROR:", e)
        return "I'm here with you. Let's try that again gently."


# ---------------------------------------------------------
# SAFE WRAPPER FOR /converse
# ---------------------------------------------------------
def aurora_whisper_reply(user_text: str, **kwargs) -> str:
    """
    This safely ignores extra arguments like state/valence/etc.
    """
    return aurora_reply(user_text, persona="therapist")



"""""""""
import os
from openai import OpenAI

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_KEY)

def speech_to_text(audio_bytes: bytes) -> str:
    try:
        transcript = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=("audio.webm", audio_bytes, "audio/webm")
        )
        return transcript.text.strip()
    except Exception as e:
        print("Whisper STT Error:", e)
        return ""

"""""""""