# backend/admin/face/routes.py

from flask import request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    get_jwt,
    create_access_token,
)

from extensions import db
from admin.models import Admin
from face.models import FaceEmbedding
from face.face_utils import (
    get_embedding_from_bytes,
    get_embedding_from_gcs,
    cosine_similarity,
)
from gcs_client import upload_file_to_gcs
from . import admin_face_bp

import os
import uuid


# =====================================================
# REGISTER FACE(S) — ADMIN ONLY
# =====================================================
@admin_face_bp.route("/register", methods=["POST"])
@jwt_required()
def register_admin_face():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404

    bucket = os.getenv("GCS_BUCKET")

    embeddings = []
    image_urls = []

    # -------------------------
    # Option A: file uploads
    # -------------------------
    if "image" in request.files:
        files = request.files.getlist("image")

        for f in files:
            emb = get_embedding_from_bytes(f.read())
            if emb:
                embeddings.append(emb)

            f.stream.seek(0)
            filename = f"admin-face/{admin_id}/{uuid.uuid4()}.jpg"
            url = upload_file_to_gcs(f, filename)
            image_urls.append(url)

    # -------------------------
    # Option B: GCS paths
    # -------------------------
    elif request.is_json:
        gcs_paths = request.json.get("gcs_paths") or []
        for path in gcs_paths:
            emb = get_embedding_from_gcs(bucket, path)
            if emb:
                embeddings.append(emb)
            image_urls.append(
                f"https://storage.googleapis.com/{bucket}/{path}"
            )

    if not embeddings:
        return jsonify({"error": "No face detected"}), 400

    embedding_ids = []
    for emb in embeddings:
        fe = FaceEmbedding(
            admin_id=admin_id,
            embedding=emb,
        )
        db.session.add(fe)
        db.session.flush()
        embedding_ids.append(str(fe.id))

    db.session.commit()

    # ✅ Issue admin JWT using unified system
    token = create_access_token(
        identity=str(admin.id),
        additional_claims={"role": "admin"},
    )

    return jsonify({
        "message": f"{len(embedding_ids)} admin face(s) registered",
        "embedding_ids": embedding_ids,
        "uploaded_images": image_urls,
        "admin_id": str(admin.id),
        "email": admin.email,
        "token": token,
    }), 201


# =====================================================
# LOGIN WITH FACE — ADMIN
# =====================================================
@admin_face_bp.route("/login", methods=["POST"])
def admin_face_login():
    bucket = os.getenv("GCS_BUCKET")

    embedding = None
    if "image" in request.files:
        embedding = get_embedding_from_bytes(
            request.files["image"].read()
        )
    elif request.is_json and request.json.get("gcs_path"):
        embedding = get_embedding_from_gcs(
            bucket,
            request.json["gcs_path"]
        )

    if not embedding:
        return jsonify({"match": False, "reason": "no_face"}), 400

    best_admin = None
    best_score = -1.0

    admins = Admin.query.all()
    for admin in admins:
        for emb in admin.face_embeddings:
            score = cosine_similarity(embedding, emb.embedding)
            if score > best_score:
                best_score = score
                best_admin = admin

    threshold = 0.35
    if best_admin and best_score > (1 - threshold):
        token = create_access_token(
            identity=str(best_admin.id),
            additional_claims={"role": "admin"},
        )

        return jsonify({
            "match": True,
            "score": round(best_score, 4),
            "token": token,
            "admin_id": str(best_admin.id),
            "email": best_admin.email,
            "full_name": best_admin.full_name,
        }), 200

    return jsonify({
        "match": False,
        "score": round(best_score, 4),
    }), 401
