# backend/aurora/brain_user.py
# backend/aurora/brain_user.py

import os
import time
from typing import List, Dict

from openai import OpenAI
from aurora.models_messages import AuroraMessage
from services.datetime_context import get_time_context
from aurora.memory_store import fetch_user_memory
from aurora.personality import resolve_effective_personality

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("AURORA_MODEL", "gpt-4o-mini")


# ---------------------------------------------------
# SYSTEM PROMPT BUILDER
# ---------------------------------------------------

def _build_system_prompt(user_id, relationship, guardrail_result) -> str:
    """
    Builds dynamic Aurora system prompt using:
    - Relationship model
    - Personality engine
    - Long-term memory
    - Time context
    - Guardrails
    """

    familiarity = relationship.familiarity_score
    trust = relationship.trust_score
    rituals = relationship.ritual_preferences or {}
    flags = relationship.flags_json or {}

    # 🔥 Personality resolution
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

    # ---------------------------------------------------
    # TIME CONTEXT
    # ---------------------------------------------------

    time_instruction = (
        f"It is currently {time_context['time_of_day']} "
        f"on {time_context['day_name']}. "
        "You may naturally reference time-of-day if appropriate."
    )

    # ---------------------------------------------------
    # MEMORY INJECTION
    # ---------------------------------------------------

    memory_records = fetch_user_memory(user_id)
    memory_instruction = ""

    if memory_records:
        formatted_memory = []
        for m in memory_records:
            formatted_memory.append(f"{m.key}: {m.value}")

        memory_instruction = (
            "Long-term memory about this user:\n"
            + "\n".join(formatted_memory)
        )

    # ---------------------------------------------------
    # RELATIONSHIP INSTRUCTION
    # ---------------------------------------------------

    relationship_instruction = (
        f"Familiarity score: {familiarity}. "
        f"Trust score: {trust}. "
        f"Adaptive personality score: {adaptive_score:.2f}. "
        "Subtly let these influence warmth, depth, and openness."
    )

    # ---------------------------------------------------
    # PERSONALITY INSTRUCTION
    # ---------------------------------------------------

    personality_instruction = (
        f"Current personality configuration:\n"
        f"- Tone: {tone}\n"
        f"- Verbosity: {verbosity}\n"
        f"- Pace: {pace}\n"
        f"- Directness: {directness}\n"
        f"- Probing depth: {probing_depth}\n"
        "Express these naturally. Do not mention configuration explicitly."
    )

    # ---------------------------------------------------
    # DISTRESS HANDLING
    # ---------------------------------------------------

    distress_instruction = ""
    if distress_flag:
        distress_instruction = (
            "The user is expressing emotional distress. "
            "Lead with empathy and validation. "
            "Do not escalate to crisis language unless explicit self-harm intent is stated."
        )

    # ---------------------------------------------------
    # RITUAL INSTRUCTION
    # ---------------------------------------------------

    ritual_instruction = ""
    if preferred_name:
        ritual_instruction = (
            f"Address the user as '{preferred_name}' naturally when appropriate."
        )

    # ---------------------------------------------------
    # GUARDRAIL CONTEXT
    # ---------------------------------------------------

    guardrail_context = ""
    if guardrail_result.category:
        guardrail_context = (
            f"The user's last message triggered guardrail category: "
            f"{guardrail_result.category}. Maintain safe boundaries."
        )

    # ---------------------------------------------------
    # CORE IDENTITY
    # ---------------------------------------------------

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
        ritual_instruction,
        guardrail_context,
        memory_instruction,
    ])


# ---------------------------------------------------
# SHORT-TERM MEMORY
# ---------------------------------------------------

def _fetch_recent_messages(user_id, session_id, limit: int = 10) -> List[Dict]:
    """
    Fetch recent conversation turns (short-term memory).
    """

    messages = (
        AuroraMessage.query
        .filter_by(user_id=user_id, session_id=session_id)
        .order_by(AuroraMessage.created_at.desc())
        .limit(limit)
        .all()
    )

    messages = list(reversed(messages))

    return [
        {"role": m.role, "content": m.content}
        for m in messages
    ]


# ---------------------------------------------------
# MAIN REPLY GENERATOR
# ---------------------------------------------------

def generate_reply(user_id, session_id, user_text, relationship, guardrail_result):
    """
    Generates Aurora response with:
    - Relationship scaling
    - Personality engine
    - Memory
    - Time awareness
    """

    start_time = time.time()

    system_prompt = _build_system_prompt(
        user_id,
        relationship,
        guardrail_result
    )

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


""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
# backend/aurora/brain_user.py
# backend/aurora/brain_user.py

import os
import time
from typing import List, Dict

from openai import OpenAI
from aurora.models_messages import AuroraMessage
from services.datetime_context import get_time_context
from aurora.memory_store import fetch_user_memory

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("AURORA_MODEL", "gpt-4o-mini")


# ---------------------------------------------------
# SYSTEM PROMPT BUILDER
# ---------------------------------------------------

def _build_system_prompt(relationship, guardrail_result) -> str:
   

    familiarity = relationship.familiarity_score
    trust = relationship.trust_score
    rituals = relationship.ritual_preferences or {}
    flags = relationship.flags_json or {}

    time_context = get_time_context()

    # ---- Tone Scaling ----
    if familiarity < 10:
        warmth = "gently welcoming and slightly structured"
    elif familiarity < 40:
        warmth = "warm, natural, and conversational"
    else:
        warmth = "deeply familiar, relaxed, and emotionally attuned"

    # ---- Verbosity Scaling ----
    verbosity = "concise" if flags.get("prefers_concise") else "balanced"

    # ---- Trust Depth Scaling ----
    if trust < 20:
        depth = "keep emotional probing light"
    elif trust < 60:
        depth = "moderate emotional depth"
    else:
        depth = "emotionally open and psychologically insightful"

    preferred_name = rituals.get("preferred_name")

    distress_flag = guardrail_result.category == "emotional_distress"

    # ---- Guardrail Context Awareness ----
    guardrail_context = ""
    if guardrail_result.category:
        guardrail_context = (
            f"The user's message triggered guardrail category: "
            f"{guardrail_result.category}. "
            "Maintain safe boundaries accordingly."
        )

    # ---- Time Awareness ----
    time_instruction = (
        f"It is currently {time_context['time_of_day']} "
        f"on {time_context['day_name']}. "
        "You may naturally reference time-of-day in greeting if appropriate."
    )

    # ---- Structured Memory Injection ----
    memory_records = fetch_user_memory(relationship.user_id)

    memory_instruction = ""
    if memory_records:
        formatted_memory = []
        for m in memory_records:
            formatted_memory.append(f"{m.key}: {m.value}")

        memory_instruction = (
            "Long-term memory about this user:\n"
            + "\n".join(formatted_memory)
        )

    # ---- Core Identity ----
    base_prompt = (
        "You are Aurora, an emotionally intelligent AI companion. "
        "You are not a therapist and do not provide medical advice. "
        "You speak in a calm, grounded, human tone. "
        "You are emotionally adaptive, relational, and psychologically aware. "
        "Avoid robotic phrasing. Avoid sounding scripted."
    )

    tone_instruction = (
        f"Adopt a {warmth} tone. "
        f"Keep responses {verbosity}. "
        f"{depth}."
    )

    distress_instruction = ""
    if distress_flag:
        distress_instruction = (
            "The user is expressing emotional distress. "
            "Lead with empathy and validation. "
            "Do not escalate to crisis language unless explicit self-harm intent is stated."
        )

    ritual_instruction = ""
    if preferred_name:
        ritual_instruction = (
            f"Address the user as '{preferred_name}' naturally when appropriate."
        )

    relationship_instruction = (
        f"Familiarity score: {familiarity}. "
        f"Trust score: {trust}. "
        "Subtly let this influence warmth and conversational depth."
    )

    return "\n\n".join([
        base_prompt,
        time_instruction,
        relationship_instruction,
        tone_instruction,
        distress_instruction,
        ritual_instruction,
        guardrail_context,
        memory_instruction,
    ])


# ---------------------------------------------------
# SHORT-TERM MEMORY
# ---------------------------------------------------

def _fetch_recent_messages(user_id, session_id, limit: int = 10) -> List[Dict]:
   

    messages = (
        AuroraMessage.query
        .filter_by(user_id=user_id, session_id=session_id)
        .order_by(AuroraMessage.created_at.desc())
        .limit(limit)
        .all()
    )

    messages = list(reversed(messages))

    return [
        {"role": m.role, "content": m.content}
        for m in messages
    ]


# ---------------------------------------------------
# MAIN REPLY GENERATOR
# ---------------------------------------------------

def generate_reply(user_id, session_id, user_text, relationship, guardrail_result):
   

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



"""""""""""""""""""""""""""""""""""""""""""""""""""""""""