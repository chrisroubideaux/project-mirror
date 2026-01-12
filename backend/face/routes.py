# backend/face_login/routes.py
import os
import uuid
from flask import Blueprint, request, jsonify

from extensions import db
from users.models import User
from face.models import FaceEmbedding
from face.face_utils import (
    get_embedding_from_bytes,
    get_embedding_from_gcs,
    cosine_similarity
)

from utils.jwt_token import generate_jwt_token
from utils.decorators import token_required


face_bp = Blueprint("face", __name__, url_prefix="/api/face")

GCS_BUCKET = os.getenv("GCS_BUCKET")  # optional, unused for now
SIMILARITY_THRESHOLD = 0.65  # cosine similarity (higher = stricter)


# =====================================================
# REGISTER FACE(S) — USER ONLY
# =====================================================
@face_bp.route("/register", methods=["POST"])
@token_required
def register_face(current_user: User):
    """
    Register one or more face embeddings for the authenticated user.
    Accepts:
      - multipart/form-data with image(s)
      - JSON with gcs_paths[] (disabled for now)
    """

    embeddings = []
    uploaded_images = []

    # ----------------------------------
    # Option A: Direct image upload(s)
    # ----------------------------------
    if "image" in request.files:
        files = request.files.getlist("image")

        for f in files:
            emb = get_embedding_from_bytes(f.read())
            if not emb:
                continue

            embeddings.append(emb)

            # Aurora: skip GCS upload (local-only)
            uploaded_images.append("local-only")

    # ----------------------------------
    # Option B: GCS paths (JSON) — optional
    # ----------------------------------
    elif request.is_json:
        paths = request.json.get("gcs_paths", [])
        for path in paths:
            emb = get_embedding_from_gcs(GCS_BUCKET, path)
            if emb:
                embeddings.append(emb)
                uploaded_images.append(
                    f"https://storage.googleapis.com/{GCS_BUCKET}/{path}"
                )

    if not embeddings:
        return jsonify({"error": "No valid face detected"}), 400

    # ----------------------------------
    # Save embeddings
    # ----------------------------------
    ids = []
    for emb in embeddings:
        record = FaceEmbedding(
            user_id=current_user.id,
            embedding=emb
        )
        db.session.add(record)
        db.session.flush()
        ids.append(str(record.id))

    db.session.commit()

    # Refresh token (optional but clean)
    token = generate_jwt_token(str(current_user.id), current_user.email)

    return jsonify({
        "message": f"{len(ids)} face(s) registered",
        "embedding_ids": ids,
        "uploaded_images": uploaded_images,
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name
        },
        "token": token
    }), 201


# =====================================================
# FACE LOGIN — USER ONLY
# =====================================================
@face_bp.route("/login", methods=["POST"])
def login_with_face():
    """
    Authenticate a user via face embedding.
    Accepts:
      - multipart image
      - JSON { gcs_path } (optional)
    """

    embedding = None

    if "image" in request.files:
        embedding = get_embedding_from_bytes(
            request.files["image"].read()
        )

    elif request.is_json and request.json.get("gcs_path"):
        embedding = get_embedding_from_gcs(
            GCS_BUCKET,
            request.json["gcs_path"]
        )

    if not embedding:
        return jsonify({
            "match": False,
            "reason": "no_face_detected"
        }), 400

    # ----------------------------------
    # Compare against all USER embeddings
    # ----------------------------------
    best_user = None
    best_score = 0.0

    users = User.query.all()
    for user in users:
        for emb in user.face_embeddings:
            score = cosine_similarity(embedding, emb.embedding)
            if score > best_score:
                best_score = score
                best_user = user

    if best_user and best_score >= SIMILARITY_THRESHOLD:
        token = generate_jwt_token(
            str(best_user.id),
            best_user.email
        )

        return jsonify({
            "match": True,
            "score": round(best_score, 4),
            "token": token,
            "user": {
                "id": str(best_user.id),
                "email": best_user.email,
                "full_name": best_user.full_name
            }
        }), 200

    return jsonify({
        "match": False,
        "score": round(best_score, 4)
    }), 401
