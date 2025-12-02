# backend/services/aurora_whisper.py
# backend/services/aurora_whisper.py
import os
import io
from typing import List, Dict, Any, Optional
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -------------------------------------------------------------------
# 1. SIMPLE IN-MEMORY CONTEXT (last 4 turns)
# -------------------------------------------------------------------
CONTEXT_BUFFER: List[Dict[str, str]] = []
MAX_TURNS = 4  # user+assistant pairs


def add_to_context(role: str, content: str) -> None:
    """
    Store the last few turns in a tiny memory ring.
    Example: {"role": "user", "content": "..."}
    """
    if not content:
        return
    CONTEXT_BUFFER.append({"role": role, "content": content})
    # Only keep last N messages
    while len(CONTEXT_BUFFER) > MAX_TURNS * 2:
        CONTEXT_BUFFER.pop(0)


def get_recent_context() -> List[Dict[str, str]]:
    """
    Returns a shallow copy of the last few turns.
    """
    return CONTEXT_BUFFER[-MAX_TURNS * 2 :]


# -------------------------------------------------------------------
# 2. SPEECH → TEXT (Whisper)
# -------------------------------------------------------------------
def speech_to_text(audio_bytes: bytes) -> str:
    print("DEBUG — incoming audio size:", len(audio_bytes))

    if not audio_bytes or len(audio_bytes) < 2000:
        print("Whisper STT Error: Audio too short or empty")
        return ""

    try:
        audio_file = io.BytesIO(audio_bytes)
        # MUST match frontend mime type (MediaRecorder webm)
        audio_file.name = "speech.webm"

        transcript = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
            language="en",  # bias strongly toward English
        )

        text = (transcript.text or "").strip()
        print("DEBUG — Whisper text:", text)
        return text
    except Exception as e:
        print("Whisper STT Error:", repr(e))
        return ""


# -------------------------------------------------------------------
# 3. LIGHTWEIGHT EMOTION ESTIMATE (from text)
# -------------------------------------------------------------------
def estimate_emotion_from_text(user_text: str) -> Dict[str, Any]:
    """
    Cheap single-call classifier using GPT: give
    - coarse emotion label
    - valence / arousal / dominance (0–1)
    - short internal tag (used only for tone, not spoken)
    """
    if not user_text:
        return {
            "label": "neutral",
            "valence": 0.5,
            "arousal": 0.4,
            "dominance": 0.5,
            "state": "neutral",
        }

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            max_tokens=80,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an emotion classifier. "
                        "Given a short user utterance, output a JSON object with:\n"
                        "{\n"
                        '  "label": one of ["joy","sadness","anger","fear","anxiety","frustration","calm","neutral"],\n'
                        '  "valence": number 0-1,\n'
                        '  "arousal": number 0-1,\n'
                        '  "dominance": number 0-1,\n'
                        '  "state": short 1-2 word emotional state label\n'
                        "}\n"
                        "Do not include any extra text, just JSON."
                    ),
                },
                {"role": "user", "content": user_text},
            ],
        )

        raw = resp.choices[0].message.content.strip()

        # quick + dirty JSON parsing without importing json if malformed
        import json

        try:
            parsed = json.loads(raw)
        except Exception:
            # fallback if model adds text
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(raw[start : end + 1])
            else:
                raise

        label = parsed.get("label", "neutral")
        valence = float(parsed.get("valence", 0.5))
        arousal = float(parsed.get("arousal", 0.4))
        dominance = float(parsed.get("dominance", 0.5))
        state = parsed.get("state", label)

        return {
            "label": label,
            "valence": max(0.0, min(1.0, valence)),
            "arousal": max(0.0, min(1.0, arousal)),
            "dominance": max(0.0, min(1.0, dominance)),
            "state": state,
        }

    except Exception as e:
        print("Emotion classifier error:", repr(e))
        return {
            "label": "neutral",
            "valence": 0.5,
            "arousal": 0.4,
            "dominance": 0.5,
            "state": "neutral",
        }


# -------------------------------------------------------------------
# 4. GPT REPLY (Aurora Brain) — uses context + emotion
# -------------------------------------------------------------------
def aurora_brain_reply(user_text: str) -> str:
    """
    High-level brain: blends
      - recent context (last 4 turns)
      - text-based emotion signal
    Returns a short, natural voice-friendly reply.
    """

    if not user_text:
        return "I didn’t quite catch that. Could you say that again, a little closer to the microphone?"

    # 1) Add user turn to context
    add_to_context("user", user_text)

    # 2) Estimate emotion from text (cheap + fast)
    emo = estimate_emotion_from_text(user_text)
    state = emo["state"]
    valence = emo["valence"]
    arousal = emo["arousal"]

    # 3) Build system prompt with emotional blending
    #    (slightly more upbeat when valence is high, softer when low)
    if valence < 0.35:
        mood_line = (
            "The user may be struggling or low. "
            "Be especially gentle, validating, and non-judgmental."
        )
    elif valence > 0.7:
        mood_line = (
            "The user sounds fairly positive. "
            "Reflect their energy with light warmth but don't overdo the cheerfulness."
        )
    else:
        mood_line = (
            "The user seems somewhere in the middle. "
            "Stay steady, grounded, and calmly attentive."
        )

    arousal_hint = (
        "Their energy might be a bit activated or stressed."
        if arousal > 0.65
        else "Their energy seems relatively calm or soft."
    )

    system_prompt = f"""
You are Aurora — a gentle, emotionally intelligent English-speaking voice companion.

You are aware of the user's *approximate* emotional state:
- state: {state}
- valence: {valence:.2f}
- arousal: {arousal:.2f}

Use this information subtly. Do NOT mention valence or arousal directly.
Just let it shape your tone.

Guidelines:
- Always reply in natural, conversational ENGLISH only.
- 1–3 sentences max.
- Avoid sounding like a therapist robot or using heavy clinical terms.
- Be concise, grounded, and present.
- Ask at most one simple follow-up question, and only if it feels natural.
- Do NOT invent facts about the user's life; only build on what they actually said.

Tone shaping:
- {mood_line}
- {arousal_hint}
""".strip()

    # 4) Build messages with short context
    recent = get_recent_context()
    messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
    messages.extend(recent)

    # 5) Call GPT
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.65,
            max_tokens=140,
            messages=messages,
        )
        reply = resp.choices[0].message.content.strip()
        print("AURORA REPLY >>>", reply)

        add_to_context("assistant", reply)
        return reply

    except Exception as e:
        print("GPT ERROR:", repr(e))
        return "I’m still here with you, just having a small technical issue. Let’s try that again in a moment."


# -------------------------------------------------------------------
# 5. Public helper for route
# -------------------------------------------------------------------
def aurora_whisper_reply(user_text: str) -> str:
    return aurora_brain_reply(user_text)


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