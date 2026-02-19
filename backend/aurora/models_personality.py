# backend/aurora/models_personality.py

import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from extensions import db


class AuroraPersonality(db.Model):
    __tablename__ = "aurora_personality"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)

    # Learned adaptive profile (system-controlled, evolves)
    tone = db.Column(db.String(50), nullable=False, default="warm")  # warm|grounded|direct|playful|clinical-lite
    verbosity = db.Column(db.String(50), nullable=False, default="balanced")  # concise|balanced|detailed
    pace = db.Column(db.String(50), nullable=False, default="normal")  # slow|normal|fast
    directness = db.Column(db.String(50), nullable=False, default="gentle")  # gentle|neutral|direct
    probing_depth = db.Column(db.String(50), nullable=False, default="light")  # light|moderate|deep

    adaptive_score = db.Column(db.Float, nullable=False, default=0.10)  # 0..1 “how tuned” Aurora is

    # User preferences / overrides (explicit, user-controlled)
    user_overrides = db.Column(JSONB, nullable=False, default=dict)

    # System notes for admin (NOT shown to user)
    admin_notes = db.Column(JSONB, nullable=False, default=dict)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, *, for_admin: bool = False):
        base = {
            "user_id": str(self.user_id),
            "tone": self.tone,
            "verbosity": self.verbosity,
            "pace": self.pace,
            "directness": self.directness,
            "probing_depth": self.probing_depth,
            "adaptive_score": float(self.adaptive_score or 0.0),
            "user_overrides": self.user_overrides or {},
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if for_admin:
            base["admin_notes"] = self.admin_notes or {}
        return base
