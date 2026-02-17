# backend/aurora/models_session_summary.py

import uuid
from datetime import datetime
from extensions import db


class AuroraSessionSummary(db.Model):
    __tablename__ = "aurora_session_summary"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    session_id = db.Column(
        db.UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    primary_themes = db.Column(db.JSON)
    dominant_emotion = db.Column(db.String(50))
    session_outcome = db.Column(db.String(100))
    engagement_score = db.Column(db.Float)

    # Boolean only — no diagnosis
    risk_flag = db.Column(db.Boolean, default=False)

    recommendation_tag = db.Column(db.String(100))

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "session_id": str(self.session_id),
            "primary_themes": self.primary_themes,
            "dominant_emotion": self.dominant_emotion,
            "session_outcome": self.session_outcome,
            "engagement_score": self.engagement_score,
            "risk_flag": self.risk_flag,
            "recommendation_tag": self.recommendation_tag,
            "created_at": self.created_at.isoformat(),
        }
