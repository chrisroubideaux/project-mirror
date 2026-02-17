# backend/aurora/summarizer.py

import os
from openai import OpenAI
from aurora.models_messages import AuroraMessage
from aurora.models_emotion import AuroraEmotion

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("AURORA_MODEL", "gpt-4o-mini")


def generate_session_summary(user_id, session_id):

    messages = (
        AuroraMessage.query
        .filter_by(user_id=user_id, session_id=session_id)
        .order_by(AuroraMessage.created_at.asc())
        .all()
    )

    emotions = (
        AuroraEmotion.query
        .filter_by(user_id=user_id, session_id=session_id)
        .all()
    )

    if not messages:
        return None

    conversation_text = "\n".join(
        f"{m.role}: {m.content}" for m in messages
    )

    avg_valence = None
    if emotions:
        avg_valence = sum(e.valence for e in emotions if e.valence is not None) / len(emotions)

    system_prompt = (
        "You are generating a structured session summary for analytics. "
        "Return STRICT JSON with keys: "
        "primary_themes (list of strings), "
        "dominant_emotion (string), "
        "session_outcome (string), "
        "engagement_score (0-1 float), "
        "risk_flag (boolean), "
        "recommendation_tag (string). "
        "Do not include commentary."
    )

    user_prompt = f"""
Conversation:
{conversation_text}

Average Valence: {avg_valence}

Generate structured session summary.
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        max_tokens=400
    )

    raw = response.choices[0].message.content.strip()

    return raw
