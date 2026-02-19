# backend/aurora/personality.py
# backend/aurora/personality.py

from __future__ import annotations
from datetime import datetime
from extensions import db
from aurora.models_personality import AuroraPersonality


VALID_TONES = {"warm", "grounded", "direct", "playful", "clinical-lite"}
VALID_VERBOSITY = {"concise", "balanced", "detailed"}
VALID_PACE = {"slow", "normal", "fast"}
VALID_DIRECTNESS = {"gentle", "neutral", "direct"}
VALID_DEPTH = {"light", "moderate", "deep"}

DEFAULTS = dict(
    tone="warm",
    verbosity="balanced",
    pace="normal",
    directness="gentle",
    probing_depth="light",
    adaptive_score=0.10,
    user_overrides={},
    admin_notes={},
)


def get_or_create_personality(user_id):
    p = AuroraPersonality.query.filter_by(user_id=user_id).first()
    if p:
        return p

    p = AuroraPersonality(user_id=user_id, **DEFAULTS)
    db.session.add(p)
    db.session.commit()
    return p


def apply_user_overrides(
    user_id,
    *,
    tone: str | None = None,
    verbosity: str | None = None,
    pace: str | None = None,
    directness: str | None = None,
    probing_depth: str | None = None,
):
    """
    Explicit user-controlled preferences. These should *bias* Aurora, not hard lock her,
    unless you decide to treat them as strict.
    Stored in user_overrides JSON.
    """
    p = get_or_create_personality(user_id)
    uo = p.user_overrides or {}

    def _set(key, val, allowed):
        if val is None:
            return
        val = str(val).strip().lower()
        if val in allowed:
            uo[key] = val

    _set("tone", tone, VALID_TONES)
    _set("verbosity", verbosity, VALID_VERBOSITY)
    _set("pace", pace, VALID_PACE)
    _set("directness", directness, VALID_DIRECTNESS)
    _set("probing_depth", probing_depth, VALID_DEPTH)

    p.user_overrides = uo
    p.updated_at = datetime.utcnow()
    db.session.commit()
    return p


def resolve_effective_personality(user_id):
    """
    Merge learned + user overrides into an *effective* personality.
    Overrides win.
    """
    p = get_or_create_personality(user_id)
    uo = p.user_overrides or {}

    effective = {
        "tone": uo.get("tone", p.tone),
        "verbosity": uo.get("verbosity", p.verbosity),
        "pace": uo.get("pace", p.pace),
        "directness": uo.get("directness", p.directness),
        "probing_depth": uo.get("probing_depth", p.probing_depth),
        "adaptive_score": float(p.adaptive_score or 0.0),
    }
    return p, effective


def update_personality_from_session(
    user_id,
    *,
    relationship,
    session_summary: dict,
    emotion_hint: dict | None = None,
):
    """
    Lightweight, safe evolution logic.
    Uses session_summary outcomes + relationship trust/familiarity to nudge style.
    """
    p = get_or_create_personality(user_id)

    trust = int(getattr(relationship, "trust_score", 0) or 0)
    fam = int(getattr(relationship, "familiarity_score", 0) or 0)

    # --- Pull from session summary (your summarizer already produces these) ---
    outcome = (session_summary.get("session_outcome") or "").lower()
    engagement = float(session_summary.get("engagement_score") or 0.5)
    dominant_emotion = (session_summary.get("dominant_emotion") or "neutral").lower()
    themes = session_summary.get("primary_themes") or []

    # --- Increase adaptive score gradually with engagement + repeats ---
    # Keep it bounded 0..1
    p.adaptive_score = min(1.0, max(0.0, float(p.adaptive_score or 0.0) + (0.02 if engagement >= 0.6 else 0.01)))

    # --- Tone tuning ---
    if dominant_emotion in {"sadness", "fear"}:
        p.tone = "grounded"
        p.directness = "gentle"
    elif dominant_emotion in {"anger"}:
        # anger doesn't mean "be harsh" — it means "be steady"
        p.tone = "grounded"
        p.directness = "neutral"
    elif dominant_emotion in {"joy"}:
        # keep warm; optionally slightly playful at higher familiarity
        p.tone = "playful" if fam >= 50 else "warm"

    # --- Verbosity tuning (learned) ---
    # If engagement is low, reduce verbosity.
    if engagement < 0.45:
        p.verbosity = "concise"
    elif engagement > 0.75:
        p.verbosity = "detailed"
    else:
        p.verbosity = "balanced"

    # --- Probing depth depends on trust ---
    if trust < 20:
        p.probing_depth = "light"
    elif trust < 60:
        p.probing_depth = "moderate"
    else:
        p.probing_depth = "deep"

    # --- Pace tuning ---
    # If user sessions look intense or distressed themes present, slow down.
    if any(t in " ".join(themes).lower() for t in ["stress", "anxiety", "overwhelm", "burnout"]):
        p.pace = "slow"
    else:
        p.pace = "normal"

    # --- Admin notes (for dashboard) ---
    notes = p.admin_notes or {}
    notes["last_session_outcome"] = outcome
    notes["last_dominant_emotion"] = dominant_emotion
    notes["last_engagement_score"] = engagement
    notes["last_primary_themes"] = themes[:8]
    p.admin_notes = notes

    db.session.commit()
    return p
