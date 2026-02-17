# backend/aurora/models_messages.py

import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from extensions import db


class AuroraMessage(db.Model):
    __tablename__ = "aurora_messages"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Who this belongs to
    user_id = db.Column(UUID(as_uuid=True), nullable=False, index=True)

    # Logical conversation session
    session_id = db.Column(UUID(as_uuid=True), nullable=False, index=True)

    # "user" or "assistant"
    role = db.Column(db.String(20), nullable=False)

    # The actual message text
    content = db.Column(db.Text, nullable=False)

    # Message-scoped metadata only
    # (safety flags, sentiment, tokens_used, response_time_ms, etc.)
    meta_json = db.Column(JSONB, nullable=False, default=dict)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "session_id": str(self.session_id),
            "role": self.role,
            "content": self.content,
            "meta_json": self.meta_json or {},
            "created_at": self.created_at.isoformat(),
        }
