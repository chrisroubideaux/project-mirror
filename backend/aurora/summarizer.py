# backend/aurora/summarizer.py

# backend/aurora/summarizer.py

import os
import json
from openai import OpenAI

from aurora.models_messages import AuroraMessage
from aurora.models_emotion import AuroraEmotion


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("AURORA_MODEL", "gpt-4o-mini")


def summarize_session(user_id, session_id, messages=None):
    """
    Generates structured session summary using OpenAI.
    Returns a Python dict.
    """

    # --------------------------------------------------
    # 1️⃣ Fetch Messages If Not Provided
    # --------------------------------------------------

    if messages is None:
        messages = (
            AuroraMessage.query
            .filter_by(user_id=user_id, session_id=session_id)
            .order_by(AuroraMessage.created_at.asc())
            .all()
        )

    if not messages:
        return {}

    # --------------------------------------------------
    # 2️⃣ Fetch Emotion Records
    # --------------------------------------------------

    emotions = (
        AuroraEmotion.query
        .filter_by(user_id=user_id, session_id=session_id)
        .all()
    )

    # --------------------------------------------------
    # 3️⃣ Build Conversation Text
    # --------------------------------------------------

    conversation_text = "\n".join(
        f"{m.role}: {m.content}" for m in messages
    )

    avg_valence = None
    if emotions:
        valid_vals = [e.valence for e in emotions if e.valence is not None]
        if valid_vals:
            avg_valence = sum(valid_vals) / len(valid_vals)

    # --------------------------------------------------
    # 4️⃣ Structured System Prompt
    # --------------------------------------------------

    system_prompt = (
        "You are generating a structured session summary for analytics. "
        "Return STRICT JSON only with keys:\n"
        "primary_themes (list of strings),\n"
        "dominant_emotion (string),\n"
        "session_outcome (string),\n"
        "engagement_score (float between 0 and 1),\n"
        "risk_flag (boolean),\n"
        "recommendation_tag (string).\n"
        "No commentary. No markdown. JSON only."
    )

    user_prompt = f"""
Conversation:
{conversation_text}

Average Valence: {avg_valence}

Generate structured session summary.
"""

    # --------------------------------------------------
    # 5️⃣ Call OpenAI
    # --------------------------------------------------

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=400
        )

        raw_output = response.choices[0].message.content.strip()

        # Attempt to parse JSON
        parsed = json.loads(raw_output)

        return parsed

    except Exception as e:
        print("\n!!!! SESSION SUMMARIZER ERROR !!!!")
        print(str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

        # Safe fallback
        return {
            "primary_themes": ["general_conversation"],
            "dominant_emotion": "neutral",
            "session_outcome": "incomplete",
            "engagement_score": 0.5,
            "risk_flag": False,
            "recommendation_tag": "continue_support",
        }
