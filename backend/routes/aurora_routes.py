# backend/routes/aurora_routes.py
# backend/routes/aurora_routes.py

import io
import time
import os
from flask import Blueprint, request, send_file, jsonify, make_response
from openai import OpenAI

from services.aurora_whisper import (
    speech_to_text,
    aurora_whisper_reply,
    extract_explicit_name,
    lock_name,
)

from services.aurora_speech import text_to_speech
from services.datetime_context import get_time_context


# ------------------------------------------------------
# OpenAI Client
# ------------------------------------------------------
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

aurora_bp = Blueprint("aurora", __name__, url_prefix="/api/aurora")


# ======================================================
# CORS HELPERS (force headers even on send_file responses)
# ======================================================

def corsify(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Max-Age"] = "86400"
    return resp


def preflight_ok():
    # Empty 204 with CORS headers
    return corsify(make_response(("", 204)))


# ======================================================
# SAFE TTS WRAPPER
# ======================================================

def safe_tts(text: str, filename: str = "aurora.mp3"):
    MAX_RETRIES = 3

    for attempt in range(MAX_RETRIES):
        try:
            audio_bytes = text_to_speech(text)
            resp = send_file(
                io.BytesIO(audio_bytes),
                mimetype="audio/mpeg",
                as_attachment=False,
                download_name=filename,
            )
            return corsify(resp)
        except Exception as e:
            err = str(e).lower()
            if "429" in err or "rate" in err or "limit" in err:
                time.sleep(0.4 * (attempt + 1))
                continue
            break

    # fallback speech
    try:
        fallback = text_to_speech(
            "I'm having a little trouble speaking right now, but I'm here."
        )
        resp = send_file(
            io.BytesIO(fallback),
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name=filename,
        )
        return corsify(resp)
    except Exception as e:
        print("SAFE_TTS FATAL ERROR:", repr(e))
        return corsify(jsonify({"error": "TTS failed"})), 500


# ======================================================
# DYNAMIC INTRO GENERATOR (OpenAI Chat)
# ======================================================

def generate_intro_script(variation: str = "neutral") -> str:
    system_prompt = (
        "You are Aurora, a cinematic next-generation emotional intelligence system. "
        "Speak calmly, intelligently, slightly futuristic. "
        "Keep it under 80 words. Avoid sounding robotic."
    )

    user_prompt = f"Create a {variation} introduction for first-time guests."

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=180,
        )
        return (response.choices[0].message.content or "").strip() or (
            "Hello. I am Aurora. An advanced emotional intelligence system. "
            "Welcome to a new era of human and artificial awareness."
        )
    except Exception as e:
        print("INTRO GPT ERROR:", repr(e))
        return (
            "Hello. I am Aurora. "
            "An advanced emotional intelligence system. "
            "Welcome to a new era of human and artificial awareness."
        )


# ======================================================
# /ping (SANITY CHECK)
# ======================================================

@aurora_bp.route("/ping", methods=["GET", "OPTIONS"])
def aurora_ping():
    if request.method == "OPTIONS":
        return preflight_ok()
    return corsify(jsonify({"ok": True, "service": "aurora"})), 200


# ======================================================
# /greet
# ======================================================

@aurora_bp.route("/greet", methods=["GET", "OPTIONS"])
def aurora_greet():
    if request.method == "OPTIONS":
        return preflight_ok()

    ctx = get_time_context()
    tod = ctx.get("time_of_day", "night")

    if tod == "morning":
        text = (
            "Good morning. I’m Aurora. "
            "This is a space where you can talk things through… "
            "What feels like a good beginning today?"
        )
    elif tod == "afternoon":
        text = (
            "Good afternoon. I’m Aurora. "
            "If your day feels busy, we can slow it down for a moment… "
            "What would help right now?"
        )
    elif tod == "evening":
        text = (
            "Good evening. I’m Aurora. "
            "This is a place to unwind… "
            "How are you feeling tonight?"
        )
    else:
        text = (
            "Hi. I’m Aurora. "
            "It’s okay to slow down here… "
            "I’m here with you."
        )

    return safe_tts(text, filename="aurora_greet.mp3")


# ======================================================
# /intro (CINEMATIC ENTRY POINT)
# ======================================================

@aurora_bp.route("/intro", methods=["POST", "OPTIONS"])
def aurora_intro():
    if request.method == "OPTIONS":
        return preflight_ok()

    try:
        data = request.get_json(silent=True) or {}
        variation = (data.get("variation") or "neutral").strip()

        intro_text = generate_intro_script(variation)
        audio_bytes = text_to_speech(intro_text)

        resp = send_file(
            io.BytesIO(audio_bytes),
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="aurora_intro.mp3",
        )
        return corsify(resp)

    except Exception as e:
        print("INTRO ROUTE ERROR:", repr(e))
        return corsify(jsonify({"error": "Intro generation failed"})), 500


# ======================================================
# /converse (REAL-TIME SESSION)
# ======================================================

@aurora_bp.route("/converse", methods=["POST", "OPTIONS"])
def aurora_converse():
    if request.method == "OPTIONS":
        return preflight_ok()

    if "audio" not in request.files:
        return corsify(jsonify({"error": "audio file required"})), 400

    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()

    if not audio_bytes:
        return corsify(jsonify({"error": "empty audio"})), 400

    # ---------------- STT ----------------
    try:
        user_text = speech_to_text(audio_bytes)
    except Exception as e:
        print("Whisper error:", repr(e))
        user_text = None

    if not user_text:
        return safe_tts("Go ahead — I’m listening.", filename="aurora_retry.mp3")

    print("AURORA USER TEXT >>>", user_text)

    # ---------------- FAST NAME INTRO ----------------
    explicit_name = extract_explicit_name(user_text)
    if explicit_name:
        lock_name(explicit_name)
        return safe_tts(
            f"It’s nice to meet you, {explicit_name.capitalize()}.",
            filename="aurora_name_intro.mp3",
        )

    # ---------------- EMOTION CONTEXT ----------------
    def to_float(v, default=0.5):
        try:
            return float(v)
        except:
            return default

    face_emotion = (request.form.get("face_emotion") or "").strip()
    face_valence = to_float(request.form.get("valence"))
    face_arousal = to_float(request.form.get("arousal"))
    face_dominance = to_float(request.form.get("dominance"))

    # ---------------- GPT ----------------
    try:
        reply_text = aurora_whisper_reply(
            user_text=user_text,
            face_emotion=face_emotion,
            valence=face_valence,
            arousal=face_arousal,
            dominance=face_dominance,
        )
    except Exception as e:
        print("GPT ERROR:", repr(e))
        reply_text = "I’m here with you."

    # ---------------- TTS ----------------
    try:
        audio_out = text_to_speech(reply_text)
        resp = send_file(
            io.BytesIO(audio_out),
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="aurora_reply.mp3",
        )
        return corsify(resp)

    except Exception as e:
        print("TTS ERROR:", repr(e))
        return safe_tts(
            "I'm having a small technical issue, but I'm still here with you.",
            filename="aurora_error.mp3",
        )

""""""""""
# backend/routes/aurora_routes.py

import io
import random
import time
from flask import Blueprint, request, send_file, jsonify
from flask import Response
from openai import OpenAI
import os 

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

from services.aurora_whisper import (
    speech_to_text,
    aurora_whisper_reply,
    extract_explicit_name,
    lock_name,
)
from services.aurora_speech import text_to_speech
from services.datetime_context import get_time_context

aurora_bp = Blueprint("aurora", __name__, url_prefix="/api/aurora")


# ------------------------------------------------------
# Helper: Retry Wrapper
# ------------------------------------------------------
def safe_tts(text: str, filename: str = "aurora.mp3"):
    MAX_RETRIES = 3

    for attempt in range(MAX_RETRIES):
        try:
            audio_bytes = text_to_speech(text)
            return send_file(
                io.BytesIO(audio_bytes),
                mimetype="audio/mpeg",
                as_attachment=False,
                download_name=filename,
            )
        except Exception as e:
            err = str(e).lower()
            if "429" in err or "rate" in err or "limit" in err:
                time.sleep(0.4 * (attempt + 1))
                continue
            break

    # fallback
    fallback = text_to_speech(
        "I'm having a little trouble speaking right now, but I'm here."
    )
    return send_file(
        io.BytesIO(fallback),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name=filename,
    )
# ------------------------------------------------------
# Helper Function: Extract Explicit Name from User Text
# ------------------------------------------------------

# ------------------------------------------------------
# /greet
# ------------------------------------------------------

@aurora_bp.route("/greet", methods=["GET"])
def aurora_greet():

    ctx = get_time_context()
    tod = ctx["time_of_day"]

    # ---------------- MORNING ----------------
    if tod == "morning":
        text = (
            "Good morning.  I’m Aurora.  "
            "This is a space where you can talk things through…  "
            "or start your day gently with a calming video.  "
            "What feels like a good beginning today?"
        )

    # ---------------- AFTERNOON ----------------
    elif tod == "afternoon":
        text = (
            "Good afternoon.  I’m Aurora.  "
            "If your day feels busy, we can slow it down for a moment…  "
            "or you can explore something relaxing here.  "
            "What would help right now?"
        )

    # ---------------- EVENING ----------------
    elif tod == "evening":
        text = (
            "Good evening.  I’m Aurora.  "
            "This is a place to unwind…  "
            "to talk quietly about your day…  "
            "or simply let your mind settle with something calming.  "
            "How are you feeling tonight?"
        )

    # ---------------- NIGHT ----------------
    else:
        text = (
            "Hi.  I’m Aurora.  "
            "It’s okay to slow down here…  "
            "to speak softly about what’s on your mind…  "
            "or just rest with something peaceful.  "
            "I’m here with you."
        )

    return safe_tts(text, filename="aurora_greet.mp3")

# ------------------------------------------------------
# /intro
# ------------------------------------------------------

@aurora_bp.route("/intro", methods=["POST"])
def aurora_intro():
    

    data = request.get_json() or {}
    variation = data.get("variation", "neutral")

    intro_text = build_intro_text(variation)

    try:
        audio_bytes = text_to_speech(intro_text)
    except Exception as e:
        print("Intro TTS error:", e)
        audio_bytes = text_to_speech(
            "Hello. I’m Aurora. I’m here to introduce you to a new kind of emotional intelligence experience."
        )

    # We return JSON + base64 audio OR stream
    return send_file(
        io.BytesIO(audio_bytes),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name="aurora_intro.mp3",
    )


# ------------------------------------------------------
# /converse
# ------------------------------------------------------
@aurora_bp.route("/converse", methods=["POST"])
def aurora_converse():

    if "audio" not in request.files:
        return jsonify({"error": "audio file required"}), 400

    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()

    if not audio_bytes:
        return jsonify({"error": "empty audio"}), 400

    # -----------------------------------
    # 1️⃣ STT
    # -----------------------------------
    stt_start = time.time()

    try:
        user_text = speech_to_text(audio_bytes)
    except Exception as e:
        print("Whisper error:", e)
        user_text = None

    stt_time = round(time.time() - stt_start, 3)
    print(f"⏱ STT TIME: {stt_time}s")

    if not user_text:
        return safe_tts("Go ahead — I’m listening.", filename="aurora_retry.mp3")

    print("AURORA USER TEXT >>>", user_text)

    # -----------------------------------
    # 2️⃣ FAST-PATH NAME INTRO
    # -----------------------------------
    explicit_name = extract_explicit_name(user_text)

    if explicit_name:
        lock_name(explicit_name)

        # Instant reflexive intro response (no GPT call)
        return safe_tts(
            f"It’s nice to meet you, {explicit_name.capitalize()}.",
            filename="aurora_name_intro.mp3",
        )

    # -----------------------------------
    # Optional emotion context
    # -----------------------------------
    face_emotion = (request.form.get("face_emotion") or "").strip()

    def to_float(v, default=0.5):
        if v is None:
            return default
        try:
            return float(v)
        except (TypeError, ValueError):
            return default

    face_valence = to_float(request.form.get("valence"))
    face_arousal = to_float(request.form.get("arousal"))
    face_dominance = to_float(request.form.get("dominance"))

    # -----------------------------------
    # 3️⃣ GPT
    # -----------------------------------
    gpt_start = time.time()

    reply_text = aurora_whisper_reply(
        user_text=user_text,
        face_emotion=face_emotion,
        valence=face_valence,
        arousal=face_arousal,
        dominance=face_dominance,
    )

    gpt_time = round(time.time() - gpt_start, 3)
    print(f"⏱ GPT TIME: {gpt_time}s")

    if not reply_text:
        reply_text = "I’m here with you."

    # -----------------------------------
    # 4️⃣ TTS
    # -----------------------------------
    tts_start = time.time()

    try:
        audio_out = text_to_speech(reply_text)
    except Exception as e:
        print("TTS error:", e)
        audio_out = text_to_speech(
            "I'm having a small technical issue, but I'm still here with you."
        )

    tts_time = round(time.time() - tts_start, 3)
    print(f"⏱ TTS TIME: {tts_time}s")

    total_time = round(time.time() - stt_start, 3)
    print(f"⏱ TOTAL PIPELINE TIME: {total_time}s")

    return send_file(
        io.BytesIO(audio_out),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name="aurora_reply.mp3",
    )



"""""""""""""""
