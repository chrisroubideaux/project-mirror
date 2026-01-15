import uuid
from datetime import timedelta

from flask import Blueprint, request, jsonify
from google.cloud import storage

from admin.decorators import admin_token_required

uploads_bp = Blueprint("uploads", __name__, url_prefix="/api/uploads")


@uploads_bp.route("/sign", methods=["POST"])
@admin_token_required
def sign_upload(current_admin):
    data = request.get_json() or {}

    filename = data.get("filename")
    content_type = data.get("content_type")
    folder = data.get("folder", "videos")

    if not filename or not content_type:
        return jsonify({"error": "filename and content_type required"}), 400

    ext = filename.split(".")[-1]
    object_name = f"{folder}/{uuid.uuid4()}.{ext}"

    client = storage.Client()
    bucket = client.bucket("project-mirror-assets-aurora")
    blob = bucket.blob(object_name)

    signed_url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="PUT",
        content_type=content_type,
    )

    public_url = f"https://storage.googleapis.com/{bucket.name}/{object_name}"

    return jsonify({
        "signed_url": signed_url,
        "public_url": public_url,
        "object_name": object_name,
    }), 200
