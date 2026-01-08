# backend/admin/models.py
# backend/admin/models.py

import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID
from extensions import db


class Admin(db.Model):
    __tablename__ = "admins"

    # --------------------------------------------------
    # Primary Key
    # --------------------------------------------------
    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(512), nullable=False)

    # --------------------------------------------------
    # OAuth metadata (REQUIRED for admin/oauth.py)
    # --------------------------------------------------
    oauth_provider = db.Column(db.String(50), nullable=True)  # google | facebook
    profile_image_url = db.Column(db.String(512), nullable=True)

    # --------------------------------------------------
    # Role / Status
    # --------------------------------------------------
    role = db.Column(db.String(50), default="admin")
    is_active = db.Column(db.Boolean, default=True)

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
    # Debug / repr
    # --------------------------------------------------
    def __repr__(self):
        return f"<Admin {self.email}>"
