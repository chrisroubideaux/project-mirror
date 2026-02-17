# backend/services/aurora_whisper.py

import os
import io
import re
from typing import List, Dict
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -------------------------------------------------------------------
# 1. SHORT-TERM MEMORY + HARD NAME LOCK
# -------------------------------------------------------------------

CONTEXT_BUFFER: List[Dict[str, str]] = []
MAX_TURNS = 2

LOCKED_USER_NAME: str | None = None


# -------------------------------------------------------------------
# NAME EXTRACTION
# -------------------------------------------------------------------

def extract_explicit_name(text: str) -> str | None:
    """
    Detect explicit name introductions.
    Examples:
    - My name is Christian
    - I'm Alex
    - I am David
    - Call me Sarah
    """
    if not text:
        return None

    patterns = [
        r"\bmy name is ([a-zA-Z]{2,})",
        r"\bi am ([a-zA-Z]{2,})",
        r"\bi'm ([a-zA-Z]{2,})",
        r"\bcall me ([a-zA-Z]{2,})",
        r"\byou can call me ([a-zA-Z]{2,})",
    ]

    cleaned = text.lower().strip()

    for pat in patterns:
        match = re.search(pat, cleaned)
        if match:
            return match.group(1)

    return None


def lock_name(name: str):
    """
    Permanently store first name for session.
    """
    global LOCKED_USER_NAME

    if not name:
        return

    nm = name.strip().split(" ")[0].lower()

    if len(nm) >= 2:
        LOCKED_USER_NAME = nm
        print("✅ HARD NAME LOCK:", LOCKED_USER_NAME)


def get_locked_name() -> str:
    return LOCKED_USER_NAME or ""


# -------------------------------------------------------------------
# CONTEXT BUFFER
# -------------------------------------------------------------------

def add_to_context(role: str, content: str):
    if not content:
        return

    CONTEXT_BUFFER.append({"role": role, "content": content})

    # keep rolling window
    while len(CONTEXT_BUFFER) > MAX_TURNS * 2:
        CONTEXT_BUFFER.pop(0)


def get_recent_context():
    return CONTEXT_BUFFER[-MAX_TURNS * 2:]


# -------------------------------------------------------------------
# 2. WHISPER STT
# -------------------------------------------------------------------

def speech_to_text(audio_bytes: bytes) -> str:
    """
    Converts audio bytes to text using OpenAI transcription.
    """
    if not audio_bytes or len(audio_bytes) < 5000:
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

        if not text or len(text) < 2:
            return ""

        return text

    except Exception as e:
        print("Whisper STT Error:", repr(e))
        return ""


# -------------------------------------------------------------------
# 3. AURORA BRAIN
# -------------------------------------------------------------------

BASE_SYSTEM_PROMPT = """
You are Aurora — a calm, grounded, emotionally present companion.

ABSOLUTE RULES:
• Never introduce yourself.
• Never say your name.
• Never explain who you are.
• Never analyze emotions out loud.
• Never mention systems, camera, time, or environment.
• Never repeat greetings.
• Never interrupt the user.
• Never guess names.

STYLE:
• 1 short natural sentence (2 max).
• Warm, human, present.
• Ask at most ONE gentle question.
• It is okay to respond without a question.
""".strip()


def aurora_brain_reply(
    user_text: str,
    user_name: str = "",
    face_emotion: str = "",
    valence: float = 0.5,
    arousal: float = 0.5,
    dominance: float = 0.5,
) -> str:

    if not user_text:
        return ""

    # ---------------------------------------------------
    # HARD NAME DETECTION
    # ---------------------------------------------------

    explicit = extract_explicit_name(user_text)
    if explicit:
        lock_name(explicit)

    locked_name = get_locked_name()

    # ---------------------------------------------------
    # BUILD MESSAGES
    # ---------------------------------------------------

    messages = [{"role": "system", "content": BASE_SYSTEM_PROMPT}]

    # 🔥 Inject locked name so GPT can actually use it
    if locked_name:
        messages.append({
            "role": "system",
            "content": (
                f"The user's name is {locked_name.capitalize()}. "
                f"Use it naturally and sparingly when appropriate."
            )
        })

    # Optional subtle emotional steering (no overt analysis)
    if valence < 0.35:
        messages.append({
            "role": "system",
            "content": "The user seems emotionally low."
        })
    elif arousal > 0.75:
        messages.append({
            "role": "system",
            "content": "The user seems emotionally activated."
        })

    add_to_context("user", user_text)
    messages.extend(get_recent_context())

    # ---------------------------------------------------
    # GPT CALL
    # ---------------------------------------------------

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.75,
            max_tokens=60,
            messages=messages,
        )

        reply = resp.choices[0].message.content.strip()

        add_to_context("assistant", reply)

        print("AURORA REPLY >>>", reply)

        return reply

    except Exception as e:
        print("GPT ERROR:", repr(e))
        return "I'm here with you."


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

import os
import io
import re
from typing import List, Dict
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -------------------------------------------------------------------
# 1. SHORT-TERM MEMORY + HARD NAME LOCK
# -------------------------------------------------------------------

CONTEXT_BUFFER: List[Dict[str, str]] = []
MAX_TURNS = 2

LOCKED_USER_NAME: str | None = None


def extract_explicit_name(text: str) -> str | None:
    """"""""""""
    HARD OVERRIDE if user explicitly states their name.
    """"""""""""
    patterns = [
        r"\bmy name is ([a-zA-Z]{2,})",
        r"\bi am ([a-zA-Z]{2,})",
        r"\bi'm ([a-zA-Z]{2,})",
        r"\bcall me ([a-zA-Z]{2,})",
        r"\byou can call me ([a-zA-Z]{2,})",
    ]

    text = text.lower().strip()

    for pat in patterns:
        match = re.search(pat, text)
        if match:
            return match.group(1)

    return None


def lock_name(name: str):
    global LOCKED_USER_NAME
    nm = name.strip().split(" ")[0].lower()
    if len(nm) >= 2:
        LOCKED_USER_NAME = nm
        print("✅ HARD NAME LOCK:", LOCKED_USER_NAME)


def get_locked_name() -> str:
    return LOCKED_USER_NAME or ""


def add_to_context(role: str, content: str):
    if not content:
        return

    CONTEXT_BUFFER.append({"role": role, "content": content})
    while len(CONTEXT_BUFFER) > MAX_TURNS * 2:
        CONTEXT_BUFFER.pop(0)


def get_recent_context():
    return CONTEXT_BUFFER[-MAX_TURNS * 2:]


# -------------------------------------------------------------------
# 2. WHISPER STT (NO FALSE POSITIVES)
# -------------------------------------------------------------------

def speech_to_text(audio_bytes: bytes) -> str:
    print("DEBUG — incoming audio size:", len(audio_bytes))

    if not audio_bytes or len(audio_bytes) < 5000:
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

        if not text or len(text) < 2:
            return ""

        return text

    except Exception as e:
        print("Whisper STT Error:", repr(e))
        return ""


# -------------------------------------------------------------------
# 3. AURORA BRAIN — WITH HARD NAME OVERRIDE
# -------------------------------------------------------------------

BASE_SYSTEM_PROMPT = """""""""""""""""""""""""
You are Aurora — a calm, grounded, emotionally present companion.

ABSOLUTE RULES:
• Never introduce yourself.
• Never say your name.
• Never explain who you are.
• Never analyze emotions out loud.
• Never mention systems, camera, time, or environment.
• Never repeat greetings.
• Never interrupt the user.
• Never guess names.

STYLE:
• 1 short natural sentence (2 max).
• Warm, human, present.
• Ask at most ONE gentle question.
""""""""""""""""""""""""""""""".strip()

def aurora_brain_reply(
    user_text: str,
    user_name: str = "",
    face_emotion: str = "",
    valence: float = 0.5,
    arousal: float = 0.5,
    dominance: float = 0.5,
) -> str:

    if not user_text:
        return ""

    # ✅ HARD NAME OVERRIDE FROM SPEECH
    explicit = extract_explicit_name(user_text)
    if explicit:
        lock_name(explicit)

    locked_name = get_locked_name()
    add_to_context("user", user_text)

    messages = [{"role": "system", "content": BASE_SYSTEM_PROMPT}]
    messages.extend(get_recent_context())

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.75,
            max_tokens=60,
            messages=messages,
        )

        reply = resp.choices[0].message.content.strip()
        add_to_context("assistant", reply)

        print("AURORA REPLY >>>", reply)
        return reply

    except Exception as e:
        print("GPT ERROR:", repr(e))
        return "I'm here with you."


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