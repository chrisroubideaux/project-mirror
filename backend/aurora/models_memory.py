# backend/aurora/models_memory.py

import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from extensions import db


class AuroraUserMemory(db.Model):
    __tablename__ = "aurora_user_memory"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = db.Column(UUID(as_uuid=True), nullable=False, index=True)
    session_id = db.Column(UUID(as_uuid=True), nullable=True, index=True)

    key = db.Column(db.String(100), nullable=False, index=True)
    value = db.Column(db.Text, nullable=False)

    confidence = db.Column(db.Float, nullable=False, default=0.5)  # 0–1
    source_message_id = db.Column(UUID(as_uuid=True), nullable=True)

    meta_json = db.Column(JSONB, nullable=False, default=dict)

    last_confirmed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "session_id": str(self.session_id) if self.session_id else None,
            "key": self.key,
            "value": self.value,
            "confidence": self.confidence,
            "last_confirmed_at": self.last_confirmed_at.isoformat() if self.last_confirmed_at else None,
            "meta_json": self.meta_json or {},
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
