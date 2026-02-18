# backend/aurora/memory_store.py

from typing import List
from extensions import db
from aurora.models_memory import AuroraUserMemory


# ---------------------------------------------------
# FETCH MEMORY
# ---------------------------------------------------

def fetch_user_memory(user_id) -> List[AuroraUserMemory]:
    return (
        AuroraUserMemory.query
        .filter_by(user_id=user_id)
        .order_by(AuroraUserMemory.confidence.desc())
        .all()
    )


# ---------------------------------------------------
# UPSERT MEMORY
# ---------------------------------------------------

def upsert_memory(
    user_id,
    key: str,
    value: str,
    session_id=None,
    source_message_id=None,
    confidence: float = 0.6,
):
    """
    Insert or update structured memory.
    """

    existing = AuroraUserMemory.query.filter_by(
        user_id=user_id,
        key=key
    ).first()

    if existing:
        existing.value = value
        existing.confidence = max(existing.confidence, confidence)
        existing.last_confirmed_at = None
        db.session.commit()
        return existing

    memory = AuroraUserMemory(
        user_id=user_id,
        session_id=session_id,
        key=key,
        value=value,
        confidence=confidence,
        source_message_id=source_message_id,
    )

    db.session.add(memory)
    db.session.commit()

    return memory
