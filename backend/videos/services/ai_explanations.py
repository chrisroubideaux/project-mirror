

# backend/videos/services/ai_explanations.py

import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_alert_explanation(payload: dict) -> str:
    """
    Generate a short human-readable explanation
    for an analytics anomaly.
    """

    prompt = f"""
You are an analytics assistant for a video platform.

Explain the following anomaly clearly in 1–2 sentences.
Avoid technical language.

Context:
{payload}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You explain analytics spikes clearly."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=120,
    )

    return response.choices[0].message.content.strip()

