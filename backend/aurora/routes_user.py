# backend/aurora/routes_user.py

# backend/aurora/routes_user.py

import uuid
from flask import Blueprint, request, jsonify
from extensions import db

from aurora.models_messages import AuroraMessage
from aurora.relationship import update_on_message
from aurora.guardrails import check_guardrails
from aurora.brain_user import generate_reply
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

    # Generate session if not provided
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "invalid_session_id"}), 400

    # 1️⃣ Run guardrails FIRST
    guardrail_result = check_guardrails(user_text)

    # 2️⃣ Store user message with guardrail metadata
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
            }
        }
    )
    db.session.add(user_msg)
    db.session.commit()

    # 3️⃣ Update relationship (flag only, no diagnosis)
    rel = update_on_message(
        current_user.id,
        user_text=user_text,
        safety_flag=guardrail_result.triggered,
        sentiment_hint=None  # emotion layer later
    )

    # 4️⃣ Determine assistant response
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

    # 5️⃣ Store assistant message
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
        "assistant_reply": assistant_reply,
        "usage": usage
    }), 200




""""""""""""""""""""""""""""
import uuid
from flask import Blueprint, request, jsonify
from extensions import db

from aurora.models_messages import AuroraMessage
from aurora.relationship import update_on_message
from aurora.guardrails import check_guardrails
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

    # Generate session if not provided
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "invalid_session_id"}), 400

    # 🔐 1️⃣ Run guardrails FIRST
    guardrail_result = check_guardrails(user_text)

    # 2️⃣ Store user message with guardrail metadata
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
            }
        }
    )
    db.session.add(user_msg)
    db.session.commit()

    # 3️⃣ Update relationship (flag only, no diagnosis)
    rel = update_on_message(
        current_user.id,
        user_text=user_text,
        safety_flag=guardrail_result.triggered,
        sentiment_hint=None  # emotion layer later
    )

    # 4️⃣ Determine assistant response
    if guardrail_result.triggered:
        assistant_reply = guardrail_result.response_override
    else:
        # Placeholder until GPT is wired
        assistant_reply = "I'm here with you. Tell me more."

    # 5️⃣ Store assistant message
    assistant_msg = AuroraMessage(
        user_id=current_user.id,
        session_id=session_uuid,
        role="assistant",
        content=assistant_reply,
        meta_json={
            "guardrail_response": guardrail_result.triggered
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
        "assistant_reply": assistant_reply
    }), 200




"""""""""""""""""""""""""""""""""""""""