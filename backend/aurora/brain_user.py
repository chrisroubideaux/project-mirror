# backend/aurora/brain_user.py

import os
import time
from typing import List, Dict

from openai import OpenAI
from aurora.models_messages import AuroraMessage

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MODEL_NAME = os.getenv("AURORA_MODEL", "gpt-4o-mini")


def _build_system_prompt(relationship, guardrail_result) -> str:
    """
    Dynamically builds Aurora’s system prompt
    based on relationship + emotional signals.
    """

    familiarity = relationship.familiarity_score
    trust = relationship.trust_score
    rituals = relationship.ritual_preferences or {}

    tone = "warm and supportive"
    verbosity = "balanced"

    if familiarity < 10:
        tone = "welcoming and slightly structured"
    elif familiarity > 50:
        tone = "familiar and naturally conversational"

    if rituals.get("preferred_name"):
        preferred_name = rituals.get("preferred_name")
    else:
        preferred_name = None

    if relationship.flags_json.get("prefers_concise"):
        verbosity = "concise"

    distress_flag = guardrail_result.category == "emotional_distress"

    base_prompt = (
        "You are Aurora, an emotionally intelligent AI companion. "
        "You are not a therapist and do not provide medical advice. "
        "You speak in a calm, grounded, human tone. "
        "Be natural, not robotic. "
    )

    tone_instruction = f"Adopt a {tone} tone. Keep responses {verbosity}."

    distress_instruction = ""
    if distress_flag:
        distress_instruction = (
            "The user is expressing emotional distress. "
            "Respond with empathy and validation. "
            "Do not escalate to crisis language unless they explicitly indicate self-harm intent. "
        )

    ritual_instruction = ""
    if preferred_name:
        ritual_instruction = f"Address the user as {preferred_name} naturally."

    relationship_instruction = (
        f"The relationship familiarity score is {familiarity} "
        f"and trust score is {trust}. "
        "Let that subtly influence warmth and openness."
    )

    return "\n".join([
        base_prompt,
        tone_instruction,
        relationship_instruction,
        distress_instruction,
        ritual_instruction,
    ])


def _fetch_recent_messages(user_id, session_id, limit: int = 10) -> List[Dict]:
    """
    Fetch short-term memory (recent conversation turns).
    """

    messages = (
        AuroraMessage.query
        .filter_by(user_id=user_id, session_id=session_id)
        .order_by(AuroraMessage.created_at.desc())
        .limit(limit)
        .all()
    )

    # reverse to chronological order
    messages = list(reversed(messages))

    formatted = []
    for m in messages:
        formatted.append({
            "role": m.role,
            "content": m.content
        })

    return formatted


def generate_reply(user_id, session_id, user_text, relationship, guardrail_result):
    """
    Main orchestration function.
    """

    start_time = time.time()

    system_prompt = _build_system_prompt(relationship, guardrail_result)

    conversation_history = _fetch_recent_messages(user_id, session_id)

    messages_payload = [
        {"role": "system", "content": system_prompt}
    ] + conversation_history + [
        {"role": "user", "content": user_text}
    ]

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages_payload,
        max_tokens=400,
        temperature=0.7,
    )

    reply_text = response.choices[0].message.content.strip()

    duration_ms = int((time.time() - start_time) * 1000)

    usage = {
        "prompt_tokens": response.usage.prompt_tokens,
        "completion_tokens": response.usage.completion_tokens,
        "total_tokens": response.usage.total_tokens,
        "latency_ms": duration_ms
    }

    return reply_text, usage
