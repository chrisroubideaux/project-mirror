# backend/aurora/routes_user.py

import uuid
from flask import Blueprint, request, jsonify
from extensions import db

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

from services.voice_service import generate_voice_and_store
from utils.decorators import token_required


aurora_user_bp = Blueprint(
    "aurora_user_bp",
    __name__,
    url_prefix="/api/user/aurora"
)


# -------------------------------------------------------
# CONVERSE
# -------------------------------------------------------

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

    # --------------------------------------------------
    # 1️⃣ Guardrails
    # --------------------------------------------------

    guardrail_result = check_guardrails(user_text)

    # --------------------------------------------------
    # 2️⃣ Emotion Tagging
    # --------------------------------------------------

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

    # --------------------------------------------------
    # 3️⃣ Store User Message
    # --------------------------------------------------

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

    # --------------------------------------------------
    # 4️⃣ Relationship Update
    # --------------------------------------------------

    sentiment_hint = emotion_data.get("valence") if emotion_data else None

    rel = update_on_message(
        current_user.id,
        user_text=user_text,
        safety_flag=guardrail_result.triggered,
        sentiment_hint=sentiment_hint
    )

    # --------------------------------------------------
    # 5️⃣ Assistant Response
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
            guardrail_result
        )

    # --------------------------------------------------
    # 6️⃣ Voice Generation (if enabled)
    # --------------------------------------------------

    voice_enabled = (rel.ritual_preferences or {}).get("voice_enabled", True)

    audio_url = None
    if voice_enabled and assistant_reply:
        audio_url = generate_voice_and_store(
            assistant_reply,
            str(current_user.id),
            str(session_uuid)
        )

    # --------------------------------------------------
    # 7️⃣ Store Assistant Message
    # --------------------------------------------------

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

    # --------------------------------------------------
    # 8️⃣ Memory Promotion Layer 🧠🔥 (WITH DEBUG)
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
                confidence=float(item.get("confidence", 0.6))
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


# -------------------------------------------------------
# END SESSION & SUMMARIZATION + PERSONALITY + MEMORY DECAY
# -------------------------------------------------------

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

    # --------------------------------------------------
    # 1️⃣ Fetch Session Messages
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
    # 2️⃣ Generate Session Summary
    # --------------------------------------------------

    summary_dict = summarize_session(
        user_id=current_user.id,
        session_id=session_uuid,
        messages=messages
    )

    # --------------------------------------------------
    # 3️⃣ Store Summary
    # --------------------------------------------------

    summary = AuroraSessionSummary(
        user_id=current_user.id,
        session_id=session_uuid,
        dominant_emotion=summary_dict.get("dominant_emotion"),
        engagement_score=summary_dict.get("engagement_score", 0.5),
        primary_themes=summary_dict.get("primary_themes", []),
        session_outcome=summary_dict.get("session_outcome"),
        recommendation_tag=summary_dict.get("recommendation_tag"),
        risk_flag=bool(summary_dict.get("risk_flag", False)),
        meta_json=summary_dict
    )

    db.session.add(summary)
    db.session.commit()

    # --------------------------------------------------
    # 4️⃣ Personality Evolution Hook 🧠
    # --------------------------------------------------

    try:
        rel = get_or_create_relationship(current_user.id)

        update_personality_from_session(
            current_user.id,
            relationship=rel,
            session_summary=summary_dict,
            emotion_hint={
                "dominant_emotion": summary_dict.get("dominant_emotion"),
                "engagement_score": summary_dict.get("engagement_score", 0.5)
            }
        )

        print("\n🧠 Personality updated from session.\n")

    except Exception as e:
        print("\n!!!! PERSONALITY UPDATE ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

    # --------------------------------------------------
    # 5️⃣ Memory Decay / Prune Hook 🧠🧹
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
        "summary": summary.to_dict()
    }), 200


# -------------------------------------------------------
# PERSONALITY DEBUG ENDPOINT (D)
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
            "updated_at": m.updated_at.isoformat() if getattr(m, "updated_at", None) else None,
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


""""""""""""""""""""""""""""
import uuid
from flask import Blueprint, request, jsonify
from extensions import db

from aurora.models_messages import AuroraMessage
from aurora.models_emotion import AuroraEmotion
from aurora.relationship import update_on_message
from aurora.guardrails import check_guardrails
from aurora.brain_user import generate_reply
from aurora.emotion import analyze_text_emotion
from aurora.memory_store import extract_memory_candidates, upsert_memory

from aurora.models_session_summary import AuroraSessionSummary
from aurora.relationship import get_or_create_relationship
from aurora.summarizer import summarize_session
from aurora.personality import update_personality_from_session


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

    # --------------------------------------------------
    # 1️⃣ Guardrails
    # --------------------------------------------------

    guardrail_result = check_guardrails(user_text)

    # --------------------------------------------------
    # 2️⃣ Emotion Tagging
    # --------------------------------------------------

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

    # --------------------------------------------------
    # 3️⃣ Store User Message
    # --------------------------------------------------

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

    # --------------------------------------------------
    # 4️⃣ Relationship Update
    # --------------------------------------------------

    sentiment_hint = emotion_data.get("valence") if emotion_data else None

    rel = update_on_message(
        current_user.id,
        user_text=user_text,
        safety_flag=guardrail_result.triggered,
        sentiment_hint=sentiment_hint
    )

    # --------------------------------------------------
    # 5️⃣ Assistant Response
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
            guardrail_result
        )

    # --------------------------------------------------
    # 6️⃣ Voice Generation (if enabled)
    # --------------------------------------------------

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

    # --------------------------------------------------
    # 7️⃣ Store Assistant Message
    # --------------------------------------------------

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

    # --------------------------------------------------
    # 8️⃣ Memory Promotion Layer 🧠🔥 (WITH DEBUG)
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
                confidence=float(item.get("confidence", 0.6))
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
    
# -------------------------------------------------------
# END SESSION & SUMMARIZATION
# -------------------------------------------------------

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

    # --------------------------------------------------
    # 1️⃣ Fetch Session Messages
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
    # 2️⃣ Generate Session Summary
    # --------------------------------------------------

    summary_dict = summarize_session(
        user_id=current_user.id,
        session_id=session_uuid,
        messages=messages
    )

    # --------------------------------------------------
    # 3️⃣ Store Summary
    # --------------------------------------------------

    summary = AuroraSessionSummary(
        user_id=current_user.id,
        session_id=session_uuid,
        dominant_emotion=summary_dict.get("dominant_emotion"),
        engagement_score=summary_dict.get("engagement_score", 0.5),
        primary_themes=summary_dict.get("primary_themes", []),
        session_outcome=summary_dict.get("session_outcome"),
        recommendation_tag=summary_dict.get("recommendation_tag"),
        risk_flag=bool(summary_dict.get("risk_flag", False)),
        meta_json=summary_dict
    )

    db.session.add(summary)
    db.session.commit()

    # --------------------------------------------------
    # 4️⃣ Personality Evolution Hook 🧠
    # --------------------------------------------------

    try:
        rel = get_or_create_relationship(current_user.id)

        update_personality_from_session(
            current_user.id,
            relationship=rel,
            session_summary=summary_dict,
            emotion_hint={
                "dominant_emotion": summary_dict.get("dominant_emotion"),
                "engagement_score": summary_dict.get("engagement_score", 0.5)
            }
        )

        print("🧠 Personality updated from session.")

    except Exception as e:
        print("PERSONALITY UPDATE ERROR:", str(e))

    # --------------------------------------------------
    # RESPONSE
    # --------------------------------------------------

    return jsonify({
        "message": "session_summarized",
        "summary": summary.to_dict()
    }), 200



"""""""""""""""""""""""""""""""""""""""