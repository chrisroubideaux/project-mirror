# backend/videos/models.py

import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID
from extensions import db


# =====================================================
# Video
# =====================================================

class Video(db.Model):
    __tablename__ = "videos"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # =============================
    # Core metadata
    # =============================

    title = db.Column(db.String(255), nullable=False)
    subtitle = db.Column(db.String(255))
    description = db.Column(db.Text)

    # =============================
    # Media URLs
    # =============================

    poster_url = db.Column(db.String(512), nullable=False)
    video_url = db.Column(db.String(512), nullable=False)

    # =============================
    # Optional display metadata
    # =============================

    duration = db.Column(db.String(20))
    aspect_ratio = db.Column(db.String(20), default="16:9")
    series_avatar_url = db.Column(db.String(512), nullable=True)

    # =============================
    # Classification
    # =============================

    type = db.Column(db.String(50), default="episode")
    visibility = db.Column(db.String(20), default="public")

    # Reels support
    is_reel = db.Column(db.Boolean, default=False, index=True)

    # =============================
    # Ownership
    # =============================

    created_by = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("admins.id", ondelete="SET NULL"),
        nullable=True
    )

    created_by_admin = db.relationship(
        "Admin",
        backref=db.backref("videos", lazy="dynamic")
    )

    # =============================
    # Cached analytics counters
    # =============================

    view_count = db.Column(db.Integer, default=0)
    like_count = db.Column(db.Integer, default=0)

    # =============================
    # Soft delete
    # =============================

    is_active = db.Column(db.Boolean, default=True)
    deleted_at = db.Column(db.DateTime, nullable=True)

    # =============================
    # Timestamps
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
            "series_avatar_url": self.series_avatar_url,
            "duration": self.duration,
            "aspect_ratio": self.aspect_ratio,
            "type": self.type,
            "visibility": self.visibility,
            "is_reel": self.is_reel,
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


# =====================================================
# Per-view analytics (event-based)
# =====================================================

class VideoView(db.Model):
    __tablename__ = "video_views"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    video_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # NULL = guest view
    user_id = db.Column(UUID(as_uuid=True), nullable=True, index=True)

    ip_address = db.Column(db.String(64), nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        index=True
    )

    video = db.relationship(
        "Video",
        backref=db.backref("view_events", lazy="dynamic")
    )

    def __repr__(self):
        return f"<VideoView video={self.video_id} at={self.created_at}>"


# =====================================================
# Video Reactions (Likes / Dislikes)
# =====================================================

class VideoReaction(db.Model):
    __tablename__ = "video_reactions"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    video_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id = db.Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # "like" | "dislike"
    reaction = db.Column(db.String(10), nullable=False)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        db.UniqueConstraint(
            "video_id",
            "user_id",
            name="uq_video_user_reaction",
        ),
    )

    video = db.relationship(
        "Video",
        backref=db.backref("reactions", lazy="dynamic")
    )

    def __repr__(self):
        return (
            f"<VideoReaction video={self.video_id} "
            f"user={self.user_id} reaction={self.reaction}>"
        )


# =====================================================
# Video Shares
# =====================================================

class VideoShare(db.Model):
    __tablename__ = "video_shares"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    video_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # NULL = guest share
    user_id = db.Column(UUID(as_uuid=True), nullable=True, index=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    video = db.relationship(
        "Video",
        backref=db.backref("shares", lazy="dynamic")
    )

    def __repr__(self):
        return f"<VideoShare video={self.video_id}>"


# =====================================================
# Analytics Alerts
# =====================================================

class AnalyticsAlert(db.Model):
    __tablename__ = "analytics_alerts"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # NULL = platform-wide alert
    video_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    admin_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    alert_type = db.Column(db.String(64), nullable=False, index=True)
    severity = db.Column(db.String(16), default="info")

    title = db.Column(db.String(140), nullable=False)
    message = db.Column(db.Text, nullable=False)

    payload = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_at = db.Column(db.DateTime, nullable=True)

    video = db.relationship(
        "Video",
        backref=db.backref("analytics_alerts", lazy="dynamic")
    )

    admin = db.relationship(
        "Admin",
        backref=db.backref("analytics_alerts", lazy="dynamic")
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "video_id": str(self.video_id) if self.video_id else None,
            "admin_id": str(self.admin_id),
            "alert_type": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "message": self.message,
            "payload": self.payload,
            "created_at": self.created_at.isoformat(),
            "acknowledged_at": (
                self.acknowledged_at.isoformat()
                if self.acknowledged_at else None
            ),
        }

    def __repr__(self):
        return f"<AnalyticsAlert {self.alert_type} severity={self.severity}>"


""""""""""""""""

# backend/videos/models.py

import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID
from extensions import db


# =====================================================
# Video
# =====================================================

class Video(db.Model):
    __tablename__ = "videos"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # =============================
    # Core metadata
    # =============================

    title = db.Column(db.String(255), nullable=False)
    subtitle = db.Column(db.String(255))
    description = db.Column(db.Text)

    # =============================
    # Media URLs
    # =============================

    poster_url = db.Column(db.String(512), nullable=False)
    video_url = db.Column(db.String(512), nullable=False)

    # =============================
    # Optional display metadata
    # =============================

    duration = db.Column(db.String(20))
    aspect_ratio = db.Column(db.String(20), default="16:9")
    series_avatar_url = db.Column(db.String(512), nullable=True)

    # =============================
    # Classification
    # =============================

    type = db.Column(db.String(50), default="episode")
    visibility = db.Column(db.String(20), default="public")

    # =============================
    # Ownership
    # =============================

    created_by = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("admins.id", ondelete="SET NULL"),
        nullable=True
    )

    created_by_admin = db.relationship(
        "Admin",
        backref=db.backref("videos", lazy="dynamic")
    )

    # =============================
    # Analytics counters
    # =============================

    view_count = db.Column(db.Integer, default=0)
    like_count = db.Column(db.Integer, default=0)

    # =============================
    # Soft delete
    # =============================

    is_active = db.Column(db.Boolean, default=True)
    deleted_at = db.Column(db.DateTime, nullable=True)

    # =============================
    # Timestamps
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
            "series_avatar_url": self.series_avatar_url,
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


# =====================================================
# Per-view analytics
# =====================================================

class VideoView(db.Model):
    __tablename__ = "video_views"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    video_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # NULL = guest view
    user_id = db.Column(UUID(as_uuid=True), nullable=True, index=True)

    ip_address = db.Column(db.String(64), nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        index=True
    )

    video = db.relationship(
        "Video",
        backref=db.backref("view_events", lazy="dynamic")
    )

    def __repr__(self):
        return f"<VideoView video={self.video_id} at={self.created_at}>"


# =====================================================
# Analytics Alerts (NEW)
# =====================================================

class AnalyticsAlert(db.Model):
    __tablename__ = "analytics_alerts"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # NULL = platform-wide alert
    video_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    admin_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    alert_type = db.Column(db.String(64), nullable=False, index=True)
    severity = db.Column(db.String(16), default="info")  # info | warning | danger

    title = db.Column(db.String(140), nullable=False)
    message = db.Column(db.Text, nullable=False)

    payload = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_at = db.Column(db.DateTime, nullable=True)

    video = db.relationship(
        "Video",
        backref=db.backref("analytics_alerts", lazy="dynamic")
    )

    admin = db.relationship(
        "Admin",
        backref=db.backref("analytics_alerts", lazy="dynamic")
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "video_id": str(self.video_id) if self.video_id else None,
            "admin_id": str(self.admin_id),
            "alert_type": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "message": self.message,
            "payload": self.payload,
            "created_at": self.created_at.isoformat(),
            "acknowledged_at": self.acknowledged_at.isoformat()
            if self.acknowledged_at else None,
        }

    def __repr__(self):
        return f"<AnalyticsAlert {self.alert_type} severity={self.severity}>"


        
        
        """""""""""""""""""""""