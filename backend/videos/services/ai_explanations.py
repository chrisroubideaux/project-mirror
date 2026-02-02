# backend/videos/services/ai_explanations.py

import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_alert_explanation(payload: dict) -> str:
    """
    Generate a severity-aware explanation
    for analytics alerts.
    """

    severity = payload.get("severity", "info")
    metric = payload.get("metric", "activity")
    current = payload.get("current")
    baseline = payload.get("baseline_avg")
    delta = payload.get("delta_pct")
    window = payload.get("window_days")

    # ----------------------------------
    # Severity-aware system prompt
    # ----------------------------------
    if severity == "danger":
        system_prompt = (
            "You are an analytics risk advisor. "
            "Explain why this spike is urgent and what risk it poses. "
            "Be concise and non-technical."
        )
    elif severity == "warning":
        system_prompt = (
            "You are an analytics assistant. "
            "Explain what likely caused this spike and why it deserves attention."
        )
    else:
        system_prompt = (
            "You are an analytics assistant. "
            "Explain this activity change in a neutral, informative way."
        )

    user_prompt = f"""
Metric: {metric}
Current value: {current}
Baseline average: {baseline}
Change: {delta}%
Window: last {window} days

Explain what happened and why it matters.
Keep it under 2 sentences.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=120,
    )

    return response.choices[0].message.content.strip()
