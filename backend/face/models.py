# backend/face/models.py
import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID, ARRAY, FLOAT
from extensions import db


class FaceEmbedding(db.Model):
    """
    Stores face embeddings for biometric authentication.

    A FaceEmbedding belongs to EITHER:
      - a User (user_id)
      - an Admin (admin_id)

    Never both at the same time.
    """

    __tablename__ = "face_embeddings"

    # --------------------------------------------------
    # Primary Key
    # --------------------------------------------------
    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # --------------------------------------------------
    # Ownership (one-of relationship)
    # --------------------------------------------------
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    admin_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    # --------------------------------------------------
    # Embedding data (AuraFace / 512-dim vector)
    # --------------------------------------------------
    embedding = db.Column(
        ARRAY(FLOAT),
        nullable=False
    )

    # --------------------------------------------------
    # State & metadata
    # --------------------------------------------------
    is_active = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # --------------------------------------------------
    # Relationships
    # --------------------------------------------------
    user = db.relationship(
        "User",
        back_populates="face_embeddings"
    )

    admin = db.relationship(
        "Admin",
        back_populates="face_embeddings"
    )

    # --------------------------------------------------
    # Debug / representation
    # --------------------------------------------------
    def __repr__(self):
        owner_id = self.user_id or self.admin_id
        return f"<FaceEmbedding id={self.id} owner={owner_id} active={self.is_active}>"


"""""""""""
import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID, ARRAY, FLOAT
from extensions import db


class FaceEmbedding(db.Model):
    
    Stores face embeddings for biometric authentication.

    A FaceEmbedding belongs to EITHER:
    - a User (user_id)
    - an Admin (admin_id)

    Never both.
    

    __tablename__ = "face_embeddings"

    # --------------------------------------------------
    # Primary Key
    # --------------------------------------------------
    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # --------------------------------------------------
    # Ownership (one-of)
    # --------------------------------------------------
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    admin_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    # --------------------------------------------------
    # Embedding data (AuraFace)
    # --------------------------------------------------
    embedding = db.Column(
        ARRAY(FLOAT),
        nullable=False
    )  # 512-d normalized vector

    # --------------------------------------------------
    # Metadata
    # --------------------------------------------------
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # --------------------------------------------------
    # Relationships
    # --------------------------------------------------
    user = db.relationship(
        "User",
        back_populates="face_embeddings"
    )

    admin = db.relationship(
        "Admin",
        back_populates="face_embeddings"
    )

    # --------------------------------------------------
    # Debug
    # --------------------------------------------------
    def __repr__(self):
        owner = self.user_id or self.admin_id
        return f"<FaceEmbedding id={self.id} owner={owner}>"
    
    
    
"""""""""""""""""
