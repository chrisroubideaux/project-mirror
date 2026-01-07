from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt,
    get_jwt_identity,
)

from extensions import db
from .models import Video


videos_bp = Blueprint(
    "videos",
    __name__,
    url_prefix="/api/videos"
)

# =====================================================
# HELPERS (LOCAL, SIMPLE)
# =====================================================

def login_required():
    verify_jwt_in_request()


def admin_required():
    verify_jwt_in_request()
    claims = get_jwt()
    if claims.get("role") != "admin":
        return False
    return True


# =====================================================
# PUBLIC ROUTES (NO AUTH)
# =====================================================

@videos_bp.route("", methods=["GET"])
def get_public_videos():
    videos = (
        Video.query
        .filter_by(is_active=True, visibility="public")
        .order_by(Video.created_at.desc())
        .all()
    )

    return jsonify([v.to_dict() for v in videos]), 200


@videos_bp.route("/<uuid:video_id>", methods=["GET"])
def get_public_video(video_id):
    video = Video.query.get(video_id)

    if not video or not video.is_active or video.visibility != "public":
        return jsonify({"error": "Video not found"}), 404

    return jsonify(video.to_dict()), 200


# =====================================================
# MEMBER ROUTES (USER OR ADMIN JWT)
# =====================================================

@videos_bp.route("/member", methods=["GET"])
def get_member_videos():
    login_required()

    videos = (
        Video.query
        .filter(
            Video.is_active.is_(True),
            Video.visibility.in_(["public", "private"])
        )
        .order_by(Video.created_at.desc())
        .all()
    )

    return jsonify([v.to_dict() for v in videos]), 200


@videos_bp.route("/member/<uuid:video_id>", methods=["GET"])
def get_member_video(video_id):
    login_required()

    video = Video.query.get(video_id)

    if not video or not video.is_active:
        return jsonify({"error": "Video not found"}), 404

    if video.visibility in ("public", "private"):
        return jsonify(video.to_dict()), 200

    return jsonify({"error": "Access denied"}), 403


# =====================================================
# ADMIN ROUTES (ROLE = admin)
# =====================================================

@videos_bp.route("/admin", methods=["POST"])
def create_video():
    if not admin_required():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}

    required = ["title", "poster_url", "video_url"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    admin_id = get_jwt_identity()

    video = Video(
        title=data["title"],
        subtitle=data.get("subtitle"),
        description=data.get("description"),
        poster_url=data["poster_url"],
        video_url=data["video_url"],
        duration=data.get("duration"),
        aspect_ratio=data.get("aspect_ratio", "16:9"),
        type=data.get("type", "episode"),
        visibility=data.get("visibility", "private"),
        created_by=admin_id
    )

    db.session.add(video)
    db.session.commit()

    return jsonify(video.to_dict(admin_view=True)), 201


@videos_bp.route("/admin", methods=["GET"])
def get_all_videos_admin():
    if not admin_required():
        return jsonify({"error": "Admin access required"}), 403

    videos = (
        Video.query
        .order_by(Video.created_at.desc())
        .all()
    )

    return jsonify([v.to_dict(admin_view=True) for v in videos]), 200


@videos_bp.route("/admin/<uuid:video_id>", methods=["PUT"])
def update_video(video_id):
    if not admin_required():
        return jsonify({"error": "Admin access required"}), 403

    video = Video.query.get_or_404(video_id)
    data = request.get_json() or {}

    editable_fields = [
        "title",
        "subtitle",
        "description",
        "poster_url",
        "video_url",
        "duration",
        "aspect_ratio",
        "type",
        "visibility",
        "is_active"
    ]

    for field in editable_fields:
        if field in data:
            setattr(video, field, data[field])

    db.session.commit()

    return jsonify(video.to_dict(admin_view=True)), 200


@videos_bp.route("/admin/<uuid:video_id>", methods=["DELETE"])
def delete_video(video_id):
    if not admin_required():
        return jsonify({"error": "Admin access required"}), 403

    video = Video.query.get_or_404(video_id)

    video.is_active = False
    video.deleted_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"message": "Video soft-deleted"}), 200
