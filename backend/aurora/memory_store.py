# backend/aurora/memory_store.py
# backend/aurora/memory_store.py

import uuid
from typing import List, Dict
from datetime import datetime, timedelta

from extensions import db
from aurora.models_memory import AuroraUserMemory


# -------------------------------------------------------
# FETCH MEMORY (Used in brain_user.py)
# -------------------------------------------------------

def fetch_user_memory(user_id, limit: int = 20):
    return (
        AuroraUserMemory.query
        .filter_by(user_id=user_id)
        .order_by(AuroraUserMemory.updated_at.desc().nullslast(), AuroraUserMemory.created_at.desc())
        .limit(limit)
        .all()
    )


# -------------------------------------------------------
# MEMORY DECAY + REINFORCEMENT
# -------------------------------------------------------

def decay_user_memory(user_id, *, half_life_days: int = 45, floor: float = 0.15):
    """
    Decay confidence over time so memories feel organic.
    half_life_days=45 => after ~45 days, confidence ~half (roughly).
    """
    rows = AuroraUserMemory.query.filter_by(user_id=user_id).all()
    if not rows:
        return 0

    now = datetime.utcnow()
    changed = 0

    for m in rows:
        last = m.updated_at or m.created_at or now
        age_days = max(0.0, (now - last).total_seconds() / 86400.0)

        # simple exponential-ish decay approximation
        # decay_factor ~ 0.5 every half_life_days
        if half_life_days <= 0:
            continue

        decay_steps = age_days / float(half_life_days)
        decay_factor = 0.5 ** decay_steps

        old_conf = float(m.confidence or 0.0)
        new_conf = max(floor, min(1.0, old_conf * decay_factor))

        # only write if meaningful change
        if abs(new_conf - old_conf) >= 0.01:
            m.confidence = round(new_conf, 4)
            changed += 1

    if changed:
        db.session.commit()

    return changed


def prune_memory(user_id, *, min_confidence: float = 0.18):
    """
    Optional: remove very weak memories.
    Keep this conservative (don’t over-delete).
    """
    rows = AuroraUserMemory.query.filter_by(user_id=user_id).all()
    if not rows:
        return 0

    deleted = 0
    for m in rows:
        if float(m.confidence or 0.0) < float(min_confidence):
            db.session.delete(m)
            deleted += 1

    if deleted:
        db.session.commit()

    return deleted


# -------------------------------------------------------
# MEMORY UPSERT (reinforces on repeats)
# -------------------------------------------------------

def upsert_memory(user_id, key: str, value: str, session_id, confidence: float = 0.7):
    """
    Insert or update memory.
    Reinforce if same key repeats.
    """
    key = (key or "").strip().lower()
    if not key:
        return

    existing = AuroraUserMemory.query.filter_by(
        user_id=user_id,
        key=key
    ).first()

    now = datetime.utcnow()
    confidence = float(confidence or 0.7)
    confidence = max(0.0, min(1.0, confidence))

    if existing:
        # if value matches (or is near-identical), reinforce confidence
        old_val = (existing.value or "").strip()
        new_val = (value or "").strip()

        if new_val and old_val and new_val.lower() == old_val.lower():
            old_conf = float(existing.confidence or 0.5)
            boosted = min(1.0, old_conf + 0.08)  # small reinforcement
            existing.confidence = round(boosted, 4)
        else:
            # value changed -> update, but don’t instantly trust it
            existing.value = new_val or old_val
            old_conf = float(existing.confidence or 0.5)
            blended = (0.6 * old_conf) + (0.4 * confidence)
            existing.confidence = round(min(1.0, max(0.15, blended)), 4)

        existing.session_id = session_id
        existing.updated_at = now

    else:
        new_memory = AuroraUserMemory(
            id=uuid.uuid4(),
            user_id=user_id,
            session_id=session_id,
            key=key,
            value=(value or "").strip(),
            confidence=round(max(0.15, confidence), 4),
            created_at=now,
            updated_at=now,
        )
        db.session.add(new_memory)

    db.session.commit()


# -------------------------------------------------------
# MEMORY EXTRACTION LOGIC (Simple Pattern-Based V1)
# -------------------------------------------------------

def extract_memory_candidates(text: str) -> List[Dict]:
    """
    Lightweight heuristic memory extractor.
    Keep it simple and safe.
    """
    text_lower = (text or "").lower()
    candidates = []

    if "switching careers" in text_lower or "career" in text_lower:
        candidates.append({
            "key": "career_transition",
            "value": text,
            "confidence": 0.80
        })

    if "stressed" in text_lower or "stress" in text_lower:
        candidates.append({
            "key": "recurring_stressor",
            "value": text,
            "confidence": 0.75
        })

    if "ai" in text_lower or "artificial intelligence" in text_lower:
        candidates.append({
            "key": "interest_ai",
            "value": text,
            "confidence": 0.85
        })

    if "hope" in text_lower or "optimistic" in text_lower:
        candidates.append({
            "key": "optimism_signal",
            "value": text,
            "confidence": 0.70
        })

    return candidates

""""""""""""""""""""""""""""""""""""""""""""""
import uuid
from typing import List, Dict
from datetime import datetime

from extensions import db
from aurora.models_memory import AuroraUserMemory


# -------------------------------------------------------
# FETCH MEMORY (Used in brain_user.py)
# -------------------------------------------------------

def fetch_user_memory(user_id):
   

    return (
        AuroraUserMemory.query
        .filter_by(user_id=user_id)
        .order_by(AuroraUserMemory.created_at.desc())
        .limit(20)
        .all()
    )


# -------------------------------------------------------
# MEMORY UPSERT
# -------------------------------------------------------

def upsert_memory(user_id, key: str, value: str, session_id, confidence: float = 0.7):
   

    existing = AuroraUserMemory.query.filter_by(
        user_id=user_id,
        key=key
    ).first()

    if existing:
        existing.value = value
        existing.confidence = confidence
        existing.updated_at = datetime.utcnow()
    else:
        new_memory = AuroraUserMemory(
            id=uuid.uuid4(),
            user_id=user_id,
            session_id=session_id,
            key=key,
            value=value,
            confidence=confidence,
        )
        db.session.add(new_memory)

    db.session.commit()


# -------------------------------------------------------
# MEMORY EXTRACTION LOGIC (Simple Pattern-Based V1)
# -------------------------------------------------------

def extract_memory_candidates(text: str) -> List[Dict]:
    

    text_lower = text.lower()
    candidates = []

    # Career transition
    if "switching careers" in text_lower or "career" in text_lower:
        candidates.append({
            "key": "career_transition",
            "value": text,
            "confidence": 0.8
        })

    # Recurring stress
    if "stressed" in text_lower or "stress" in text_lower:
        candidates.append({
            "key": "recurring_stressor",
            "value": text,
            "confidence": 0.75
        })

    # AI interest
    if "ai" in text_lower or "artificial intelligence" in text_lower:
        candidates.append({
            "key": "interest_ai",
            "value": text,
            "confidence": 0.85
        })

    # Hope / optimism
    if "hope" in text_lower or "optimistic" in text_lower:
        candidates.append({
            "key": "optimism_signal",
            "value": text,
            "confidence": 0.7
        })

    return candidates

"""""""""""""""""""""""""""""""""""