# backend/aurora/relationship.py
from datetime import datetime
from extensions import db
from aurora.models_relationship import AuroraRelationship

def _clamp(n: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, n))

def get_or_create_relationship(user_id):
    rel = AuroraRelationship.query.filter_by(user_id=user_id).first()
    if rel:
        return rel

    rel = AuroraRelationship(
        user_id=user_id,
        familiarity_score=5,
        trust_score=5,
        interaction_count=0,
        ritual_preferences={
            "greeting_style": "warm",
            "check_in_frequency": "light",
            "preferred_name": None,
            "avoid_topics": [],
            "voice_enabled": True,   # ✅ Added here
        },
        flags_json={
            "safety_flag_triggered": False,
            "prefers_concise": False,
        },
    )

    db.session.add(rel)
    db.session.commit()
    return rel

def update_on_message(user_id, *, user_text: str, safety_flag: bool = False, sentiment_hint: float | None = None):
    """
    Called after each user message is stored (or at least after it's received).
    sentiment_hint: optional -1..+1 (if you already compute text sentiment elsewhere)
    """
    rel = get_or_create_relationship(user_id)

    rel.interaction_count += 1
    rel.last_seen_at = datetime.utcnow()

    # Familiarity grows slowly with repeated interaction
    # Faster early growth, slower later.
    fam_gain = 2 if rel.interaction_count < 10 else 1
    rel.familiarity_score = _clamp(rel.familiarity_score + fam_gain)

    # Trust changes based on user signals (simple + safe heuristics)
    # Positive: thanks, openness, cooperative tone
    lower = (user_text or "").lower()

    trust_delta = 0
    if any(p in lower for p in ["thank you", "thanks", "appreciate", "that helps"]):
        trust_delta += 2
    if any(p in lower for p in ["i feel", "i'm feeling", "i am feeling", "i'm worried", "i'm scared"]):
        trust_delta += 1  # vulnerability / openness, tiny boost

    # Negative: hostility / "you suck" / etc. (tiny drop, don't punish hard)
    if any(p in lower for p in ["stupid", "useless", "shut up", "hate you"]):
        trust_delta -= 2

    # Safety flag should NOT “diagnose”, but we can make Aurora more careful (flags only)
    if safety_flag:
        rel.flags_json = rel.flags_json or {}
        rel.flags_json["safety_flag_triggered"] = True
        # Trust shouldn't drop because they’re struggling; keep neutral.
        trust_delta += 0

    # If you have sentiment signal, nudge trust slightly
    if sentiment_hint is not None:
        if sentiment_hint > 0.35:
            trust_delta += 1
        elif sentiment_hint < -0.35:
            trust_delta -= 1

    rel.trust_score = _clamp(rel.trust_score + trust_delta)

    db.session.commit()
    return rel

def apply_ritual_preference(user_id, *, preferred_name: str | None = None, prefers_concise: bool | None = None):
    rel = get_or_create_relationship(user_id)

    rel.ritual_preferences = rel.ritual_preferences or {}
    rel.flags_json = rel.flags_json or {}

    if preferred_name is not None:
        rel.ritual_preferences["preferred_name"] = preferred_name

    if prefers_concise is not None:
        rel.flags_json["prefers_concise"] = bool(prefers_concise)

    db.session.commit()
    return rel

"""""""""""""""""""""""""""""""""""""""""""""

# backend/aurora/relationship.py
from datetime import datetime
from extensions import db
from aurora.models_relationship import AuroraRelationship

def _clamp(n: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, n))

def get_or_create_relationship(user_id):
    rel = AuroraRelationship.query.filter_by(user_id=user_id).first()
    if rel:
        return rel

    rel = AuroraRelationship(
        user_id=user_id,
        familiarity_score=5,
        trust_score=5,
        interaction_count=0,
        ritual_preferences={
            "greeting_style": "warm",
            "check_in_frequency": "light",
            "preferred_name": None,
            "avoid_topics": [],
        },
        flags_json={
            "safety_flag_triggered": False,
            "prefers_concise": False,
        },
    )
    db.session.add(rel)
    db.session.commit()
    return rel

def update_on_message(user_id, *, user_text: str, safety_flag: bool = False, sentiment_hint: float | None = None):
   
    rel = get_or_create_relationship(user_id)

    rel.interaction_count += 1
    rel.last_seen_at = datetime.utcnow()

    # Familiarity grows slowly with repeated interaction
    # Faster early growth, slower later.
    fam_gain = 2 if rel.interaction_count < 10 else 1
    rel.familiarity_score = _clamp(rel.familiarity_score + fam_gain)

    # Trust changes based on user signals (simple + safe heuristics)
    # Positive: thanks, openness, cooperative tone
    lower = (user_text or "").lower()

    trust_delta = 0
    if any(p in lower for p in ["thank you", "thanks", "appreciate", "that helps"]):
        trust_delta += 2
    if any(p in lower for p in ["i feel", "i'm feeling", "i am feeling", "i'm worried", "i'm scared"]):
        trust_delta += 1  # vulnerability / openness, tiny boost

    # Negative: hostility / "you suck" / etc. (tiny drop, don't punish hard)
    if any(p in lower for p in ["stupid", "useless", "shut up", "hate you"]):
        trust_delta -= 2

    # Safety flag should NOT “diagnose”, but we can make Aurora more careful (flags only)
    if safety_flag:
        rel.flags_json = rel.flags_json or {}
        rel.flags_json["safety_flag_triggered"] = True
        # Trust shouldn't drop because they’re struggling; keep neutral.
        trust_delta += 0

    # If you have sentiment signal, nudge trust slightly
    if sentiment_hint is not None:
        if sentiment_hint > 0.35:
            trust_delta += 1
        elif sentiment_hint < -0.35:
            trust_delta -= 1

    rel.trust_score = _clamp(rel.trust_score + trust_delta)

    db.session.commit()
    return rel

def apply_ritual_preference(user_id, *, preferred_name: str | None = None, prefers_concise: bool | None = None):
    rel = get_or_create_relationship(user_id)

    rel.ritual_preferences = rel.ritual_preferences or {}
    rel.flags_json = rel.flags_json or {}

    if preferred_name is not None:
        rel.ritual_preferences["preferred_name"] = preferred_name

    if prefers_concise is not None:
        rel.flags_json["prefers_concise"] = bool(prefers_concise)

    db.session.commit()
    return rel




"""""""""""""""""""""""""""""""""""""""
