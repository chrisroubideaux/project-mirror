# backend/services/aurora_whisper.py
# backend/services/aurora_whisper.py

import os
import io
from typing import List, Dict, Any, Optional
from openai import OpenAI

from services.datetime_context import get_time_context

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -------------------------------------------------------------------
# 1. SIMPLE IN-MEMORY CONTEXT (last 2 turns)
# -------------------------------------------------------------------

CONTEXT_BUFFER: List[Dict[str, str]] = []
MAX_TURNS = 2  # number of user+assistant pairs to keep


def add_to_context(role: str, content: str) -> None:
    """Append a turn to short-term memory."""
    if not content:
        return

    CONTEXT_BUFFER.append({"role": role, "content": content})

    while len(CONTEXT_BUFFER) > MAX_TURNS * 2:
        CONTEXT_BUFFER.pop(0)


def get_recent_context() -> List[Dict[str, str]]:
    """Return the recent conversation context (user + assistant only)."""
    return [
        turn
        for turn in CONTEXT_BUFFER[-MAX_TURNS * 2 :]
        if turn["role"] in ("user", "assistant")
    ]


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


# -------------------------------------------------------------------
# 3. GPT REPLY — Aurora Brain with VISION EMOTION CONTEXT
# -------------------------------------------------------------------

def aurora_brain_reply(
    user_text: str,
    user_name: str = "",
    face_emotion: Optional[str] = None,
    face_valence: Optional[float] = None,
    face_arousal: Optional[float] = None,
    face_dominance: Optional[float] = None,
) -> str:
    """
    Generate Aurora's therapist-like reply, using:
      - user_text (from Whisper)
      - optional face emotion context from the camera
    """

    print(">>> NEW AURORA BRAIN ACTIVE (VISION EMOTION) <<<")

    if not user_text:
        return "I didn’t quite catch that. Could you try saying it once more?"

    # Check if this is basically the first turn (no previous context)
    is_first_turn = len(get_recent_context()) == 0

    add_to_context("user", user_text)

    # Safely normalize emotion inputs
    face_emotion = (face_emotion or "").lower().strip()
    if face_emotion not in [
        "happy",
        "sad",
        "angry",
        "fearful",
        "surprised",
        "disgusted",
        "tired",
        "stressed",
        "confused",
        "neutral",
        "uncertain",
    ]:
        face_emotion = "neutral" if face_emotion else "neutral"

    def clamp01(x: Optional[float], default: float) -> float:
        try:
            if x is None:
                return default
            return max(0.0, min(1.0, float(x)))
        except (TypeError, ValueError):
            return default

    valence = clamp01(face_valence, default=0.5)
    arousal = clamp01(face_arousal, default=0.4)
    dominance = clamp01(face_dominance, default=0.5)

    # Time (internal only, not spoken)
    t = get_time_context()
    tod = t["time_of_day"]
    clock = t["full_time"]

    # Clean optional name
    sanitized_name = ""
    if user_name:
        nm = user_name.strip().split(" ")[0]
        if nm and nm.lower() not in ["unknown", "guest", "friend"]:
            sanitized_name = nm

    # Map vision emotion + valence/arousal to an internal "tone style"
    tone = "neutral"

    if face_emotion in ["sad", "tired", "stressed"]:
        if valence < 0.4:
            tone = "very_soft"
    elif face_emotion in ["happy"]:
        if valence > 0.6:
            tone = "warm"
    elif face_emotion in ["angry", "fearful", "confused"]:
        tone = "soft_grounding"

    # arousal modulation
    if arousal > 0.7:
        if tone == "neutral":
            tone = "grounding"
        elif "soft" in tone:
            tone = tone + "_grounding"

    # Extra guard: if this is basically an intro / first turn and user just says their name,
    # do NOT comment on emotion yet.
    user_text_lower = user_text.lower()
    intro_like = (
        "my name is" in user_text_lower
        or user_text_lower.strip() in ["my name is", "it's me", "it's", "i'm"]
        or len(user_text.split()) <= 3
    )

    # Build internal emotion summary (NOT spoken, only used in instructions)
    internal_emotion_desc = (
        f"vision_emotion={face_emotion}, "
        f"valence={valence:.2f}, arousal={arousal:.2f}, dominance={dominance:.2f}"
    )

    system_prompt = f"""
You are Aurora — a warm, grounded, therapist-like companion.
You respond in a natural human voice using 1–2 short sentences.

ABSOLUTE RULES:
• Never introduce yourself.
• Never say your own name.
• Never explain how you work or mention cameras, screens, or detection.
• Never mention, name, or analyze the user's emotions or facial expression
  unless the user explicitly talks about how they feel.
• Never reference valence, arousal, state, or any metadata.
• Never comment that they “sound happy” or similar based only on a brief introduction.
• Never guess or invent a name.

WHEN USER ONLY INTRODUCES THEMSELVES (like “my name is ...” or very short intros)
AND this is at the very start of the conversation:
• Do NOT comment on how they feel.
• Just acknowledge their name politely and invite them to share what’s on their mind.

CONSISTENT STYLE:
• Be calm, validating, and present.
• Respond directly to what the user just said.
• Use simple, human language (no clinical jargon).
• Ask at most one gentle, open-ended question.
• If a name (“{sanitized_name}”) is provided, you may use it occasionally and naturally, not in every reply.

INTERNAL ONLY — DO NOT SAY THIS OUT LOUD:
• Visual emotion context: {internal_emotion_desc}
• Time: {clock} ({tod})
• Internal tone style: {tone}
• is_first_turn={is_first_turn}, intro_like={intro_like}
""".strip()

    messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
    messages.extend(get_recent_context())

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.65,
            max_tokens=120,
            messages=messages,
        )

        reply = resp.choices[0].message.content.strip()
        add_to_context("assistant", reply)

        print("AURORA REPLY >>>", reply)
        return reply

    except Exception as e:
        print("GPT ERROR:", repr(e))
        return (
            "I'm still here with you — we can try that again in a moment if you’d like."
        )


# -------------------------------------------------------------------
# 4. Public wrapper
# -------------------------------------------------------------------

def aurora_whisper_reply(
    user_text: str,
    user_name: str = "",
    face_emotion: Optional[str] = None,
    face_valence: Optional[float] = None,
    face_arousal: Optional[float] = None,
    face_dominance: Optional[float] = None,
) -> str:
    return aurora_brain_reply(
        user_text=user_text,
        user_name=user_name,
        face_emotion=face_emotion,
        face_valence=face_valence,
        face_arousal=face_arousal,
        face_dominance=face_dominance,
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