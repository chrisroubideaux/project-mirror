# backend/users/models.py

import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from extensions import db


class User(db.Model):
    """
    Core identity + relationship with Aurora.
    """
    __tablename__ = "users"

    # --------------------------------------------------
    # Primary Key
    # --------------------------------------------------
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # --------------------------------------------------
    # Basic identity / auth
    # --------------------------------------------------
    full_name = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), unique=True, index=True, nullable=True)
    password_hash = db.Column(db.String(512), nullable=True)  # optional if OAuth-only
    profile_image_url = db.Column(db.String(255), nullable=True)

    # --------------------------------------------------
    # OAuth identity
    # --------------------------------------------------
    oauth_provider = db.Column(db.String(50), nullable=True)  # google | facebook
    oauth_id = db.Column(db.String(255), nullable=True, index=True)

    # --------------------------------------------------
    # Privacy flags
    # --------------------------------------------------
    is_anonymous_user = db.Column(db.Boolean, default=False)
    allow_emotion_logging = db.Column(db.Boolean, default=True)
    allow_face_storage = db.Column(db.Boolean, default=True)

    # --------------------------------------------------
    # Aurora relationship & tone
    # --------------------------------------------------
    relationship_stage = db.Column(db.String(50), default="new")
    preferred_tone = db.Column(db.String(50), default="gentle")

    comfort_level_score = db.Column(db.Float, default=0.0)
    openness_level_score = db.Column(db.Float, default=0.0)

    # --------------------------------------------------
    # Activity timestamps
    # --------------------------------------------------
    last_login_at = db.Column(db.DateTime, nullable=True)
    last_face_login_at = db.Column(db.DateTime, nullable=True)
    last_emotion_analysis_at = db.Column(db.DateTime, nullable=True)

    # --------------------------------------------------
    # System timestamps
    # --------------------------------------------------
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # --------------------------------------------------
    # Relationships
    # --------------------------------------------------
    emotional_profile = db.relationship(
        "EmotionalProfile",
        uselist=False,
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # ✅ Relationship ONLY — model lives in backend/face/models.py
    face_embeddings = db.relationship(
        "FaceEmbedding",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # --------------------------------------------------
    # Serialization
    # --------------------------------------------------
    def to_public_dict(self):
        profile = self.emotional_profile

        return {
            "id": str(self.id),
            "full_name": self.full_name,
            "email": self.email,
            "profile_image_url": self.profile_image_url,

            "oauth_provider": self.oauth_provider,
            "is_anonymous_user": self.is_anonymous_user,

            "relationship_stage": self.relationship_stage,
            "preferred_tone": self.preferred_tone,
            "comfort_level_score": self.comfort_level_score,
            "openness_level_score": self.openness_level_score,

            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "last_face_login_at": self.last_face_login_at.isoformat() if self.last_face_login_at else None,
            "last_emotion_analysis_at": (
                self.last_emotion_analysis_at.isoformat()
                if self.last_emotion_analysis_at else None
            ),

            "emotional_profile": {
                "baseline_emotion_vector": profile.baseline_emotion_vector if profile else None,
                "common_microexpressions": profile.common_microexpressions if profile else None,
                "average_gaze_pattern": profile.average_gaze_pattern if profile else None,
                "stress_indicator_level": profile.stress_indicator_level if profile else None,
                "mood_variability_score": profile.mood_variability_score if profile else None,
                "daily_mood_streak": profile.daily_mood_streak if profile else None,
                "last_emotional_shift_at": (
                    profile.last_emotional_shift_at.isoformat()
                    if profile and profile.last_emotional_shift_at else None
                ),
                "crisis_count": profile.crisis_count if profile else None,
                "last_crisis_flag_at": (
                    profile.last_crisis_flag_at.isoformat()
                    if profile and profile.last_crisis_flag_at else None
                ),
            }
        }


class EmotionalProfile(db.Model):
    """
    Long-term emotional traits, patterns, and crisis flags.
    """
    __tablename__ = "emotional_profiles"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    # Baseline / patterns
    baseline_emotion_vector = db.Column(JSONB, nullable=True)
    common_microexpressions = db.Column(JSONB, nullable=True)
    average_gaze_pattern = db.Column(JSONB, nullable=True)

    # Stress / variability
    stress_indicator_level = db.Column(db.Float, default=0.0)
    mood_variability_score = db.Column(db.Float, default=0.0)
    daily_mood_streak = db.Column(db.Integer, default=0)

    last_emotional_shift_at = db.Column(db.DateTime, nullable=True)

    # Crisis tracking
    crisis_count = db.Column(db.Integer, default=0)
    last_crisis_flag_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    user = db.relationship("User", back_populates="emotional_profile")
