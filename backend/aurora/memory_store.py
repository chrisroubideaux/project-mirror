# backend/aurora/memory_store.py

# backend/aurora/memory_store.py

import uuid
from typing import List, Dict
from datetime import datetime

from extensions import db
from aurora.models_memory import AuroraUserMemory


# -------------------------------------------------------
# FETCH MEMORY (Used in brain_user.py)
# -------------------------------------------------------

def fetch_user_memory(user_id):
    """
    Returns all long-term memory records for system prompt injection.
    """

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
    """
    Insert or update memory record.
    """

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
    """
    Lightweight heuristic memory extractor.
    We keep this simple and safe.
    """

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

