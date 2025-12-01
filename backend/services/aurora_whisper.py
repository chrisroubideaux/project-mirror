# backend/services/aurora_whisper.py
# backend/services/aurora_whisper.py

import os
import io
from typing import List, Dict, Optional

from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------------------------------------------------------
# PERSONAS
# ---------------------------------------------------------
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
You are Aurora — a soft, affectionate long-term companion.
Warm, caring, emotionally intuitive. Nurturing tone.
Keep responses 2–4 sentences.
""",
    "guide": """
You are Aurora — a wise, insightful guide.
Blends intuition, emotional intelligence, and grounded reasoning.
Calm, short, poetic but clear. 2–4 sentences.
"""
}

# ---------------------------------------------------------
# SHORT-TERM CHAT MEMORY (last ~3 turns)
# ---------------------------------------------------------
CHAT_HISTORY: List[Dict[str, str]] = []
MAX_MEMORY_MESSAGES = 6  # user/assistant pairs (~3 turns)


def _trim_history() -> None:
    global CHAT_HISTORY
    if len(CHAT_HISTORY) > MAX_MEMORY_MESSAGES:
        CHAT_HISTORY = CHAT_HISTORY[-MAX_MEMORY_MESSAGES:]


# ---------------------------------------------------------
# EMOTION → TONE MAPPING
# ---------------------------------------------------------
def emotion_to_tone(
    state: Optional[str],
    valence: Optional[float],
    arousal: Optional[float],
    dominance: Optional[float],
) -> str:
    """
    Map the PAD / state into a tone hint for Aurora.
    Very lightweight, just enough to feel more "alive".
    """
    s = (state or "").lower()

    if s in {"sad", "sadness"}:
        return "Use a very gentle, soft, slow tone. Focus on comfort and reassurance."
    if s in {"anxious", "distress", "fear"}:
        return "Speak calmly and steadily, helping them feel safe and grounded."
    if s in {"angry", "anger", "frustrated"}:
        return "Stay grounded, validating, and non-defensive. Avoid escalating."
    if s in {"happy", "joy"}:
        return "Be warmly positive and encouraging, but not overly hyper."
    if s in {"calm", "neutral"}:
        return "Use a neutral, steady tone that feels relaxed and present."

    # fallback if we don't know the state
    return "Use a neutral but warm and present tone."


# ---------------------------------------------------------
# SPEECH → TEXT (Whisper)
# ---------------------------------------------------------
def speech_to_text(audio_bytes: bytes) -> str:
    print("DEBUG — incoming audio size:", len(audio_bytes))

    if not audio_bytes or len(audio_bytes) < 1500:
        print("Whisper STT Error: Audio too short or empty")
        return ""

    try:
        audio_file = io.BytesIO(audio_bytes)
        # Match what the frontend sends (MediaRecorder webm)
        audio_file.name = "speech.webm"

        transcript = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
            language="en",  # force English transcription
        )

        text = (transcript.text or "").strip()
        print("DEBUG — Whisper text:", text)
        return text

    except Exception as e:
        print("Whisper STT Error:", repr(e))
        return ""


# ---------------------------------------------------------
# GPT REPLY (Aurora)
# ---------------------------------------------------------
def aurora_reply(
    user_text: str,
    persona: str = "therapist",
    state: Optional[str] = None,
    valence: Optional[float] = None,
    arousal: Optional[float] = None,
    dominance: Optional[float] = None,
) -> str:
    """
    Aurora reply based on user text + persona + optional emotional context.
    Uses a tiny rolling memory buffer (last ~3 turns).
    """
    global CHAT_HISTORY

    persona_prompt = PERSONAS.get(persona.lower(), PERSONAS["therapist"])
    tone_hint = emotion_to_tone(state, valence, arousal, dominance)

    system_prompt = (
        persona_prompt
        + "\nYou are speaking to the user via voice only."
        + "\nAlways reply in natural, conversational ENGLISH only."
        + "\nDo not switch languages, even if the user text looks foreign."
        + "\nDo not invent details or facts that were not mentioned."
        + "\nKeep replies grounded, empathetic, and 1–3 sentences long."
        + f"\nTone guidance: {tone_hint}"
    )

    # Build messages with short-term memory
    messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
    messages.extend(CHAT_HISTORY)  # previous user/assistant turns
    messages.append({"role": "user", "content": user_text})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.6,
            max_tokens=150,
        )

        reply = response.choices[0].message.content.strip()
        print("AURORA REPLY >>>", reply)

        # Update rolling memory
        CHAT_HISTORY.append({"role": "user", "content": user_text})
        CHAT_HISTORY.append({"role": "assistant", "content": reply})
        _trim_history()

        return reply

    except Exception as e:
        print("GPT ERROR:", e)
        return "I'm here with you. Let's try that again gently, in English."


# ---------------------------------------------------------
# WRAPPER FOR CONVERSATIONAL ENDPOINT
# ---------------------------------------------------------
def aurora_whisper_reply(
    user_text: str,
    persona: str = "therapist",
    state: Optional[str] = None,
    valence: Optional[float] = None,
    arousal: Optional[float] = None,
    dominance: Optional[float] = None,
) -> str:
    """
    Wrapper so routes can call this directly.
    """
    return aurora_reply(
        user_text=user_text,
        persona=persona,
        state=state,
        valence=valence,
        arousal=arousal,
        dominance=dominance,
    )


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