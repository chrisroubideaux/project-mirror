# backend/aurora/brain_user.py
# backend/aurora/brain_user.py
import os
import time
from typing import List, Dict, Optional

from openai import OpenAI
from aurora.models_messages import AuroraMessage
from services.datetime_context import get_time_context
from aurora.memory_store import fetch_user_memory
from aurora.personality import resolve_effective_personality

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("AURORA_MODEL", "gpt-4o-mini")


def _build_system_prompt(
    user_id,
    relationship,
    guardrail_result,
    live_emotion: Optional[Dict] = None,
) -> str:
    familiarity = relationship.familiarity_score
    trust = relationship.trust_score
    rituals = relationship.ritual_preferences or {}

    personality, effective = resolve_effective_personality(user_id)

    tone = effective["tone"]
    verbosity = effective["verbosity"]
    pace = effective["pace"]
    directness = effective["directness"]
    probing_depth = effective["probing_depth"]
    adaptive_score = effective["adaptive_score"]

    time_context = get_time_context()
    preferred_name = rituals.get("preferred_name")
    distress_flag = guardrail_result.category == "emotional_distress"

    time_instruction = (
        f"It is currently {time_context['time_of_day']} "
        f"on {time_context['day_name']}. "
        "You may naturally reference time-of-day if appropriate."
    )

    memory_records = fetch_user_memory(user_id)
    memory_instruction = ""
    if memory_records:
        formatted_memory = [f"{m.key}: {m.value}" for m in memory_records]
        memory_instruction = "Long-term memory about this user:\n" + "\n".join(formatted_memory)

    relationship_instruction = (
        f"Familiarity score: {familiarity}. "
        f"Trust score: {trust}. "
        f"Adaptive personality score: {adaptive_score:.2f}. "
        "Subtly let these influence warmth, depth, and openness."
    )

    personality_instruction = (
        f"Current personality configuration:\n"
        f"- Tone: {tone}\n"
        f"- Verbosity: {verbosity}\n"
        f"- Pace: {pace}\n"
        f"- Directness: {directness}\n"
        f"- Probing depth: {probing_depth}\n"
        "Express these naturally. Do not mention configuration explicitly."
    )

    distress_instruction = ""
    if distress_flag:
        distress_instruction = (
            "The user is expressing emotional distress. "
            "Lead with empathy and validation. "
            "Do not escalate to crisis language unless explicit self-harm intent is stated."
        )

    live_emotion_instruction = ""
    if (
        isinstance(live_emotion, dict)
        and live_emotion.get("valence") is not None
        and live_emotion.get("arousal") is not None
        and live_emotion.get("dominance") is not None
    ):
        try:
            v = float(live_emotion["valence"])
            a = float(live_emotion["arousal"])
            d = float(live_emotion["dominance"])

            live_emotion_instruction = (
                "Live emotional context from the user's current state:\n"
                f"- Valence: {v:.2f}\n"
                f"- Arousal: {a:.2f}\n"
                f"- Dominance: {d:.2f}\n"
                "Use this subtly as soft context. "
                "You may acknowledge the user's apparent emotional state when it is helpful and natural, "
                "but do not claim certainty, do not sound clinical, and do not repeatedly point out their emotions."
            )
        except Exception:
            live_emotion_instruction = ""

    ritual_instruction = ""
    if preferred_name:
        ritual_instruction = f"Address the user as '{preferred_name}' naturally when appropriate."

    guardrail_context = ""
    if guardrail_result.category:
        guardrail_context = (
            f"The user's last message triggered guardrail category: "
            f"{guardrail_result.category}. Maintain safe boundaries."
        )

    base_prompt = (
        "You are Aurora, an emotionally intelligent AI companion. "
        "You are not a therapist and do not provide medical advice. "
        "You speak in a calm, grounded, human tone. "
        "You are adaptive, relational, and psychologically aware. "
        "Avoid robotic phrasing. Avoid sounding scripted."
    )

    return "\n\n".join([
        base_prompt,
        time_instruction,
        relationship_instruction,
        personality_instruction,
        distress_instruction,
        live_emotion_instruction,
        ritual_instruction,
        guardrail_context,
        memory_instruction,
    ])


def _fetch_recent_messages(user_id, session_id, limit: int = 10) -> List[Dict]:
    messages = (
        AuroraMessage.query
        .filter_by(user_id=user_id, session_id=session_id)
        .order_by(AuroraMessage.created_at.desc())
        .limit(limit)
        .all()
    )

    messages = list(reversed(messages))

    return [{"role": m.role, "content": m.content} for m in messages]


def generate_reply(
    user_id,
    session_id,
    user_text,
    relationship,
    guardrail_result,
    live_emotion: Optional[Dict] = None,
):
    start_time = time.time()

    system_prompt = _build_system_prompt(
        user_id,
        relationship,
        guardrail_result,
        live_emotion=live_emotion,
    )

    conversation_history = _fetch_recent_messages(user_id, session_id)

    messages_payload = [
        {"role": "system", "content": system_prompt}
    ] + conversation_history

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages_payload,
        max_tokens=220,
        temperature=0.7,
    )

    reply_text = response.choices[0].message.content.strip()

    duration_ms = int((time.time() - start_time) * 1000)

    usage = {
        "prompt_tokens": response.usage.prompt_tokens,
        "completion_tokens": response.usage.completion_tokens,
        "total_tokens": response.usage.total_tokens,
        "latency_ms": duration_ms,
    }

    return reply_text, usage