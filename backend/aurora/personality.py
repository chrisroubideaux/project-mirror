# backend/aurora/personality.py
# backend/aurora/personality.py

from __future__ import annotations

from datetime import datetime, timezone
from extensions import db
from aurora.models_personality import AuroraPersonality
from aurora.models_session_summary import AuroraSessionSummary


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
    adaptive_score=0.10,          # 0..1 (how much learned personality can drift)
    user_overrides={},           # explicit user preferences
    admin_notes={},              # internal + analytics snapshots
)


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def _now_utc():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(x)))

def _blend(prev: float, target: float, alpha: float) -> float:
    return (1.0 - alpha) * prev + alpha * target


# Numeric encodings for smoothing (0..1)
TONE_TO_X = {
    "clinical-lite": 0.05,
    "direct": 0.25,
    "grounded": 0.55,
    "warm": 0.75,
    "playful": 0.95,
}
X_TO_TONE = sorted([(v, k) for k, v in TONE_TO_X.items()])

VERBOSITY_TO_X = {"concise": 0.2, "balanced": 0.55, "detailed": 0.9}
X_TO_VERBOSITY = sorted([(v, k) for k, v in VERBOSITY_TO_X.items()])

PACE_TO_X = {"slow": 0.2, "normal": 0.55, "fast": 0.9}
X_TO_PACE = sorted([(v, k) for k, v in PACE_TO_X.items()])

DIRECTNESS_TO_X = {"gentle": 0.2, "neutral": 0.55, "direct": 0.9}
X_TO_DIRECTNESS = sorted([(v, k) for k, v in DIRECTNESS_TO_X.items()])

DEPTH_TO_X = {"light": 0.25, "moderate": 0.6, "deep": 0.9}
X_TO_DEPTH = sorted([(v, k) for k, v in DEPTH_TO_X.items()])


def _nearest_label(x: float, mapping_sorted):
    best = None
    best_d = 999
    for v, label in mapping_sorted:
        d = abs(float(x) - float(v))
        if d < best_d:
            best_d = d
            best = label
    return best


# ---------------------------------------------------------
# Core API
# ---------------------------------------------------------

def get_or_create_personality(user_id):
    p = AuroraPersonality.query.filter_by(user_id=user_id).first()
    if p:
        return p

    p = AuroraPersonality(user_id=user_id, **DEFAULTS)

    # seed numeric style_state for smoothing
    notes = p.admin_notes or {}
    notes["style_state"] = {
        "tone_x": TONE_TO_X.get(p.tone, 0.75),
        "verbosity_x": VERBOSITY_TO_X.get(p.verbosity, 0.55),
        "pace_x": PACE_TO_X.get(p.pace, 0.55),
        "directness_x": DIRECTNESS_TO_X.get(p.directness, 0.2),
        "depth_x": DEPTH_TO_X.get(p.probing_depth, 0.25),
    }
    notes["trend_snapshot"] = {}
    p.admin_notes = notes

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
    Explicit user-controlled preferences (bias, not lock).
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
    p.updated_at = _now_utc()
    db.session.commit()
    return p


def resolve_effective_personality(user_id):
    """
    Merge learned + user overrides into an effective personality.
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
        "user_overrides": uo,
        "admin_notes": p.admin_notes or {},
    }
    return p, effective


# ---------------------------------------------------------
# Stage B (Trend Engine): rolling stats from last N summaries
# ---------------------------------------------------------

def compute_session_trends(user_id, window: int = 5) -> dict:
    rows = (
        AuroraSessionSummary.query
        .filter_by(user_id=user_id)
        .order_by(AuroraSessionSummary.created_at.desc())
        .limit(window)
        .all()
    )
    if not rows:
        return {
            "window": window,
            "count": 0,
            "avg_engagement": 0.5,
            "dominant_emotion_mode": "neutral",
            "risk_rate": 0.0,
            "top_themes": [],
        }

    engagement_vals = []
    emotion_counts = {}
    theme_counts = {}
    risk_hits = 0

    for r in rows:
        if r.engagement_score is not None:
            engagement_vals.append(float(r.engagement_score))

        emo = (r.dominant_emotion or "neutral").lower()
        emotion_counts[emo] = emotion_counts.get(emo, 0) + 1

        if r.risk_flag:
            risk_hits += 1

        themes = r.primary_themes or []
        for t in themes:
            tt = str(t).strip().lower()
            if not tt:
                continue
            theme_counts[tt] = theme_counts.get(tt, 0) + 1

    avg_engagement = sum(engagement_vals) / max(1, len(engagement_vals))
    dominant_mode = max(emotion_counts.items(), key=lambda x: x[1])[0]
    risk_rate = risk_hits / max(1, len(rows))

    top_themes = sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)[:8]

    return {
        "window": window,
        "count": len(rows),
        "avg_engagement": round(avg_engagement, 4),
        "dominant_emotion_mode": dominant_mode,
        "risk_rate": round(risk_rate, 4),
        "top_themes": [k for k, _ in top_themes],
    }


# ---------------------------------------------------------
# Stage A + B + C hook: update personality from session
# ---------------------------------------------------------

def update_personality_from_session(
    user_id,
    *,
    relationship,
    session_summary: dict,
    emotion_hint: dict | None = None,
):
    """
    Safe evolution logic with SMOOTHING (A) + TRENDS (B).
    """
    p = get_or_create_personality(user_id)

    trust = int(getattr(relationship, "trust_score", 0) or 0)
    fam = int(getattr(relationship, "familiarity_score", 0) or 0)

    outcome = (session_summary.get("session_outcome") or "").lower()
    engagement = float(session_summary.get("engagement_score") or 0.5)
    dominant_emotion = (session_summary.get("dominant_emotion") or "neutral").lower()
    themes = session_summary.get("primary_themes") or []

    # ---- Trends (rolling multi-session) ----
    trends = compute_session_trends(user_id, window=5)

    # ---- Adaptive score increases slowly with engagement ----
    base = float(p.adaptive_score or 0.0)
    gain = 0.02 if engagement >= 0.6 else 0.01
    p.adaptive_score = _clamp(base + gain, 0.0, 1.0)

    # ---- Build numeric targets (0..1) ----
    # Tone target
    if dominant_emotion in {"sadness", "fear"}:
        tone_target = TONE_TO_X["grounded"]
        direct_target = DIRECTNESS_TO_X["gentle"]
    elif dominant_emotion in {"anger"}:
        tone_target = TONE_TO_X["grounded"]
        direct_target = DIRECTNESS_TO_X["neutral"]
    elif dominant_emotion in {"joy", "optimistic"}:
        tone_target = TONE_TO_X["playful"] if fam >= 50 else TONE_TO_X["warm"]
        direct_target = DIRECTNESS_TO_X["gentle"]
    else:
        tone_target = TONE_TO_X["warm"]
        direct_target = DIRECTNESS_TO_X["gentle"]

    # Verbosity target based on engagement (and trend)
    avg_eng = float(trends.get("avg_engagement", 0.5))
    if avg_eng < 0.45:
        verb_target = VERBOSITY_TO_X["concise"]
    elif avg_eng > 0.75:
        verb_target = VERBOSITY_TO_X["detailed"]
    else:
        verb_target = VERBOSITY_TO_X["balanced"]

    # Depth target based on trust
    if trust < 20:
        depth_target = DEPTH_TO_X["light"]
    elif trust < 60:
        depth_target = DEPTH_TO_X["moderate"]
    else:
        depth_target = DEPTH_TO_X["deep"]

    # Pace target based on themes
    themes_join = " ".join([str(t).lower() for t in themes])
    if any(k in themes_join for k in ["stress", "anxiety", "overwhelm", "burnout"]):
        pace_target = PACE_TO_X["slow"]
    else:
        pace_target = PACE_TO_X["normal"]

    # ---- SMOOTHING (A) ----
    notes = p.admin_notes or {}
    style = notes.get("style_state") or {
        "tone_x": TONE_TO_X.get(p.tone, 0.75),
        "verbosity_x": VERBOSITY_TO_X.get(p.verbosity, 0.55),
        "pace_x": PACE_TO_X.get(p.pace, 0.55),
        "directness_x": DIRECTNESS_TO_X.get(p.directness, 0.2),
        "depth_x": DEPTH_TO_X.get(p.probing_depth, 0.25),
    }

    # alpha = how quickly we move toward target
    # adaptive_score drives this, but keep it gentle
    alpha = 0.10 + (0.25 * float(p.adaptive_score or 0.0))  # 0.10 .. 0.35

    style["tone_x"] = _blend(style["tone_x"], tone_target, alpha)
    style["verbosity_x"] = _blend(style["verbosity_x"], verb_target, alpha)
    style["pace_x"] = _blend(style["pace_x"], pace_target, alpha)
    style["directness_x"] = _blend(style["directness_x"], direct_target, alpha)
    style["depth_x"] = _blend(style["depth_x"], depth_target, alpha)

    notes["style_state"] = style

    # Convert numeric back to categorical fields
    p.tone = _nearest_label(style["tone_x"], X_TO_TONE)
    p.verbosity = _nearest_label(style["verbosity_x"], X_TO_VERBOSITY)
    p.pace = _nearest_label(style["pace_x"], X_TO_PACE)
    p.directness = _nearest_label(style["directness_x"], X_TO_DIRECTNESS)
    p.probing_depth = _nearest_label(style["depth_x"], X_TO_DEPTH)

    # trend snapshot for debugging/admin
    notes["trend_snapshot"] = trends
    notes["last_session_outcome"] = outcome
    notes["last_dominant_emotion"] = dominant_emotion
    notes["last_engagement_score"] = engagement
    notes["last_primary_themes"] = themes[:8]
    notes["last_alpha"] = round(alpha, 4)
    p.admin_notes = notes

    p.updated_at = _now_utc()
    db.session.commit()
    return p

""""""""""""""""""""""""""""""""""""""""

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
"""""""""""""""""""""""""""""""""""""""""""""""""""