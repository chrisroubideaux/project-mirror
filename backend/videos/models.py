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
    series_avatar_url = db.Column(db.String(512), nullable=True)

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
            "series_avatar_url": self.series_avatar_url,  # 👈 ADD THIS
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
    
# =============================
# Per-view analytics (NEW)
# =============================

class VideoView(db.Model):
    __tablename__ = "video_views"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    video_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # NULL = guest view
    user_id = db.Column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )

    ip_address = db.Column(db.String(64), nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        index=True
    )

    # Optional relationship (nice to have)
    video = db.relationship(
        "Video",
        backref=db.backref("view_events", lazy="dynamic")
    )

    def __repr__(self):
        return f"<VideoView video={self.video_id} at={self.created_at}>"

