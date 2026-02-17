# backend/aurora/models_relationship.py
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from extensions import db

class AuroraRelationship(db.Model):
    __tablename__ = "aurora_relationship"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)

    familiarity_score = db.Column(db.Integer, nullable=False, default=5)  # 0-100
    trust_score = db.Column(db.Integer, nullable=False, default=5)        # 0-100
    interaction_count = db.Column(db.Integer, nullable=False, default=0)

    last_seen_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    ritual_preferences = db.Column(JSONB, nullable=False, default=dict)
    flags_json = db.Column(JSONB, nullable=False, default=dict)

    def to_dict(self):
        return {
            "user_id": str(self.user_id),
            "familiarity_score": self.familiarity_score,
            "trust_score": self.trust_score,
            "interaction_count": self.interaction_count,
            "last_seen_at": self.last_seen_at.isoformat() if self.last_seen_at else None,
            "ritual_preferences": self.ritual_preferences or {},
            "flags_json": self.flags_json or {},
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
