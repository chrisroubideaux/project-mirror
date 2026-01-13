# backend/admin/models.py

# backend/admin/models.py

import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from extensions import db


class Admin(db.Model):
    __tablename__ = "admins"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(512), nullable=False)

    oauth_provider = db.Column(db.String(50), nullable=True)
    profile_image_url = db.Column(db.String(512), nullable=True)

    role = db.Column(db.String(50), default="admin")
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    face_embeddings = db.relationship(
        "FaceEmbedding",
        back_populates="admin",
        cascade="all, delete-orphan"
    )

    identities = db.relationship(
        "AdminIdentity",
        back_populates="admin",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Admin {self.email}>"



class AdminIdentity(db.Model):
    __tablename__ = "admin_identities"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    admin_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("admins.id"),
        nullable=False
    )

    provider = db.Column(db.String(50), nullable=False)
    provider_user_id = db.Column(db.String(255), nullable=False)

    email_at_auth_time = db.Column(db.String(120))
    email_verified = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    admin = db.relationship("Admin", back_populates="identities")

    __table_args__ = (
        db.UniqueConstraint("provider", "provider_user_id"),
    )

    def __repr__(self):
        return f"<AdminIdentity {self.provider}:{self.provider_user_id}>"


""""""""""""""""""""""
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
    # OAuth metadata
    # --------------------------------------------------
    oauth_provider = db.Column(db.String(50), nullable=True)
    profile_image_url = db.Column(db.String(512), nullable=True)

    # --------------------------------------------------
    # Role / Status
    # --------------------------------------------------
    role = db.Column(db.String(50), default="admin")
    is_active = db.Column(db.Boolean, default=True)

    # --------------------------------------------------
    # Timestamps
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
    face_embeddings = db.relationship(
        "FaceEmbedding",
        back_populates="admin",
        cascade="all, delete-orphan"
    )

    # --------------------------------------------------
    # Debug
    # --------------------------------------------------
    def __repr__(self):
        return f"<Admin {self.email}>"
    
    
"""""""""""""""""""""""
