# backend/face/routes.py
import os
from flask import Blueprint, request, jsonify

from extensions import db, limiter
from users.models import User
from face.models import FaceEmbedding
from face.face_utils import (
    get_embedding_from_bytes,
    get_embedding_from_gcs,
    cosine_similarity
)

from utils.jwt_token import generate_jwt_token
from utils.decorators import token_required


# =====================================================
# Blueprint
# =====================================================
face_bp = Blueprint("face", __name__, url_prefix="/api/face")

# =====================================================
# Config
# =====================================================
GCS_BUCKET = os.getenv("GCS_BUCKET")
SIMILARITY_THRESHOLD = 0.65
MAX_FACES_PER_USER = 5
LIVENESS_MAX_SIMILARITY = 0.995


# =====================================================
# REGISTER FACE(S)
# =====================================================
@face_bp.route("/register", methods=["POST"])
@token_required
def register_face(current_user: User):
    if len(current_user.face_embeddings) >= MAX_FACES_PER_USER:
        return jsonify({
            "error": "face_limit_reached",
            "max_faces": MAX_FACES_PER_USER
        }), 400

    embeddings = []
    uploaded_images = []

    # ----------------------------------
    # Direct upload(s)
    # ----------------------------------
    if "image" in request.files:
        files = request.files.getlist("image")
        for f in files:
            emb = get_embedding_from_bytes(f.read())
            if emb:
                embeddings.append(emb)
                uploaded_images.append("local-only")

    # ----------------------------------
    # GCS paths (optional)
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
        return jsonify({"error": "no_valid_face_detected"}), 400

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

    token = generate_jwt_token(
        str(current_user.id),
        current_user.email
    )

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
# LIST FACE EMBEDDINGS
# =====================================================
@face_bp.route("/embeddings", methods=["GET"])
@token_required
def list_face_embeddings(current_user: User):
    return jsonify({
        "count": len(current_user.face_embeddings),
        "embeddings": [
            {
                "id": str(emb.id),
                "created_at": emb.created_at.isoformat()
                if hasattr(emb, "created_at") else None,
                "is_active": emb.is_active
            }
            for emb in current_user.face_embeddings
        ]
    }), 200


# =====================================================
# DISABLE (ROTATE) FACE EMBEDDING
# =====================================================
@face_bp.route("/embeddings/<embedding_id>", methods=["DELETE"])
@token_required
def delete_face_embedding(current_user: User, embedding_id):
    embedding = FaceEmbedding.query.filter_by(
        id=embedding_id,
        user_id=current_user.id
    ).first()

    if not embedding:
        return jsonify({"error": "embedding_not_found"}), 404

    # Soft disable (rotation-safe)
    embedding.is_active = False
    db.session.commit()

    return jsonify({
        "message": "face_embedding_disabled",
        "remaining_faces": len(current_user.face_embeddings)
    }), 200


# =====================================================
# FACE LOGIN — ACTIVE USERS + ACTIVE EMBEDDINGS + LIVENESS
# =====================================================
@face_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login_with_face():
    # ----------------------------------
    # Require two images for liveness
    # ----------------------------------
    if "image1" not in request.files or "image2" not in request.files:
        return jsonify({
            "match": False,
            "reason": "two_images_required"
        }), 400

    emb1 = get_embedding_from_bytes(request.files["image1"].read())
    emb2 = get_embedding_from_bytes(request.files["image2"].read())

    if not emb1 or not emb2:
        return jsonify({
            "match": False,
            "reason": "no_face_detected"
        }), 400

    # ----------------------------------
    # Liveness check
    # ----------------------------------
    motion_score = cosine_similarity(emb1, emb2)
    if motion_score >= LIVENESS_MAX_SIMILARITY:
        return jsonify({
            "match": False,
            "reason": "no_liveness_detected",
            "motion_score": round(motion_score, 4)
        }), 401

    embedding = emb2

    # ----------------------------------
    # Match against ACTIVE embeddings
    # ----------------------------------
    best_user = None
    best_score = 0.0

    active_embeddings = (
        FaceEmbedding.query
        .filter_by(is_active=True)
        .join(User)
        .filter(User.is_active == True)
        .all()
    )

    for emb in active_embeddings:
        score = cosine_similarity(embedding, emb.embedding)
        if score > best_score:
            best_score = score
            best_user = emb.user

    if best_user and best_score >= SIMILARITY_THRESHOLD:
        token = generate_jwt_token(
            str(best_user.id),
            best_user.email
        )

        return jsonify({
            "match": True,
            "score": round(min(best_score, 0.999), 4),
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

"""""""""""""""""""""""
import os
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

# Flask-Limiter
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


# =====================================================
# Blueprint
# =====================================================
face_bp = Blueprint("face", __name__, url_prefix="/api/face")

# =====================================================
# Config
# =====================================================
GCS_BUCKET = os.getenv("GCS_BUCKET")  # optional, unused for now
SIMILARITY_THRESHOLD = 0.65           # cosine similarity
MAX_FACES_PER_USER = 5                # registration cap

# =====================================================
# Rate Limiter
# NOTE: This assumes limiter.init_app(app) is done in app.py
# =====================================================
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)


# =====================================================
# REGISTER FACE(S) — AUTHENTICATED USER
# =====================================================
@face_bp.route("/register", methods=["POST"])
@token_required
def register_face(current_user: User):
    
    Register one or more face embeddings for the authenticated user.
    Accepts:
      - multipart/form-data with image(s)
      - JSON with gcs_paths[] (optional)


    # ----------------------------------
    # Enforce face limit
    # ----------------------------------
    if len(current_user.face_embeddings) >= MAX_FACES_PER_USER:
        return jsonify({
            "error": "face_limit_reached",
            "max_faces": MAX_FACES_PER_USER
        }), 400

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
            uploaded_images.append("local-only")

    # ----------------------------------
    # Option B: GCS paths (JSON)
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
        return jsonify({"error": "no_valid_face_detected"}), 400

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

    # Refresh token (clean UX)
    token = generate_jwt_token(
        str(current_user.id),
        current_user.email
    )

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
# FACE LOGIN — RATE LIMITED
# =====================================================
@face_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login_with_face():
    
    Authenticate a user via face embedding.
    Accepts:
      - multipart image
      - JSON { gcs_path } (optional)
    

    embedding = None

    # ----------------------------------
    # Extract embedding
    # ----------------------------------
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
    # Compare against all user embeddings
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

    # ----------------------------------
    # Successful match
    # ----------------------------------
    if best_user and best_score >= SIMILARITY_THRESHOLD:
        clamped_score = min(best_score, 0.999)

        token = generate_jwt_token(
            str(best_user.id),
            best_user.email
        )

        return jsonify({
            "match": True,
            "score": round(clamped_score, 4),
            "token": token,
            "user": {
                "id": str(best_user.id),
                "email": best_user.email,
                "full_name": best_user.full_name
            }
        }), 200

    # ----------------------------------
    # No match
    # ----------------------------------
    return jsonify({
        "match": False,
        "score": round(best_score, 4)
    }), 401
"""""""""""""""