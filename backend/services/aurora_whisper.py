# backend/services/aurora_whisper.py
# backend/services/aurora_whisper.py

import os
import io
from collections import deque
from typing import Dict, Any, List, Optional

from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------------------------------------------------------
# PERSONAS
# ---------------------------------------------------------
PERSONAS: Dict[str, str] = {
    "therapist": """
You are Aurora — a gentle, emotionally mature therapist.
Your tone is warm, grounding, validating, and calm.
Avoid clinical or diagnostic language.
Keep responses human, supportive, and 1–3 sentences.
""",
    "friend": """
You are Aurora — a supportive, funny, down-to-earth friend.
Use warm, casual language. Be encouraging and relatable.
Keep responses 1–3 sentences.
""",
    "companion": """
You are Aurora — a soft, affectionate long-term companion.
Warm, caring, emotionally intuitive and nurturing.
Keep responses 1–3 sentences.
""",
    "guide": """
You are Aurora — a wise, grounded guide.
You blend intuition, emotional insight, and clear reasoning.
Calm, concise, slightly poetic but very clear. 1–3 sentences.
""",
}

# ---------------------------------------------------------
# SHORT-TERM MEMORY (last 6 messages)
# ---------------------------------------------------------
# We keep the last few user/assistant turns to maintain coherence.
CONVERSATION_HISTORY: deque = deque(maxlen=6)


def _build_system_prompt(
    persona: str,
    emotion_state: Optional[str],
    pad: Optional[Dict[str, float]],
    was_interrupted: bool,
) -> str:
    base = PERSONAS.get(persona.lower(), PERSONAS["therapist"])

    language_rule = """
You are speaking to the user via voice only.
Always reply in natural, conversational ENGLISH only.
Do not switch languages, even if input text looks foreign.
Do not invent specific facts or details that the user has not mentioned.
Keep replies grounded, empathetic, and 1–3 sentences long.
"""

    interruption_note = ""
    if was_interrupted:
        interruption_note = """
You were interrupted mid-sentence previously.
Acknowledge the interruption gently if appropriate (once), then continue naturally.
Do not apologize repeatedly.
"""

    emotion_note = ""
    if emotion_state or pad:
        emotion_note = "\nThe camera is giving you a sense of the user's emotional state.\n"

        if emotion_state:
            emotion_note += f"High-level state: {emotion_state}.\n"

        if pad:
            v = pad.get("valence")
            a = pad.get("arousal")
            d = pad.get("dominance")
            emotion_note += (
                "PAD (Pleasure/Valence, Arousal, Dominance) hints:\n"
                f"- Valence (0–1): {v}\n"
                f"- Arousal (0–1): {a}\n"
                f"- Dominance (0–1): {d}\n"
                "Use these only to adjust your *tone*, not to diagnose.\n"
            )

    return base + language_rule + interruption_note + emotion_note


# ---------------------------------------------------------
# SPEECH → TEXT (Whisper)
# ---------------------------------------------------------
def speech_to_text(audio_bytes: bytes) -> str:
    """
    Convert raw audio bytes (webm from browser) into text using OpenAI STT.
    """
    print("DEBUG — incoming audio size:", len(audio_bytes))

    if not audio_bytes or len(audio_bytes) < 1500:
        print("Whisper STT Error: Audio too short or empty")
        return ""

    try:
        audio_file = io.BytesIO(audio_bytes)
        # Match browser encoding (we send audio/webm from frontend)
        audio_file.name = "speech.webm"

        transcript = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
            language="en",
        )

        text = (transcript.text or "").strip()
        print("DEBUG — Whisper text:", text)
        return text

    except Exception as e:
        print("Whisper STT Error:", repr(e))
        return ""


# ---------------------------------------------------------
# GPT REPLY (Aurora Brain)
# ---------------------------------------------------------
def aurora_whisper_reply(
    user_text: str,
    persona: str = "therapist",
    emotion_state: Optional[str] = None,
    pad: Optional[Dict[str, float]] = None,
    was_interrupted: bool = False,
) -> str:
    """
    Main brain function:
    - Uses short-term conversation memory
    - Blends in emotion hints (PAD + state)
    - Handles interruption-friendly tone
    """

    if not user_text:
        return "I didn’t quite catch that. Could you say it one more time for me?"

    system_prompt = _build_system_prompt(
        persona=persona,
        emotion_state=emotion_state,
        pad=pad,
        was_interrupted=was_interrupted,
    )

    # Build message list: system + recent history + new user message
    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt}
    ]

    # Add prior turns from memory
    for m in CONVERSATION_HISTORY:
        # Each m is already {"role": "user"/"assistant", "content": "..."}
        messages.append(m)

    # Add the new user input
    messages.append({"role": "user", "content": user_text})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.5,
            max_tokens=150,
        )

        reply = response.choices[0].message.content.strip()
        print("AURORA REPLY >>>", reply)

        # Update memory (append new user + assistant messages)
        CONVERSATION_HISTORY.append({"role": "user", "content": user_text})
        CONVERSATION_HISTORY.append({"role": "assistant", "content": reply})

        return reply

    except Exception as e:
        print("GPT ERROR:", repr(e))
        return "I’m here with you. Let’s give that another gentle try."



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