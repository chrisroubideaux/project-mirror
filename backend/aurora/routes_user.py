# backend/aurora/routes_user.py

import uuid
from flask import Blueprint, request, jsonify
from extensions import db

from aurora.models_messages import AuroraMessage
from aurora.models_emotion import AuroraEmotion
from aurora.relationship import update_on_message
from aurora.guardrails import check_guardrails
from aurora.brain_user import generate_reply
from aurora.emotion import analyze_text_emotion

from services.voice_service import generate_voice_and_store
from utils.decorators import token_required


aurora_user_bp = Blueprint(
    "aurora_user_bp",
    __name__,
    url_prefix="/api/user/aurora"
)


@aurora_user_bp.post("/converse")
@token_required
def converse(current_user):
    payload = request.get_json(force=True) or {}

    user_text = payload.get("message")
    session_id = payload.get("session_id")

    if not user_text:
        return jsonify({"error": "message_required"}), 400

    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "invalid_session_id"}), 400

    # 1️⃣ Guardrails
    guardrail_result = check_guardrails(user_text)

    # 2️⃣ Emotion tagging
    skip_emotion = (
        guardrail_result.triggered and
        guardrail_result.category in {
            "self_harm",
            "harm_others",
            "illegal",
            "sexual_minors"
        }
    )

    emotion_data = {} if skip_emotion else analyze_text_emotion(user_text)

    # 3️⃣ Store user message
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
            "emotion": emotion_data
        }
    )
    db.session.add(user_msg)
    db.session.commit()

    # 4️⃣ Relationship update
    sentiment_hint = emotion_data.get("valence") if emotion_data else None

    rel = update_on_message(
        current_user.id,
        user_text=user_text,
        safety_flag=guardrail_result.triggered,
        sentiment_hint=sentiment_hint
    )

    # 5️⃣ Assistant response
    if guardrail_result.triggered:
        assistant_reply = guardrail_result.response_override
        usage = {}
    else:
        assistant_reply, usage = generate_reply(
            current_user.id,
            session_uuid,
            user_text,
            rel,
            guardrail_result
        )

    # 6️⃣ Voice generation (if enabled)
    voice_enabled = (
        rel.ritual_preferences or {}
    ).get("voice_enabled", True)

    audio_url = None

    if voice_enabled and assistant_reply:
        audio_url = generate_voice_and_store(
            assistant_reply,
            str(current_user.id),
            str(session_uuid)
        )

    # 7️⃣ Store assistant message
    assistant_msg = AuroraMessage(
        user_id=current_user.id,
        session_id=session_uuid,
        role="assistant",
        content=assistant_reply,
        meta_json={
            "guardrail_response": guardrail_result.triggered,
            "usage": usage,
            "audio_url": audio_url
        }
    )
    db.session.add(assistant_msg)
    db.session.commit()

    return jsonify({
        "session_id": str(session_uuid),
        "relationship": {
            "familiarity_score": rel.familiarity_score,
            "trust_score": rel.trust_score,
            "interaction_count": rel.interaction_count
        },
        "guardrail": {
            "triggered": guardrail_result.triggered,
            "category": guardrail_result.category,
            "severity": guardrail_result.severity
        },
        "emotion": emotion_data,
        "assistant_reply": assistant_reply,
        "audio_url": audio_url,
        "usage": usage
    }), 200


""""""""""""""""""""""""""""
# backend/aurora/routes_user.py

import uuid
from flask import Blueprint, request, jsonify
from extensions import db

from aurora.models_messages import AuroraMessage
from aurora.models_emotion import AuroraEmotion
from aurora.relationship import update_on_message
from aurora.summarizer import generate_session_summary
from aurora.models_session_summary import AuroraSessionSummary
from aurora.guardrails import check_guardrails
from aurora.brain_user import generate_reply
from aurora.emotion import analyze_text_emotion
from utils.decorators import token_required
import json

aurora_user_bp = Blueprint(
    "aurora_user_bp",
    __name__,
    url_prefix="/api/user/aurora"
)

# ===============================
# AURORA CONVERSATION ROUTE
# ===============================

@aurora_user_bp.post("/converse")
@token_required
def converse(current_user):
    payload = request.get_json(force=True) or {}

    user_text = payload.get("message")
    session_id = payload.get("session_id")

    if not user_text:
        return jsonify({"error": "message_required"}), 400

    # Generate session if not provided
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "invalid_session_id"}), 400

    # -------------------------------------------------
    # 1️⃣ Run guardrails FIRST
    # -------------------------------------------------
    guardrail_result = check_guardrails(user_text)

    # -------------------------------------------------
    # 2️⃣ Emotion tagging (skip for severe hard stops)
    # -------------------------------------------------
    skip_emotion = (
        guardrail_result.triggered and
        guardrail_result.category in {
            "self_harm",
            "harm_others",
            "illegal",
            "sexual_minors"
        }
    )

    emotion_data = {} if skip_emotion else analyze_text_emotion(user_text)

    # -------------------------------------------------
    # 3️⃣ Store user message (with guardrail + emotion)
    # -------------------------------------------------
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
            "emotion": emotion_data
        }
    )
    db.session.add(user_msg)
    db.session.commit()

    # -------------------------------------------------
    # 4️⃣ Persist structured emotion record
    # -------------------------------------------------
    if emotion_data:
        emotion_record = AuroraEmotion(
            user_id=current_user.id,
            message_id=user_msg.id,
            session_id=session_uuid,
            sentiment_label=emotion_data.get("sentiment_label"),
            sentiment_score=emotion_data.get("sentiment_score"),
            emotion_label=emotion_data.get("emotion_label"),
            emotion_score=emotion_data.get("emotion_score"),
            valence=emotion_data.get("valence"),
            arousal=emotion_data.get("arousal"),
            dominance=emotion_data.get("dominance"),
        )
        db.session.add(emotion_record)
        db.session.commit()

    # -------------------------------------------------
    # 5️⃣ Update relationship (with sentiment hint)
    # -------------------------------------------------
    sentiment_hint = None
    if emotion_data and emotion_data.get("raw"):
        sentiment_hint = emotion_data["raw"].get("sentiment_valence")

    rel = update_on_message(
        current_user.id,
        user_text=user_text,
        safety_flag=guardrail_result.triggered,
        sentiment_hint=sentiment_hint
    )

    # -------------------------------------------------
    # 6️⃣ Generate assistant response
    # -------------------------------------------------
    if guardrail_result.triggered:
        assistant_reply = guardrail_result.response_override
        usage = {}
    else:
        assistant_reply, usage = generate_reply(
            current_user.id,
            session_uuid,
            user_text,
            rel,
            guardrail_result
        )

    # -------------------------------------------------
    # 7️⃣ Store assistant message
    # -------------------------------------------------
    assistant_msg = AuroraMessage(
        user_id=current_user.id,
        session_id=session_uuid,
        role="assistant",
        content=assistant_reply,
        meta_json={
            "guardrail_response": guardrail_result.triggered,
            "usage": usage
        }
    )
    db.session.add(assistant_msg)
    db.session.commit()

    # -------------------------------------------------
    # 8️⃣ Return response payload
    # -------------------------------------------------
    return jsonify({
        "session_id": str(session_uuid),
        "relationship": {
            "familiarity_score": rel.familiarity_score,
            "trust_score": rel.trust_score,
            "interaction_count": rel.interaction_count
        },
        "guardrail": {
            "triggered": guardrail_result.triggered,
            "category": guardrail_result.category,
            "severity": guardrail_result.severity
        },
        "emotion": {
            "sentiment": emotion_data.get("sentiment_label"),
            "emotion": emotion_data.get("emotion_label"),
            "valence": emotion_data.get("valence"),
            "arousal": emotion_data.get("arousal"),
            "dominance": emotion_data.get("dominance"),
        } if emotion_data else {},
        "assistant_reply": assistant_reply,
        "usage": usage
    }), 200


# ===============================
# AURORA END SESSION ROUTE 
# ===============================

@aurora_user_bp.post("/end-session")
@token_required
def end_session(current_user):
    payload = request.get_json(force=True) or {}
    session_id = payload.get("session_id")

    if not session_id:
        return jsonify({"error": "session_id_required"}), 400

    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "invalid_session_id"}), 400

    summary_raw = generate_session_summary(current_user.id, session_uuid)

    if not summary_raw:
        return jsonify({"error": "no_messages_found"}), 400

    try:
        parsed = json.loads(summary_raw)
    except Exception:
        return jsonify({"error": "summary_parse_failed", "raw": summary_raw}), 500

    summary = AuroraSessionSummary(
        user_id=current_user.id,
        session_id=session_uuid,
        primary_themes=parsed.get("primary_themes"),
        dominant_emotion=parsed.get("dominant_emotion"),
        session_outcome=parsed.get("session_outcome"),
        engagement_score=parsed.get("engagement_score"),
        risk_flag=parsed.get("risk_flag", False),
        recommendation_tag=parsed.get("recommendation_tag"),
    )

    db.session.add(summary)
    db.session.commit()

    return jsonify({
        "message": "session_summarized",
        "summary": summary.to_dict()
    }), 200





"""""""""""""""""""""""""""""""""""""""