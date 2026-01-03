# backend/routes/aurora_routes.py

import io
import random
import time
from flask import Blueprint, request, send_file, jsonify

from services.aurora_whisper import speech_to_text, aurora_whisper_reply
from services.aurora_speech import text_to_speech
from services.datetime_context import get_time_context

aurora_bp = Blueprint("aurora", __name__, url_prefix="/api/aurora")


# ------------------------------------------------------
# Helper: Retry Wrapper
# ------------------------------------------------------
def safe_tts(text: str, filename: str = "aurora.mp3"):
    """TTS wrapper with retry + fallback."""
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

    # fallback TTS
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
# /greet  (single, time-aware line)
# ------------------------------------------------------
@aurora_bp.route("/greet", methods=["GET"])
def aurora_greet():
    """
    Time-of-day aware greeting:

    "Good <time>. My name is Aurora. Who do I have the pleasure of speaking with?"
    """
    ctx = get_time_context()
    tod = ctx["time_of_day"]  # "morning", "afternoon", "evening", "night"

    if tod == "morning":
        prefix = "Good morning"
    elif tod == "afternoon":
        prefix = "Good afternoon"
    elif tod == "evening":
        prefix = "Good evening"
    else:
        prefix = "Hello"

    text = (
        f"{prefix}. My name is Aurora. "
        "Who do I have the pleasure of speaking with?"
    )

    return safe_tts(text, filename="aurora_greet.mp3")

# ------------------------------------------------------
# /converse (main voice loop)
# ------------------------------------------------------

@aurora_bp.route("/converse", methods=["POST"])
def aurora_converse():
    """
    Expects multipart/form-data:
      - audio: audio/webm
      - user_name (optional)
      - face_emotion (optional)
      - valence / arousal / dominance (optional floats as strings)
    """
    if "audio" not in request.files:
        return jsonify({"error": "audio file required"}), 400

    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()
    if not audio_bytes:
        return jsonify({"error": "empty audio"}), 400

    user_name = (request.form.get("user_name") or "").strip()
    first_name = user_name.split(" ")[0] if user_name else ""

    # Optional emotion context from the camera (front-end vision)
    face_emotion = (request.form.get("face_emotion") or "").strip()
    valence_raw = request.form.get("valence")
    arousal_raw = request.form.get("arousal")
    dominance_raw = request.form.get("dominance")

    def to_float(v, default=0.5):
        if v is None:
            return default
        try:
            return float(v)
        except (TypeError, ValueError):
            return default

    face_valence = to_float(valence_raw, default=0.5)
    face_arousal = to_float(arousal_raw, default=0.5)
    face_dominance = to_float(dominance_raw, default=0.5)

    # -------------------------
    # Speech → text
    # -------------------------
    try:
        user_text = speech_to_text(audio_bytes)
    except Exception as e:
        print("Whisper error:", e)
        user_text = None

    # ✅ FIX: Do NOT spam long retry message
    if not user_text:
        return safe_tts("Go ahead — I’m listening.", filename="aurora_retry.mp3")

    print("AURORA USER TEXT >>>", user_text)

    if face_emotion:
        print(
            "AURORA FACE CONTEXT >>>",
            {
                "name": first_name,
                "face_emotion": face_emotion,
                "valence": face_valence,
                "arousal": face_arousal,
                "dominance": face_dominance,
            },
        )

    # -------------------------
    # GPT reply + retry protection
    # -------------------------
    reply_text = None
    MAX_RETRIES = 3

    for attempt in range(MAX_RETRIES):
        try:
            # ✅ UPDATED to match the new aurora_whisper_reply signature
            reply_text = aurora_whisper_reply(
                user_text=user_text,
                user_name=first_name,
                face_emotion=face_emotion,
                valence=face_valence,
                arousal=face_arousal,
                dominance=face_dominance,
            )
            break
        except Exception as e:
            err = str(e).lower()
            print("Aurora brain error:", repr(e))

            if "429" in err or "rate" in err or "limit" in err:
                time.sleep(0.4 * (attempt + 1))
                continue
            break

    if not reply_text:
        reply_text = (
            "I’m here with you. We can try that again whenever you’re ready."
        )

    # -------------------------
    # TTS out
    # -------------------------
    try:
        audio_out = text_to_speech(reply_text)
    except Exception as e:
        print("TTS error:", e)
        audio_out = text_to_speech(
            "I'm having a small technical issue, but I'm still here with you."
        )

    return send_file(
        io.BytesIO(audio_out),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name="aurora_reply.mp3",
    )


# ------------------------------------------------------
# /emotion-react (optional one-off reactions)
# (kept for later if you want quick ping based on emotion only)
# ------------------------------------------------------
@aurora_bp.route("/emotion-react", methods=["POST"])
def aurora_emotion_react():
    data = request.get_json(silent=True) or {}
    raw_emotion = (data.get("emotion") or "").lower().strip()
    user_name = (data.get("user_name") or "").strip()
    first_name = user_name.split(" ")[0] if user_name else ""

    if not raw_emotion:
        return jsonify({"error": "emotion required"}), 400

    # normalize
    emo = raw_emotion
    if emo in ["sadness"]:
        emo = "sad"
    if emo in ["anger", "angry"]:
        emo = "anger"
    if emo in ["joy", "happy"]:
        emo = "joy"
    if emo in ["surprised", "surprise"]:
        emo = "surprised"
    if emo in ["tired", "stressed", "stress"]:
        emo = "tired"

    category = None
    if emo in ["sad"]:
        category = "sad"
    elif emo in ["anger", "frustration", "frustrated"]:
        category = "anger"
    elif emo == "joy":
        category = "joy"
    elif emo == "surprised":
        category = "surprised"
    elif emo == "tired":
        category = "tired"

    if category is None:
        return jsonify({"ignored": True}), 200

    # 50/50 chance to use name when available
    use_name = bool(first_name) and (random.random() < 0.5)

    # reactions
    lines_with_name = {
        "sad": [
            "Your expression shifted, {name}. Are you okay?",
            "I see something heavy in your face, {name}. What’s happening inside?",
            "{name}, I’m picking up some sadness. Do you want to talk about it?",
        ],
        "anger": [
            "I’m noticing some frustration in your expression, {name}. Want to talk it out?",
            "You look stirred up, {name}. What’s pushing on you right now?",
            "{name}, I can see this is hitting a nerve. Do you want to say more?",
        ],
        "joy": [
            "You look lighter there, {name}. What’s brightening your mood?",
            "Something softened in your expression, {name}. What changed?",
            "{name}, your face just relaxed a bit. What's feeling a little better?",
        ],
        "surprised": [
            "That looked like surprise, {name}. Did something catch your eye?",
            "You seemed taken off guard for a moment, {name}. What happened?",
        ],
        "tired": [
            "You look a bit worn out, {name}. Do you need a breath with me?",
            "There’s some tiredness in your eyes, {name}. How is your energy?",
            "{name}, you seem a little drained. What would help, even a tiny bit?",
        ],
    }

    lines_without_name = {
        "sad": [
            "Your expression shifted. Are you okay?",
            "I’m seeing something heavy in your face. What’s going on inside?",
            "I’m picking up some sadness. Do you want to talk about it?",
        ],
        "anger": [
            "I’m noticing some frustration. Want to talk it out?",
            "You look stirred up. What’s pushing on you right now?",
            "This seems to really matter to you. Do you want to say more?",
        ],
        "joy": [
            "Your mood seems a little brighter. What’s lighting you up?",
            "Your face just softened a bit. What changed?",
            "You look a touch lighter. What's feeling a little better?",
        ],
        "surprised": [
            "That looked like surprise. Did something catch your eye?",
            "You seemed taken off guard for a second. What happened?",
        ],
        "tired": [
            "You look a bit tired. Maybe we slow down together for a moment?",
            "There’s some tiredness in your eyes. How is your energy?",
            "You seem a little drained. What would help, even a tiny bit?",
        ],
    }

    if use_name:
        candidates = lines_with_name[category]
        text = random.choice(candidates).format(name=first_name)
    else:
        candidates = lines_without_name[category]
        text = random.choice(candidates)

    return safe_tts(text, filename="aurora_emotion_react.mp3")

# ------------------------------------------------------
# /goodbye
# ------------------------------------------------------
@aurora_bp.route("/goodbye", methods=["POST"])
def aurora_goodbye():
    farewell_lines = [
        "I’ll be right here whenever you come back.",
        "Take care of yourself out there.",
        "Until next time.",
        "I’m glad we talked.",
        "Be gentle with yourself.",
    ]

    text = random.choice(farewell_lines)
    return safe_tts(text, filename="aurora_goodbye.mp3")


""""""""""
# backend/routes/aurora_routes.py

import io
import random
import time
from flask import Blueprint, request, send_file, jsonify

from services.aurora_whisper import speech_to_text, aurora_whisper_reply
from services.aurora_speech import text_to_speech
from services.datetime_context import get_time_context
from backend.services.heygen_video import create_liveavatar_session, close_liveavatar_session


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

    # fallback TTS
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
# /greet  (single, time-aware line)
# ------------------------------------------------------
@aurora_bp.route("/greet", methods=["GET"])
def aurora_greet():
    
    ctx = get_time_context()
    tod = ctx["time_of_day"]  # "morning", "afternoon", "evening", "night"

    if tod == "morning":
        prefix = "Good morning"
    elif tod == "afternoon":
        prefix = "Good afternoon"
    elif tod == "evening":
        prefix = "Good evening"
    else:
        prefix = "Hello"

    text = (
        f"{prefix}. My name is Aurora. "
        "Who do I have the pleasure of speaking with?"
    )

    return safe_tts(text, filename="aurora_greet.mp3")

# ------------------------------------------------------
# /converse (main voice loop)
# ------------------------------------------------------
@aurora_bp.route("/converse", methods=["POST"])
def aurora_converse():
   
    if "audio" not in request.files:
        return jsonify({"error": "audio file required"}), 400

    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()
    if not audio_bytes:
        return jsonify({"error": "empty audio"}), 400

    user_name = (request.form.get("user_name") or "").strip()
    first_name = user_name.split(" ")[0] if user_name else ""

    # Optional emotion context from the camera (front-end vision)
    face_emotion = (request.form.get("face_emotion") or "").strip()
    valence_raw = request.form.get("valence")
    arousal_raw = request.form.get("arousal")
    dominance_raw = request.form.get("dominance")

    def to_float(v, default=0.5):
        if v is None:
            return default
        try:
            return float(v)
        except (TypeError, ValueError):
            return default

    face_valence = to_float(valence_raw, default=0.5)
    face_arousal = to_float(arousal_raw, default=0.5)
    face_dominance = to_float(dominance_raw, default=0.5)

    # -------------------------
    # Speech → text
    # -------------------------
    try:
        user_text = speech_to_text(audio_bytes)
    except Exception as e:
        print("Whisper error:", e)
        user_text = None

    # ✅ FIX: Do NOT spam long retry message
    if not user_text:
        return safe_tts("Go ahead — I’m listening.", filename="aurora_retry.mp3")

    print("AURORA USER TEXT >>>", user_text)

    if face_emotion:
        print(
            "AURORA FACE CONTEXT >>>",
            {
                "name": first_name,
                "face_emotion": face_emotion,
                "valence": face_valence,
                "arousal": face_arousal,
                "dominance": face_dominance,
            },
        )

    # -------------------------
    # GPT reply + retry protection
    # -------------------------
    reply_text = None
    MAX_RETRIES = 3

    for attempt in range(MAX_RETRIES):
        try:
            # ✅ UPDATED to match the new aurora_whisper_reply signature
            reply_text = aurora_whisper_reply(
                user_text=user_text,
                user_name=first_name,
                face_emotion=face_emotion,
                valence=face_valence,
                arousal=face_arousal,
                dominance=face_dominance,
            )
            break
        except Exception as e:
            err = str(e).lower()
            print("Aurora brain error:", repr(e))

            if "429" in err or "rate" in err or "limit" in err:
                time.sleep(0.4 * (attempt + 1))
                continue
            break

    if not reply_text:
        reply_text = (
            "I’m here with you. We can try that again whenever you’re ready."
        )

    # -------------------------
    # TTS out
    # -------------------------
    try:
        audio_out = text_to_speech(reply_text)
    except Exception as e:
        print("TTS error:", e)
        audio_out = text_to_speech(
            "I'm having a small technical issue, but I'm still here with you."
        )

    return send_file(
        io.BytesIO(audio_out),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name="aurora_reply.mp3",
    )


# ------------------------------------------------------
# /emotion-react (optional one-off reactions)
# (kept for later if you want quick ping based on emotion only)
# ------------------------------------------------------
@aurora_bp.route("/emotion-react", methods=["POST"])
def aurora_emotion_react():
    data = request.get_json(silent=True) or {}
    raw_emotion = (data.get("emotion") or "").lower().strip()
    user_name = (data.get("user_name") or "").strip()
    first_name = user_name.split(" ")[0] if user_name else ""

    if not raw_emotion:
        return jsonify({"error": "emotion required"}), 400

    # normalize
    emo = raw_emotion
    if emo in ["sadness"]:
        emo = "sad"
    if emo in ["anger", "angry"]:
        emo = "anger"
    if emo in ["joy", "happy"]:
        emo = "joy"
    if emo in ["surprised", "surprise"]:
        emo = "surprised"
    if emo in ["tired", "stressed", "stress"]:
        emo = "tired"

    category = None
    if emo in ["sad"]:
        category = "sad"
    elif emo in ["anger", "frustration", "frustrated"]:
        category = "anger"
    elif emo == "joy":
        category = "joy"
    elif emo == "surprised":
        category = "surprised"
    elif emo == "tired":
        category = "tired"

    if category is None:
        return jsonify({"ignored": True}), 200

    # 50/50 chance to use name when available
    use_name = bool(first_name) and (random.random() < 0.5)

    # reactions
    lines_with_name = {
        "sad": [
            "Your expression shifted, {name}. Are you okay?",
            "I see something heavy in your face, {name}. What’s happening inside?",
            "{name}, I’m picking up some sadness. Do you want to talk about it?",
        ],
        "anger": [
            "I’m noticing some frustration in your expression, {name}. Want to talk it out?",
            "You look stirred up, {name}. What’s pushing on you right now?",
            "{name}, I can see this is hitting a nerve. Do you want to say more?",
        ],
        "joy": [
            "You look lighter there, {name}. What’s brightening your mood?",
            "Something softened in your expression, {name}. What changed?",
            "{name}, your face just relaxed a bit. What's feeling a little better?",
        ],
        "surprised": [
            "That looked like surprise, {name}. Did something catch your eye?",
            "You seemed taken off guard for a moment, {name}. What happened?",
        ],
        "tired": [
            "You look a bit worn out, {name}. Do you need a breath with me?",
            "There’s some tiredness in your eyes, {name}. How is your energy?",
            "{name}, you seem a little drained. What would help, even a tiny bit?",
        ],
    }

    lines_without_name = {
        "sad": [
            "Your expression shifted. Are you okay?",
            "I’m seeing something heavy in your face. What’s going on inside?",
            "I’m picking up some sadness. Do you want to talk about it?",
        ],
        "anger": [
            "I’m noticing some frustration. Want to talk it out?",
            "You look stirred up. What’s pushing on you right now?",
            "This seems to really matter to you. Do you want to say more?",
        ],
        "joy": [
            "Your mood seems a little brighter. What’s lighting you up?",
            "Your face just softened a bit. What changed?",
            "You look a touch lighter. What's feeling a little better?",
        ],
        "surprised": [
            "That looked like surprise. Did something catch your eye?",
            "You seemed taken off guard for a second. What happened?",
        ],
        "tired": [
            "You look a bit tired. Maybe we slow down together for a moment?",
            "There’s some tiredness in your eyes. How is your energy?",
            "You seem a little drained. What would help, even a tiny bit?",
        ],
    }

    if use_name:
        candidates = lines_with_name[category]
        text = random.choice(candidates).format(name=first_name)
    else:
        candidates = lines_without_name[category]
        text = random.choice(candidates)

    return safe_tts(text, filename="aurora_emotion_react.mp3")

# ------------------------------------------------------
# /goodbye (single, comforting line)
# ------------------------------------------------------

@aurora_bp.route("/goodbye", methods=["POST"])
def aurora_goodbye():
    session_id = request.json.get("session_id") if request.is_json else None

    if session_id:
        try:
            close_liveavatar_session(session_id)
        except Exception:
            pass

    farewell_lines = [
        "I’ll be right here whenever you come back.",
        "Take care of yourself out there.",
        "Until next time.",
        "I’m glad we talked.",
        "Be gentle with yourself.",
    ]

    text = random.choice(farewell_lines)
    return safe_tts(text, filename="aurora_goodbye.mp3")


# ------------------------------------------------------
# ✅ /heygen-session  (LiveAvatar WebRTC Broker)
# ------------------------------------------------------
@aurora_bp.route("/heygen-session", methods=["POST"])
def create_heygen_session():
   
    try:
        session = create_liveavatar_session()
        return jsonify(session)
    except Exception as e:
        print("HeyGen session error:", e)
        return jsonify({"error": str(e)}), 500





"""""""""""""""
