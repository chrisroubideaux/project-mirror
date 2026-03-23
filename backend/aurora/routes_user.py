# backend/aurora/routes_user.py

from __future__ import annotations
import re
import uuid
from pathlib import Path
from flask import Blueprint, jsonify, request, send_file, current_app
from extensions import db, limiter
from utils.decorators import token_required

from aurora.speech_user import generate_and_store_user_speech
from aurora.models_messages import AuroraMessage
from aurora.relationship import update_on_message, get_or_create_relationship
from aurora.guardrails import check_guardrails
from aurora.brain_user import generate_reply
from services.datetime_context import get_time_context


from aurora.memory_store import (
    extract_memory_candidates,
    upsert_memory,
    decay_user_memory,
    prune_memory,
    fetch_user_memory,
)

from aurora.models_session_summary import AuroraSessionSummary
from aurora.summarizer import summarize_session

from aurora.personality import (
    update_personality_from_session,
    resolve_effective_personality,
    compute_session_trends,
)


aurora_user_bp = Blueprint(
    "aurora_user_bp",
    __name__,
    url_prefix="/api/user/aurora",
)

# -------------------------------------------------------
# HELPERS
# -------------------------------------------------------

def _first_name_from_user(current_user) -> str:
    candidates = [
        getattr(current_user, "first_name", None),
        getattr(current_user, "name", None),
        getattr(current_user, "full_name", None),
        getattr(current_user, "username", None),
    ]

    email = getattr(current_user, "email", None)

    for value in candidates:
        if value and str(value).strip():
            raw = str(value).strip()
            return raw.split()[0]

    if email and "@" in str(email):
        local = str(email).split("@")[0]
        cleaned = re.sub(r"[^a-zA-Z]", " ", local).strip()
        if cleaned:
            return cleaned.split()[0].capitalize()

    return "there"


def _build_greeting(name: str) -> str:
    ctx = get_time_context()
    tod = ctx.get("time_of_day", "night")

    if tod == "morning":
        return f"Good morning, {name}. How are you feeling this morning?"
    elif tod == "afternoon":
        return f"Good afternoon, {name}. How are you feeling this afternoon?"
    elif tod == "evening":
        return f"Good evening, {name}. How are you feeling this evening?"
    else:
        return f"Good night, {name}. How are you feeling tonight?"


def _safe_uuid(session_id: str | None) -> uuid.UUID | None:
    if not session_id:
        return None
    try:
        return uuid.UUID(session_id)
    except ValueError:
        return None


# -------------------------------------------------------
# GREETING
# -------------------------------------------------------

@aurora_user_bp.post("/greet")
@token_required
def greet(current_user):
    session_uuid = uuid.uuid4()
    name = _first_name_from_user(current_user)
    assistant_reply = _build_greeting(name)

    audio_url = generate_and_store_user_speech(
        text=assistant_reply,
        user_id=str(current_user.id),
        session_id=str(session_uuid),
    )

    try:
        greeting_msg = AuroraMessage(
            user_id=current_user.id,
            session_id=session_uuid,
            role="assistant",
            content=assistant_reply,
            meta_json={
                "type": "greeting",
                "audio_url": audio_url,
                "time_of_day": get_time_context().get("time_of_day"),
            },
        )
        db.session.add(greeting_msg)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("\n!!!! AURORA GREETING SAVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

    return jsonify({
        "session_id": str(session_uuid),
        "assistant_reply": assistant_reply,
        "audio_url": audio_url,
        "user_name": name,
    }), 200


# -------------------------------------------------------
# CONVERSE
# EMOTION ANALYTICS DISABLED FOR NOW
# -------------------------------------------------------
@aurora_user_bp.post("/converse")
@token_required
def converse(current_user):
    payload = request.get_json(force=True) or {}

    user_text = (payload.get("message") or "").strip()
    session_id = payload.get("session_id")

    if not user_text:
        return jsonify({"error": "message_required"}), 400

    session_uuid = _safe_uuid(session_id)
    if session_id and session_uuid is None:
        return jsonify({"error": "invalid_session_id"}), 400

    if session_uuid is None:
        session_uuid = uuid.uuid4()

    # --------------------------------------------------
    # 1) Guardrails
    # --------------------------------------------------
    guardrail_result = check_guardrails(user_text)

    # --------------------------------------------------
    # 2) Emotion analytics disabled for now
    # --------------------------------------------------
    emotion_data = {}

    # --------------------------------------------------
    # 3) Store User Message
    # --------------------------------------------------
    try:
        user_msg = AuroraMessage(
            user_id=current_user.id,
            session_id=session_uuid,
            role="user",
            content=user_text,
            meta_json={
                "guardrail": {
                    "triggered": guardrail_result.triggered,
                    "category": guardrail_result.category,
                    "severity": guardrail_result.severity,
                    "meta": guardrail_result.meta,
                },
                "emotion": emotion_data,
            },
        )
        db.session.add(user_msg)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("\n!!!! AURORA USER MESSAGE SAVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return jsonify({"error": "failed_to_store_user_message"}), 500

    # --------------------------------------------------
    # 4) Relationship Update
    # --------------------------------------------------
    try:
        rel = update_on_message(
            current_user.id,
            user_text=user_text,
            safety_flag=guardrail_result.triggered,
            sentiment_hint=None,
        )
    except Exception as e:
        print("\n!!!! AURORA RELATIONSHIP UPDATE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        rel = get_or_create_relationship(current_user.id)

    # --------------------------------------------------
    # 5) Assistant Response
    # --------------------------------------------------
    try:
        if guardrail_result.triggered:
            assistant_reply = guardrail_result.response_override
            usage = {}
        else:
            assistant_reply, usage = generate_reply(
                current_user.id,
                session_uuid,
                rel,
                guardrail_result,
                live_emotion=None,
            )
    except Exception as e:
        print("\n!!!! AURORA GENERATE REPLY ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return jsonify({"error": "failed_to_generate_reply"}), 500

    if not assistant_reply:
        assistant_reply = "I'm here with you."
        usage = usage if isinstance(usage, dict) else {}

    # --------------------------------------------------
    # 6) Voice Generation
    #    Keep isolated so TTS failure doesn't kill response
    # --------------------------------------------------
    voice_enabled = (getattr(rel, "ritual_preferences", {}) or {}).get("voice_enabled", True)

    audio_url = None
    if voice_enabled and assistant_reply:
        try:
            audio_url = generate_and_store_user_speech(
                text=assistant_reply,
                user_id=str(current_user.id),
                session_id=str(session_uuid),
            )
        except Exception as e:
            print("\n!!!! AURORA VOICE GENERATION ERROR !!!!")
            print(str(e))
            print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
            audio_url = None

    # --------------------------------------------------
    # 7) Store Assistant Message
    # --------------------------------------------------
    try:
        assistant_msg = AuroraMessage(
            user_id=current_user.id,
            session_id=session_uuid,
            role="assistant",
            content=assistant_reply,
            meta_json={
                "guardrail_response": guardrail_result.triggered,
                "usage": usage if isinstance(usage, dict) else {},
                "audio_url": audio_url,
                "emotion_context_used": None,
            },
        )
        db.session.add(assistant_msg)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("\n!!!! AURORA ASSISTANT MESSAGE SAVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return jsonify({"error": "failed_to_store_assistant_message"}), 500

    # --------------------------------------------------
    # 8) Memory Promotion Layer
    #    Best-effort only; never block response
    # --------------------------------------------------
    try:
        print("\n========== MEMORY DEBUG ==========")
        print("User text:", user_text)

        memory_candidates = extract_memory_candidates(user_text)
        print("Memory candidates detected:", memory_candidates)

        for item in memory_candidates:
            print("Upserting memory item:", item)

            upsert_memory(
                user_id=current_user.id,
                key=item.get("key"),
                value=item.get("value"),
                session_id=session_uuid,
                confidence=float(item.get("confidence", 0.6)),
            )

        print("Memory upsert completed.")
        print("==================================\n")

    except Exception as e:
        print("\n!!!! MEMORY ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!\n")

    # --------------------------------------------------
    # 9) Response
    # --------------------------------------------------
    return jsonify({
        "session_id": str(session_uuid),
        "relationship": {
            "familiarity_score": getattr(rel, "familiarity_score", 0),
            "trust_score": getattr(rel, "trust_score", 0),
            "interaction_count": getattr(rel, "interaction_count", 0),
        },
        "guardrail": {
            "triggered": guardrail_result.triggered,
            "category": guardrail_result.category,
            "severity": guardrail_result.severity,
        },
        "emotion": emotion_data,
        "assistant_reply": assistant_reply,
        "audio_url": audio_url,
        "usage": usage if isinstance(usage, dict) else {},
    }), 200


# -------------------------------------------------------
# END SESSION
# -------------------------------------------------------

@aurora_user_bp.post("/end-session")
@token_required
def end_session(current_user):
    payload = request.get_json(force=True) or {}
    session_id = payload.get("session_id")

    if not session_id:
        return jsonify({"error": "session_id_required"}), 400

    session_uuid = _safe_uuid(session_id)
    if session_uuid is None:
        return jsonify({"error": "invalid_session_id"}), 400

    messages = (
        AuroraMessage.query
        .filter_by(user_id=current_user.id, session_id=session_uuid)
        .order_by(AuroraMessage.created_at.asc())
        .all()
    )

    if not messages:
        return jsonify({"error": "no_messages_found"}), 404

    summary_dict = summarize_session(
        user_id=current_user.id,
        session_id=session_uuid,
        messages=messages,
    )

    try:
        summary = AuroraSessionSummary(
            user_id=current_user.id,
            session_id=session_uuid,
            dominant_emotion=(summary_dict.get("dominant_emotion") or "")[:100],
            engagement_score=summary_dict.get("engagement_score", 0.5),
            primary_themes=summary_dict.get("primary_themes", []),
            session_outcome=(summary_dict.get("session_outcome") or "")[:100],
            recommendation_tag=(summary_dict.get("recommendation_tag") or "")[:100],
            risk_flag=bool(summary_dict.get("risk_flag", False)),
            meta_json=summary_dict,
        )
        db.session.add(summary)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("\n!!!! SESSION SUMMARY SAVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return jsonify({"error": "failed_to_store_session_summary"}), 500

    try:
        rel = get_or_create_relationship(current_user.id)

        update_personality_from_session(
            current_user.id,
            relationship=rel,
            session_summary=summary_dict,
            emotion_hint={
                "dominant_emotion": summary_dict.get("dominant_emotion"),
                "engagement_score": summary_dict.get("engagement_score", 0.5),
            },
        )

        print("\n🧠 Personality updated from session.\n")

    except Exception as e:
        print("\n!!!! PERSONALITY UPDATE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

    try:
        decayed = decay_user_memory(current_user.id, half_life_days=45, floor=0.15)
        pruned = prune_memory(current_user.id, min_confidence=0.18)
        print(f"\n🧠 Memory decay updated {decayed} rows, pruned {pruned} rows.\n")
    except Exception as e:
        print("\n!!!! MEMORY DECAY ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

    return jsonify({
        "message": "session_summarized",
        "summary": summary.to_dict(),
    }), 200


# -------------------------------------------------------
# PERSONALITY DEBUG ENDPOINT
# -------------------------------------------------------

@aurora_user_bp.get("/personality-state")
@token_required
def personality_state(current_user):
    rel = get_or_create_relationship(current_user.id)

    p, effective = resolve_effective_personality(current_user.id)
    trends = compute_session_trends(current_user.id, window=5)

    mem = fetch_user_memory(current_user.id, limit=10)
    mem_payload = [
        {
            "key": m.key,
            "value": m.value,
            "confidence": float(m.confidence or 0.0),
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "updated_at": (
                m.updated_at.isoformat()
                if getattr(m, "updated_at", None)
                else None
            ),
        }
        for m in mem
    ]

    return jsonify({
        "relationship": rel.to_dict(),
        "personality_learned": {
            "tone": p.tone,
            "verbosity": p.verbosity,
            "pace": p.pace,
            "directness": p.directness,
            "probing_depth": p.probing_depth,
            "adaptive_score": float(p.adaptive_score or 0.0),
            "admin_notes": p.admin_notes or {},
        },
        "personality_effective": effective,
        "trends": trends,
        "memory_preview": mem_payload,
    }), 200


# -------------------------------------------------------
# AUDIO SERVE ROUTE
# -------------------------------------------------------

@aurora_user_bp.get("/audio/<user_id>/<filename>")
@limiter.exempt
@token_required
def serve_aurora_audio(current_user, user_id, filename):
    if str(current_user.id) != str(user_id):
        return jsonify({"error": "forbidden"}), 403

    try:
        static_root = Path(current_app.static_folder)
        filepath = static_root / "audio" / "aurora" / str(user_id) / filename

        if not filepath.exists() or not filepath.is_file():
            return jsonify({"error": "audio_not_found"}), 404

        return send_file(
            filepath,
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name=filename,
            conditional=False,
            max_age=0,
        )
    except Exception as e:
        print("\n!!!! AURORA AUDIO SERVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return jsonify({"error": "audio_serve_failed"}), 500
    
    
    
""""""""""""""""""""""""""""
# backend/aurora/routes_user.py
from __future__ import annotations
from pathlib import Path
from flask import send_file, current_app

import re
import uuid

from flask import Blueprint, jsonify, request


# from extensions import db
from extensions import db, limiter
from utils.decorators import token_required

from aurora.speech_user import generate_and_store_user_speech
from aurora.emotion_fusion import fuse_face_text
from aurora.models_messages import AuroraMessage
from aurora.models_emotion import AuroraEmotion
from aurora.relationship import update_on_message, get_or_create_relationship
from aurora.guardrails import check_guardrails
from aurora.brain_user import generate_reply
from aurora.emotion import analyze_text_emotion

from aurora.memory_store import (
    extract_memory_candidates,
    upsert_memory,
    decay_user_memory,
    prune_memory,
    fetch_user_memory,
)

from aurora.models_session_summary import AuroraSessionSummary
from aurora.summarizer import summarize_session

from aurora.personality import (
    update_personality_from_session,
    resolve_effective_personality,
    compute_session_trends,
)


aurora_user_bp = Blueprint(
    "aurora_user_bp",
    __name__,
    url_prefix="/api/user/aurora",
)


# -------------------------------------------------------
# HELPERS
# -------------------------------------------------------

def _first_name_from_user(current_user) -> str:
    candidates = [
        getattr(current_user, "first_name", None),
        getattr(current_user, "name", None),
        getattr(current_user, "full_name", None),
        getattr(current_user, "username", None),
    ]

    email = getattr(current_user, "email", None)

    for value in candidates:
        if value and str(value).strip():
            raw = str(value).strip()
            return raw.split()[0]

    if email and "@" in str(email):
        local = str(email).split("@")[0]
        cleaned = re.sub(r"[^a-zA-Z]", " ", local).strip()
        if cleaned:
            return cleaned.split()[0].capitalize()

    return "there"


def _build_greeting(name: str) -> str:
    return f"Hi {name}, I’m Aurora. I’m here with you. Take your time."


def _safe_uuid(session_id: str | None) -> uuid.UUID | None:
    if not session_id:
        return None
    try:
        return uuid.UUID(session_id)
    except ValueError:
        return None


def _clamp_pad(pad: dict | None) -> dict | None:
    if not isinstance(pad, dict):
        return None

    try:
        v = float(pad["valence"])
        a = float(pad["arousal"])
        d = float(pad["dominance"])
    except Exception:
        return None

    return {
        "valence": max(0.0, min(1.0, v)),
        "arousal": max(0.0, min(1.0, a)),
        "dominance": max(0.0, min(1.0, d)),
    }


# -------------------------------------------------------
# GREETING
# Trigger this when logged-in user opens Aurora tab
# -------------------------------------------------------

@aurora_user_bp.post("/greet")
@token_required
def greet(current_user):
    session_uuid = uuid.uuid4()
    name = _first_name_from_user(current_user)
    assistant_reply = _build_greeting(name)

    audio_url = generate_and_store_user_speech(
        text=assistant_reply,
        user_id=str(current_user.id),
        session_id=str(session_uuid),
    )

    try:
        greeting_msg = AuroraMessage(
            user_id=current_user.id,
            session_id=session_uuid,
            role="assistant",
            content=assistant_reply,
            meta_json={
                "type": "greeting",
                "audio_url": audio_url,
            },
        )
        db.session.add(greeting_msg)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("\n!!!! AURORA GREETING SAVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

    return jsonify({
        "session_id": str(session_uuid),
        "assistant_reply": assistant_reply,
        "audio_url": audio_url,
        "user_name": name,
    }), 200


# -------------------------------------------------------
# CONVERSE
# -------------------------------------------------------

@aurora_user_bp.post("/converse")
@token_required
def converse(current_user):
    payload = request.get_json(force=True) or {}

    user_text = (payload.get("message") or "").strip()
    session_id = payload.get("session_id")
    live_face_pad = payload.get("live_face_pad") or None

    if not user_text:
        return jsonify({"error": "message_required"}), 400

    session_uuid = _safe_uuid(session_id)
    if session_id and session_uuid is None:
        return jsonify({"error": "invalid_session_id"}), 400

    if session_uuid is None:
        session_uuid = uuid.uuid4()

    # --------------------------------------------------
    # 1) Guardrails
    # --------------------------------------------------

    guardrail_result = check_guardrails(user_text)

    # --------------------------------------------------
    # 2) Emotion Tagging + Live Fusion
    # --------------------------------------------------

    skip_emotion = (
        guardrail_result.triggered
        and guardrail_result.category in {
            "self_harm",
            "harm_others",
            "illegal",
            "sexual_minors",
        }
    )

    text_emotion = {} if skip_emotion else analyze_text_emotion(user_text)

    text_pad = None
    if isinstance(text_emotion, dict):
        text_pad = _clamp_pad({
            "valence": text_emotion.get("valence"),
            "arousal": text_emotion.get("arousal"),
            "dominance": text_emotion.get("dominance"),
        })

    safe_face_pad = _clamp_pad(live_face_pad)

    fused_live_pad = fuse_face_text(
        face_pad=safe_face_pad,
        text_pad=text_pad,
    )

    emotion_data = {
        **(text_emotion if isinstance(text_emotion, dict) else {}),
        "live_face_pad": safe_face_pad,
        "fused_live_pad": fused_live_pad,
    }

    # --------------------------------------------------
    # 3) Store User Message
    # --------------------------------------------------

    try:
        user_msg = AuroraMessage(
            user_id=current_user.id,
            session_id=session_uuid,
            role="user",
            content=user_text,
            meta_json={
                "guardrail": {
                    "triggered": guardrail_result.triggered,
                    "category": guardrail_result.category,
                    "severity": guardrail_result.severity,
                    "meta": guardrail_result.meta,
                },
                "emotion": emotion_data,
            },
        )
        db.session.add(user_msg)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("\n!!!! AURORA USER MESSAGE SAVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return jsonify({"error": "failed_to_store_user_message"}), 500

    # --------------------------------------------------
    # 4) Optional AuroraEmotion Snapshot
    # --------------------------------------------------

    try:
        emotion_row = AuroraEmotion(
            user_id=current_user.id,
            session_id=session_uuid,
            source="fused_live",
            valence=float(fused_live_pad["valence"]),
            arousal=float(fused_live_pad["arousal"]),
            dominance=float(fused_live_pad["dominance"]),
            meta_json={
                "text_emotion": text_emotion,
                "live_face_pad": safe_face_pad,
            },
        )
        db.session.add(emotion_row)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("\n!!!! AURORA EMOTION SAVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

    # --------------------------------------------------
    # 5) Relationship Update
    # --------------------------------------------------

    sentiment_hint = fused_live_pad.get("valence") if isinstance(fused_live_pad, dict) else None

    rel = update_on_message(
        current_user.id,
        user_text=user_text,
        safety_flag=guardrail_result.triggered,
        sentiment_hint=sentiment_hint,
    )

    # --------------------------------------------------
    # 6) Assistant Response
    # --------------------------------------------------

    if guardrail_result.triggered:
        assistant_reply = guardrail_result.response_override
        usage = {}
    else:
        assistant_reply, usage = generate_reply(
            current_user.id,
            session_uuid,
            user_text,
            rel,
            guardrail_result,
            live_emotion=fused_live_pad,
        )

    # --------------------------------------------------
    # 7) Voice Generation
    # --------------------------------------------------

    voice_enabled = (rel.ritual_preferences or {}).get("voice_enabled", True)

    audio_url = None
    if voice_enabled and assistant_reply:
        audio_url = generate_and_store_user_speech(
            text=assistant_reply,
            user_id=str(current_user.id),
            session_id=str(session_uuid),
        )

    # --------------------------------------------------
    # 8) Store Assistant Message
    # --------------------------------------------------

    try:
        assistant_msg = AuroraMessage(
            user_id=current_user.id,
            session_id=session_uuid,
            role="assistant",
            content=assistant_reply,
            meta_json={
                "guardrail_response": guardrail_result.triggered,
                "usage": usage,
                "audio_url": audio_url,
                "emotion_context_used": fused_live_pad,
            },
        )
        db.session.add(assistant_msg)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("\n!!!! AURORA ASSISTANT MESSAGE SAVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return jsonify({"error": "failed_to_store_assistant_message"}), 500

    # --------------------------------------------------
    # 9) Memory Promotion Layer
    # --------------------------------------------------

    try:
        print("\n========== MEMORY DEBUG ==========")
        print("User text:", user_text)

        memory_candidates = extract_memory_candidates(user_text)
        print("Memory candidates detected:", memory_candidates)

        for item in memory_candidates:
            print("Upserting memory item:", item)

            upsert_memory(
                user_id=current_user.id,
                key=item.get("key"),
                value=item.get("value"),
                session_id=session_uuid,
                confidence=float(item.get("confidence", 0.6)),
            )

        print("Memory upsert completed.")
        print("==================================\n")

    except Exception as e:
        print("\n!!!! MEMORY ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!\n")

    # --------------------------------------------------
    # RESPONSE
    # --------------------------------------------------

    return jsonify({
        "session_id": str(session_uuid),
        "relationship": {
            "familiarity_score": rel.familiarity_score,
            "trust_score": rel.trust_score,
            "interaction_count": rel.interaction_count,
        },
        "guardrail": {
            "triggered": guardrail_result.triggered,
            "category": guardrail_result.category,
            "severity": guardrail_result.severity,
        },
        "emotion": emotion_data,
        "assistant_reply": assistant_reply,
        "audio_url": audio_url,
        "usage": usage,
    }), 200


# -------------------------------------------------------
# END SESSION
# Summarization + personality evolution + memory decay
# -------------------------------------------------------

@aurora_user_bp.post("/end-session")
@token_required
def end_session(current_user):
    payload = request.get_json(force=True) or {}
    session_id = payload.get("session_id")

    if not session_id:
        return jsonify({"error": "session_id_required"}), 400

    session_uuid = _safe_uuid(session_id)
    if session_uuid is None:
        return jsonify({"error": "invalid_session_id"}), 400

    # --------------------------------------------------
    # 1) Fetch Session Messages
    # --------------------------------------------------

    messages = (
        AuroraMessage.query
        .filter_by(user_id=current_user.id, session_id=session_uuid)
        .order_by(AuroraMessage.created_at.asc())
        .all()
    )

    if not messages:
        return jsonify({"error": "no_messages_found"}), 404

    # --------------------------------------------------
    # 2) Generate Session Summary
    # --------------------------------------------------

    summary_dict = summarize_session(
        user_id=current_user.id,
        session_id=session_uuid,
        messages=messages,
    )

    # --------------------------------------------------
    # 3) Store Summary
    # --------------------------------------------------

    try:
        summary = AuroraSessionSummary(
            user_id=current_user.id,
            session_id=session_uuid,
            dominant_emotion=summary_dict.get("dominant_emotion"),
            engagement_score=summary_dict.get("engagement_score", 0.5),
            primary_themes=summary_dict.get("primary_themes", []),
            session_outcome=summary_dict.get("session_outcome"),
            recommendation_tag=summary_dict.get("recommendation_tag"),
            risk_flag=bool(summary_dict.get("risk_flag", False)),
            meta_json=summary_dict,
        )
        db.session.add(summary)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("\n!!!! SESSION SUMMARY SAVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return jsonify({"error": "failed_to_store_session_summary"}), 500

    # --------------------------------------------------
    # 4) Personality Evolution Hook
    # --------------------------------------------------

    try:
        rel = get_or_create_relationship(current_user.id)

        update_personality_from_session(
            current_user.id,
            relationship=rel,
            session_summary=summary_dict,
            emotion_hint={
                "dominant_emotion": summary_dict.get("dominant_emotion"),
                "engagement_score": summary_dict.get("engagement_score", 0.5),
            },
        )

        print("\n🧠 Personality updated from session.\n")

    except Exception as e:
        print("\n!!!! PERSONALITY UPDATE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

    # --------------------------------------------------
    # 5) Memory Decay / Prune Hook
    # --------------------------------------------------

    try:
        decayed = decay_user_memory(current_user.id, half_life_days=45, floor=0.15)
        pruned = prune_memory(current_user.id, min_confidence=0.18)
        print(f"\n🧠 Memory decay updated {decayed} rows, pruned {pruned} rows.\n")
    except Exception as e:
        print("\n!!!! MEMORY DECAY ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

    # --------------------------------------------------
    # RESPONSE
    # --------------------------------------------------

    return jsonify({
        "message": "session_summarized",
        "summary": summary.to_dict(),
    }), 200


# -------------------------------------------------------
# PERSONALITY DEBUG ENDPOINT
# -------------------------------------------------------

@aurora_user_bp.get("/personality-state")
@token_required
def personality_state(current_user):
    rel = get_or_create_relationship(current_user.id)

    p, effective = resolve_effective_personality(current_user.id)
    trends = compute_session_trends(current_user.id, window=5)

    mem = fetch_user_memory(current_user.id, limit=10)
    mem_payload = [
        {
            "key": m.key,
            "value": m.value,
            "confidence": float(m.confidence or 0.0),
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "updated_at": (
                m.updated_at.isoformat()
                if getattr(m, "updated_at", None)
                else None
            ),
        }
        for m in mem
    ]

    return jsonify({
        "relationship": rel.to_dict(),
        "personality_learned": {
            "tone": p.tone,
            "verbosity": p.verbosity,
            "pace": p.pace,
            "directness": p.directness,
            "probing_depth": p.probing_depth,
            "adaptive_score": float(p.adaptive_score or 0.0),
            "admin_notes": p.admin_notes or {},
        },
        "personality_effective": effective,
        "trends": trends,
        "memory_preview": mem_payload,
    }), 200

# ===========================================
# GET
# ===========================================

@aurora_user_bp.get("/audio/<user_id>/<filename>")
@limiter.exempt
@token_required
def serve_aurora_audio(current_user, user_id, filename):
    if str(current_user.id) != str(user_id):
        return jsonify({"error": "forbidden"}), 403

    try:
        static_root = Path(current_app.static_folder)
        filepath = static_root / "audio" / "aurora" / str(user_id) / filename

        if not filepath.exists() or not filepath.is_file():
            return jsonify({"error": "audio_not_found"}), 404

        return send_file(
            filepath,
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name=filename,
            conditional=False,
            max_age=0,
        )
    except Exception as e:
        print("\n!!!! AURORA AUDIO SERVE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return jsonify({"error": "audio_serve_failed"}), 500




"""""""""""""""""""""""""""""""""""""""