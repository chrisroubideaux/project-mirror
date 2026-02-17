# backend/aurora/models_emotion.py

import uuid
from datetime import datetime
from extensions import db


class AuroraEmotion(db.Model):
    __tablename__ = "aurora_emotions"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    message_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("aurora_messages.id"),
        nullable=False,
        index=True
    )

    session_id = db.Column(
        db.UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    # Sentiment
    sentiment_label = db.Column(db.String(50))
    sentiment_score = db.Column(db.Float)

    # Emotion classifier label
    emotion_label = db.Column(db.String(50))
    emotion_score = db.Column(db.Float)

    # PAD model values (0–1 scale)
    valence = db.Column(db.Float)
    arousal = db.Column(db.Float)
    dominance = db.Column(db.Float)

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
            "message_id": str(self.message_id),
            "session_id": str(self.session_id),
            "sentiment_label": self.sentiment_label,
            "sentiment_score": self.sentiment_score,
            "emotion_label": self.emotion_label,
            "emotion_score": self.emotion_score,
            "valence": self.valence,
            "arousal": self.arousal,
            "dominance": self.dominance,
            "created_at": self.created_at.isoformat()
        }
