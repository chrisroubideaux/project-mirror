# backend/videos/models.py

import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID
from extensions import db


class Video(db.Model):
    __tablename__ = "videos"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # =============================
    # Core metadata
    # =============================

    title = db.Column(db.String(255), nullable=False)
    subtitle = db.Column(db.String(255))
    description = db.Column(db.Text)

    # =============================
    # Media URLs (HeyGen / GCS / CDN)
    # =============================

    poster_url = db.Column(db.String(512), nullable=False)
    video_url = db.Column(db.String(512), nullable=False)

    # =============================
    # Optional display metadata
    # =============================

    duration = db.Column(db.String(20))          # "0:42"
    aspect_ratio = db.Column(db.String(20), default="16:9")

    # =============================
    # Classification
    # =============================

    type = db.Column(db.String(50), default="episode")
    # intro | trailer | episode | demo | test

    visibility = db.Column(db.String(20), default="public")
    # public | unlisted | private

    # =============================
    # Ownership (Admin controlled)
    # =============================

    created_by = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("admins.id", ondelete="SET NULL"),
        nullable=True
    )

    # IMPORTANT:
    # Relationship is optional but SAFE to include
    created_by_admin = db.relationship(
        "Admin",
        backref=db.backref("videos", lazy="dynamic")
    )

    # =============================
    # Analytics (future)
    # =============================

    view_count = db.Column(db.Integer, default=0)
    like_count = db.Column(db.Integer, default=0)

    # =============================
    # Soft delete
    # =============================

    is_active = db.Column(db.Boolean, default=True)
    deleted_at = db.Column(db.DateTime, nullable=True)

    # =============================
    # System timestamps
    # =============================

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # =============================
    # Serialization
    # =============================

    def to_dict(self, admin_view=False):
        data = {
            "id": str(self.id),
            "title": self.title,
            "subtitle": self.subtitle,
            "description": self.description,
            "poster_url": self.poster_url,
            "video_url": self.video_url,
            "duration": self.duration,
            "aspect_ratio": self.aspect_ratio,
            "type": self.type,
            "visibility": self.visibility,
            "view_count": self.view_count,
            "like_count": self.like_count,
            "created_at": self.created_at.isoformat(),
        }

        if admin_view:
            data.update({
                "is_active": self.is_active,
                "created_by": str(self.created_by) if self.created_by else None,
                "updated_at": self.updated_at.isoformat(),
            })

        return data

    def __repr__(self):
        return f"<Video {self.title}>"
