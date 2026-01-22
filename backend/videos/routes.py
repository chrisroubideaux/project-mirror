# backend/videos/routes.py

from datetime import datetime
from flask import Blueprint, jsonify, request
from extensions import db
from .models import Video

# Auth decorators
from utils.decorators import token_required
from admin.decorators import admin_token_required

videos_bp = Blueprint(
    "videos",
    __name__,
    url_prefix="/api/videos"
)

# =====================================================
# PUBLIC ROUTES (GUESTS)
# - Guests can ONLY see trailers
# =====================================================

@videos_bp.route("", methods=["GET"])
def get_public_videos():
    videos = (
        Video.query
        .filter(
            Video.is_active.is_(True),
            Video.visibility == "public",
            Video.type == "trailer"      # 🔒 trailers only
        )
        .order_by(Video.created_at.desc())
        .all()
    )

    return jsonify([v.to_dict() for v in videos]), 200


# =====================================================
# GET VIDEO BY ID (PUBLIC)
# =====================================================

@videos_bp.route("/<uuid:video_id>", methods=["GET"])
def get_public_video(video_id):
    video = Video.query.get(video_id)

    if (
        not video
        or not video.is_active
        or video.visibility != "public"
        or video.type != "trailer"      # 🔒 trailers only
    ):
        return jsonify({"error": "Video not found"}), 404

    return jsonify(video.to_dict()), 200


# =====================================================
# MEMBER ROUTES (USER JWT)
# - Members can see trailers + full episodes
# =====================================================

@videos_bp.route("/member", methods=["GET"])
@token_required
def get_member_videos(current_user):
    videos = (
        Video.query
        .filter(
            Video.is_active.is_(True),
            Video.type.in_(["trailer", "episode"]),
            Video.visibility.in_(["public", "private"]),
        )
        .order_by(Video.created_at.desc())
        .all()
    )

    return jsonify([v.to_dict() for v in videos]), 200


# =====================================================
# GET VIDEO BY ID (MEMBER)
# =====================================================

@videos_bp.route("/member/<uuid:video_id>", methods=["GET"])
@token_required
def get_member_video(current_user, video_id):
    video = Video.query.get(video_id)

    if not video or not video.is_active:
        return jsonify({"error": "Video not found"}), 404

    if video.type not in ("trailer", "episode"):
        return jsonify({"error": "Access denied"}), 403

    return jsonify(video.to_dict()), 200


# =====================================================
# ADMIN ROUTES (ADMIN JWT ONLY)
# - Full control & visibility
# =====================================================

@videos_bp.route("/admin", methods=["POST"])
@admin_token_required
def create_video(current_admin):
    data = request.get_json() or {}

    required = ["title", "poster_url", "video_url"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing field: {field}"}), 400

    allowed_types = {"trailer", "episode", "intro", "demo", "test"}
    if data.get("type") and data["type"] not in allowed_types:
        return jsonify({"error": "Invalid video type"}), 400

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
        created_by=current_admin.id,
    )

    db.session.add(video)
    db.session.commit()

    return jsonify(video.to_dict(admin_view=True)), 201

# =====================================================
# GET ALL VIDEOS (ADMIN)
# =====================================================

@videos_bp.route("/admin", methods=["GET"])
@admin_token_required
def get_all_videos_admin(current_admin):
    videos = (
        Video.query
        .order_by(Video.created_at.desc())
        .all()
    )

    return jsonify([v.to_dict(admin_view=True) for v in videos]), 200


# =====================================================
# GET VIDEO BY ID (ADMIN)
# =====================================================

@videos_bp.route("/admin/<uuid:video_id>", methods=["GET"])
@admin_token_required
def get_video_admin(current_admin, video_id):
    video = Video.query.get(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404

    return jsonify(video.to_dict(admin_view=True)), 200


# =====================================================
# UPDATE VIDEO
# =====================================================

@videos_bp.route("/admin/<uuid:video_id>", methods=["PUT"])
@admin_token_required
def update_video(current_admin, video_id):
    video = Video.query.get(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404

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
        "is_active",
    ]

    for field in editable_fields:
        if field in data:
            setattr(video, field, data[field])

    video.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(video.to_dict(admin_view=True)), 200

# =====================================================
# DELETE VIDEO (SOFT DELETE)
# =====================================================

@videos_bp.route("/admin/<uuid:video_id>", methods=["DELETE"])
@admin_token_required
def delete_video(current_admin, video_id):
    video = Video.query.get(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404

    # Soft delete
    video.is_active = False
    video.deleted_at = datetime.utcnow()
    video.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"message": "Video soft-deleted"}), 200



"""""""""""""""""

from datetime import datetime
from flask import Blueprint, jsonify, request
from extensions import db
from .models import Video

# Auth decorators (YOUR custom JWT system)
from utils.decorators import token_required
from admin.decorators import admin_token_required


videos_bp = Blueprint(
    "videos",
    __name__,
    url_prefix="/api/videos"
)

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
# MEMBER ROUTES (USER JWT ONLY)
# - Users can see public + private videos.
# - Admins can use /admin endpoints instead.
# =====================================================

@videos_bp.route("/member", methods=["GET"])
@token_required
def get_member_videos(current_user):
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
@token_required
def get_member_video(current_user, video_id):
    video = Video.query.get(video_id)

    if not video or not video.is_active:
        return jsonify({"error": "Video not found"}), 404

    # Members can view public + private
    if video.visibility in ("public", "private"):
        return jsonify(video.to_dict()), 200

    return jsonify({"error": "Access denied"}), 403


# =====================================================
# ADMIN ROUTES (ADMIN JWT ONLY)
# =====================================================

@videos_bp.route("/admin", methods=["POST"])
@admin_token_required
def create_video(current_admin):
    data = request.get_json() or {}

    required = ["title", "poster_url", "video_url"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing field: {field}"}), 400

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
        created_by=current_admin.id,
    )

    db.session.add(video)
    db.session.commit()

    return jsonify(video.to_dict(admin_view=True)), 201


@videos_bp.route("/admin", methods=["GET"])
@admin_token_required
def get_all_videos_admin(current_admin):
    videos = (
        Video.query
        .order_by(Video.created_at.desc())
        .all()
    )

    return jsonify([v.to_dict(admin_view=True) for v in videos]), 200


@videos_bp.route("/admin/<uuid:video_id>", methods=["GET"])
@admin_token_required
def get_video_admin(current_admin, video_id):
    video = Video.query.get(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404
    return jsonify(video.to_dict(admin_view=True)), 200


@videos_bp.route("/admin/<uuid:video_id>", methods=["PUT"])
@admin_token_required
def update_video(current_admin, video_id):
    video = Video.query.get(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404

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
        "is_active",
    ]

    for field in editable_fields:
        if field in data:
            setattr(video, field, data[field])

    video.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(video.to_dict(admin_view=True)), 200


@videos_bp.route("/admin/<uuid:video_id>", methods=["DELETE"])
@admin_token_required
def delete_video(current_admin, video_id):
    video = Video.query.get(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404

    # Soft delete
    video.is_active = False
    video.deleted_at = datetime.utcnow()
    video.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"message": "Video soft-deleted"}), 200

"""""""""""""""""""""""""""""""""""""""""