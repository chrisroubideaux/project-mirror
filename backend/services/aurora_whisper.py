# backend/services/aurora_whisper.py
import os
import io
from typing import List, Dict, Any
from openai import OpenAI

from services.datetime_context import get_time_context

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -------------------------------------------------------------------
# 1. SHORT-TERM MEMORY + NAME LOCK
# -------------------------------------------------------------------

CONTEXT_BUFFER: List[Dict[str, str]] = []
MAX_TURNS = 3

LOCKED_USER_NAME: str | None = None   # ✅ Name lock lives here


def lock_name_if_valid(name: str):
    global LOCKED_USER_NAME
    if not LOCKED_USER_NAME and name:
        nm = name.strip().split(" ")[0].lower()
        if len(nm) >= 2 and nm not in ["friend", "guest", "unknown", "my", "the"]:
            LOCKED_USER_NAME = nm
            print("✅ NAME LOCKED:", LOCKED_USER_NAME)


def get_locked_name() -> str:
    return LOCKED_USER_NAME or ""


def add_to_context(role: str, content: str):
    if not content:
        return

    CONTEXT_BUFFER.append({"role": role, "content": content})
    while len(CONTEXT_BUFFER) > MAX_TURNS * 2:
        CONTEXT_BUFFER.pop(0)


def get_recent_context():
    return [
        turn for turn in CONTEXT_BUFFER[-MAX_TURNS * 2:]
        if turn["role"] in ("user", "assistant")
    ]


# -------------------------------------------------------------------
# 2. WHISPER STT (FALSE POSITIVE FIX)
# -------------------------------------------------------------------

def speech_to_text(audio_bytes: bytes) -> str:
    print("DEBUG — incoming audio size:", len(audio_bytes))

    if not audio_bytes or len(audio_bytes) < 4000:
        return ""

    try:
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "speech.webm"

        transcript = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
            language="en",
        )

        text = (transcript.text or "").strip()
        print("DEBUG — Whisper text:", text)

        # ✅ FIX: ignore junk/noise output
        if not text or len(text) < 2:
            return ""

        return text

    except Exception as e:
        print("Whisper STT Error:", repr(e))
        return ""


# -------------------------------------------------------------------
# 3. AURORA BRAIN — VISION EMOTION + NAME LOCK + NO SELF-INTRO EVER
# -------------------------------------------------------------------

def aurora_brain_reply(
    user_text: str,
    user_name: str = "",
    face_emotion: str = "",
    valence: float = 0.5,
    arousal: float = 0.5,
    dominance: float = 0.5,
) -> str:

    if not user_text:
        return "I didn’t quite catch that. Could you say it again?"

    # ✅ NAME LOCK
    if user_name:
        lock_name_if_valid(user_name)

    locked_name = get_locked_name()

    add_to_context("user", user_text)

    # ✅ INTERNAL EMOTIONAL MODULATION FROM VISION
    emotional_style = "neutral"

    if valence < 0.3:
        emotional_style = "very_soft"
    elif valence < 0.5:
        emotional_style = "soft"
    elif valence > 0.75:
        emotional_style = "warm"

    if arousal > 0.75:
        emotional_style += "_grounding"

    # ✅ SYSTEM PROMPT — HARD RULES
    system_prompt = f"""
You are Aurora — a calm, emotionally grounded therapist-like companion.

ABSOLUTE NON-NEGOTIABLE RULES:
• Never introduce yourself.
• Never say your name.
• Never explain who you are.
• Never analyze emotions out loud.
• Never mention emotion labels.
• Never mention time, camera, system, or environment.
• Never repeat the greeting behavior.
• Never guess names.

STYLE RULES:
• 1–2 short natural sentences.
• Calm, validating, grounded.
• Ask at most one gentle question.
• If a name exists ("{locked_name}"), you may use it occasionally, never every reply.

INTERNAL ONLY (DO NOT SAY):
• Face emotion: {face_emotion}
• valence={valence:.2f}
• arousal={arousal:.2f}
• dominance={dominance:.2f}
• style={emotional_style}
""".strip()

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(get_recent_context())

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.6,
            max_tokens=120,
            messages=messages,
        )

        reply = resp.choices[0].message.content.strip()
        add_to_context("assistant", reply)

        print("AURORA REPLY >>>", reply)
        return reply

    except Exception as e:
        print("GPT ERROR:", repr(e))
        return "I'm here with you. We can try again."


# -------------------------------------------------------------------
# 4. PUBLIC WRAPPER
# -------------------------------------------------------------------

def aurora_whisper_reply(
    user_text: str,
    user_name: str = "",
    face_emotion: str = "",
    valence: float = 0.5,
    arousal: float = 0.5,
    dominance: float = 0.5,
) -> str:
    return aurora_brain_reply(
        user_text=user_text,
        user_name=user_name,
        face_emotion=face_emotion,
        valence=valence,
        arousal=arousal,
        dominance=dominance,
    )


"""""""""

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
   
    if not content:
        return
    CONTEXT_BUFFER.append({"role": role, "content": content})
    # Only keep last N messages
    while len(CONTEXT_BUFFER) > MAX_TURNS * 2:
        CONTEXT_BUFFER.pop(0)


def get_recent_context() -> List[Dict[str, str]]:
   
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