# backend/videos/services/analytics_alerts.py

import os
from datetime import datetime, timedelta
from typing import Optional, Tuple, Any, Dict

from extensions import db
from videos.models import AnalyticsAlert

# If you already have a shared OpenAI client helper (recommended),
# import it here instead of creating a new client.
# Example:
# from ai.openai_client import client

try:
    from openai import OpenAI
    _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception:
    _openai_client = None


def _safe_ai_explanation(alert_type: str, payload: Dict[str, Any]) -> Optional[str]:
    """
    Generates a short, human explanation for an analytics alert.
    Returns None if OpenAI isn't configured or call fails.
    """
    if not _openai_client:
        return None

    # Keep prompts small + structured (cheap + consistent)
    # You can enrich payload over time (deltas, timeframe, labels, etc).
    system = (
        "You are an analytics assistant for a video platform admin dashboard. "
        "Explain anomalies briefly and concretely. "
        "Rules: 1-2 sentences max, no hype, no speculation beyond the data, "
        "offer a likely cause and a next step if applicable."
    )

    # Only send non-sensitive, useful fields
    safe_payload = {
        "alert_type": alert_type,
        "video_id": payload.get("video_id"),
        "window": payload.get("window"),
        "current": payload.get("current"),
        "previous": payload.get("previous"),
        "delta_pct": payload.get("delta_pct"),
        "guest": payload.get("guest"),
        "member": payload.get("member"),
        "notes": payload.get("notes"),
    }

    user = (
        "Create a short explanation for this alert.\n"
        f"Data: {safe_payload}\n"
        "Output plain text only."
    )

    try:
        resp = _openai_client.chat.completions.create(
            model=os.getenv("OPENAI_ALERT_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            max_tokens=120,
        )
        text = (resp.choices[0].message.content or "").strip()
        return text or None
    except Exception:
        return None


def create_analytics_alert(
    *,
    admin_id,
    alert_type: str,
    title: Optional[str] = None,
    message: Optional[str] = None,
    severity: str = "info",
    video_id: Optional[str] = None,
    payload: Optional[dict] = None,
    dedupe_minutes: int = 30,
    with_ai: bool = True,
) -> Tuple[AnalyticsAlert, bool]:
    """
    Centralized analytics alert creation.

    Handles:
    - deduping
    - persistence
    - optional AI explanations (stored in payload["ai_explanation"])
    - reuse across routes / jobs / detectors

    Returns: (alert, deduped)
    """

    payload = payload or {}

    # Helpful to include video_id in payload for AI prompt
    # (doesn't change DB schema, just helps explanation)
    payload.setdefault("video_id", video_id)

    # ----------------------------------
    # Deduping
    # ----------------------------------
    since = datetime.utcnow() - timedelta(minutes=dedupe_minutes)

    exists = (
        AnalyticsAlert.query.filter(
            AnalyticsAlert.admin_id == admin_id,
            AnalyticsAlert.alert_type == alert_type,
            (AnalyticsAlert.video_id == video_id)
            if video_id
            else (AnalyticsAlert.video_id.is_(None)),
            AnalyticsAlert.created_at >= since,
        ).first()
    )

    if exists:
        return exists, True

    # ----------------------------------
    # Optional AI explanation (before commit)
    # ----------------------------------
    if with_ai and "ai_explanation" not in payload:
        ai_text = _safe_ai_explanation(alert_type, payload)
        if ai_text:
            payload["ai_explanation"] = ai_text

    # ----------------------------------
    # Create alert
    # ----------------------------------
    alert = AnalyticsAlert(
        admin_id=admin_id,
        video_id=video_id,
        alert_type=alert_type,
        severity=severity,
        title=title or "Analytics Alert",
        message=message or "",
        payload=payload,
        created_at=datetime.utcnow(),
    )

    db.session.add(alert)
    db.session.commit()

    return alert, False
