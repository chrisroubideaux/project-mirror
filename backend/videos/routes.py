# backend/videos/routes.py

from datetime import datetime
from flask import Blueprint, jsonify, request, current_app
from extensions import db, limiter
from .models import Video, VideoView
from sqlalchemy import func, cast, Date
import jwt
from time import time
from flask import request


# -------------------------------------
# Simple in-memory view throttle
# key = (ip, video_id)
# value = timestamp
# -------------------------------------

VIEW_THROTTLE_SECONDS = 30
view_throttle_cache = {}

# Auth decorators
from utils.decorators import token_required
from admin.decorators import admin_token_required

videos_bp = Blueprint(
    "videos",
    __name__,
    url_prefix="/api/videos"
)

# =====================================================
# Per-view analytics (NEW)
# =====================================================

def _get_optional_user_id_from_bearer():
    """
    If Authorization: Bearer <token> exists and is valid, return user_id as UUID string.
    If missing/invalid -> return None (guest).
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None

    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None

    try:
        # Adjust this if your app uses a different config key name
        secret = (
            current_app.config.get("SECRET_KEY")
            or current_app.config.get("DB_SECRET_KEY")
        )
        if not secret:
            return None

        payload = jwt.decode(token, secret, algorithms=["HS256"])

        # Common patterns: "user_id" or "sub"
        user_id = payload.get("user_id") or payload.get("sub")
        return str(user_id) if user_id else None
    except Exception:
        return None


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
        "series_avatar_url",
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

# =====================================================
# REGISTER VIDEO VIEW
# =====================================================
@videos_bp.route("/<uuid:video_id>/view", methods=["POST"])
def register_view(video_id):
    video = Video.query.get(video_id)

    if not video or not video.is_active:
        return jsonify({"error": "Video not found"}), 404

    # ---------------------------
    # Throttle by IP + video_id
    # ---------------------------
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    now = time()
    key = (ip, str(video_id))

    last_view = view_throttle_cache.get(key)
    if last_view and (now - last_view) < VIEW_THROTTLE_SECONDS:
        return jsonify({"ok": True, "throttled": True}), 200

    view_throttle_cache[key] = now

    # ---------------------------
    # Optional user capture
    # ---------------------------
    user_id = _get_optional_user_id_from_bearer()  # None = guest

    # ---------------------------
    # Persist: event row + counter
    # ---------------------------
    db.session.add(VideoView(
        video_id=video.id,
        user_id=user_id,         # NULL = guest
        ip_address=ip,
        created_at=datetime.utcnow(),
    ))

    video.view_count = (video.view_count or 0) + 1
    video.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"ok": True, "throttled": False}), 200


# =====================================================
# ADMIN ANALYTICS — TOP VIDEOS
# =====================================================

@videos_bp.route("/admin/top", methods=["GET"])
@admin_token_required
def get_top_videos(current_admin):
    limit = request.args.get("limit", 10, type=int)

    videos = (
        Video.query
        .filter(Video.is_active.is_(True))
        .order_by(Video.view_count.desc())
        .limit(limit)
        .all()
    )

    return jsonify([
        v.to_dict(admin_view=True) for v in videos
    ]), 200

# =====================================================
# ADMIN ANALYTICS — RECENT ACTIVITY
# =====================================================

@videos_bp.route("/admin/recent", methods=["GET"])
@admin_token_required
def get_recent_videos(current_admin):
    limit = request.args.get("limit", 10, type=int)

    videos = (
        Video.query
        .filter(Video.is_active.is_(True))
        .order_by(Video.updated_at.desc())
        .limit(limit)
        .all()
    )

    return jsonify([
        v.to_dict(admin_view=True) for v in videos
    ]), 200
    
    
# =====================================================
# ADMIN ANALYTICS — PLATFORM STATS
# =====================================================

@videos_bp.route("/admin/stats", methods=["GET"])
@admin_token_required
def get_video_stats(current_admin):
    total_videos = Video.query.count()
    active_videos = Video.query.filter(Video.is_active.is_(True)).count()

    total_views = (
        db.session.query(
            db.func.coalesce(db.func.sum(Video.view_count), 0)
        ).scalar()
    )

    top_video = (
        Video.query
        .filter(Video.is_active.is_(True))
        .order_by(Video.view_count.desc())
        .first()
    )

    avg_views = (
        round(total_views / active_videos, 2)
        if active_videos > 0
        else 0
    )

    return jsonify({
        "total_videos": total_videos,
        "active_videos": active_videos,
        "total_views": total_views,
        "average_views_per_video": avg_views,
        "most_viewed_video": (
            top_video.to_dict(admin_view=True)
            if top_video else None
        ),
    }), 200
    
    
# =====================================================
# ADMIN ANALYTICS — VIEWS OVER TIME (DAILY)
# =====================================================

@videos_bp.route("/admin/views/daily", methods=["GET"])
@admin_token_required
def get_views_daily(current_admin):
    results = (
        db.session.query(
            cast(Video.updated_at, Date).label("date"),
            func.sum(Video.view_count).label("views"),
        )
        .filter(Video.is_active.is_(True))
        .group_by(cast(Video.updated_at, Date))
        .order_by(cast(Video.updated_at, Date))
        .all()
    )

    return jsonify([
        {
            "date": r.date.isoformat(),
            "views": int(r.views or 0),
        }
        for r in results
    ]), 200
# =====================================================
# ADMIN ANALYTICS — VIEWS OVER TIME (WEEKLY)
# =====================================================

@videos_bp.route("/admin/views/weekly", methods=["GET"])
@admin_token_required
def get_views_weekly(current_admin):
    results = (
        db.session.query(
            func.date_trunc("week", Video.updated_at).label("week"),
            func.sum(Video.view_count).label("views"),
        )
        .filter(Video.is_active.is_(True))
        .group_by(func.date_trunc("week", Video.updated_at))
        .order_by(func.date_trunc("week", Video.updated_at))
        .all()
    )

    return jsonify([
        {
            "week": r.week.date().isoformat(),
            "views": int(r.views or 0),
        }
        for r in results
    ]), 200
    
    
# =====================================================
# ADMIN ANALYTICS — VIEWS OVER TIME (WEEKLY, EVENT-BASED)
# =====================================================

@videos_bp.route("/admin/views/weekly/events", methods=["GET"])
@admin_token_required
@limiter.exempt
def get_views_weekly_events(current_admin):
    """
    Weekly total views across the platform (true event data).
    """
    weeks = request.args.get("weeks", 12, type=int)

    results = (
        db.session.query(
            func.date_trunc("week", VideoView.created_at).label("week"),
            func.count(VideoView.id).label("views"),
        )
        .group_by(func.date_trunc("week", VideoView.created_at))
        .order_by(func.date_trunc("week", VideoView.created_at).desc())
        .limit(weeks)
        .all()
    )

    results = list(reversed(results))  # chart-friendly order

    return jsonify([
        {
            "week": r.week.date().isoformat(),
            "views": int(r.views),
        }
        for r in results
    ]), 200
# =====================================================
# ADMIN ANALYTICS — PER VIDEO SUMMARY
# =====================================================

@videos_bp.route("/admin/video/<uuid:video_id>/analytics", methods=["GET"])
@admin_token_required
@limiter.exempt
def get_video_analytics(current_admin, video_id):
    video = Video.query.get(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404

    total_views = (
        db.session.query(func.count(VideoView.id))
        .filter(VideoView.video_id == video.id)
        .scalar()
    ) or 0

    guest_views = (
        db.session.query(func.count(VideoView.id))
        .filter(
            VideoView.video_id == video.id,
            VideoView.user_id.is_(None)
        )
        .scalar()
    ) or 0

    return jsonify({
        "video": video.to_dict(admin_view=True),
        "total_views": total_views,
        "guest_views": guest_views,
        "member_views": total_views - guest_views,
    }), 200
# =====================================================
# ADMIN ANALYTICS — PER VIDEO VIEWS (DAILY)
# =====================================================

@videos_bp.route("/admin/video/<uuid:video_id>/views/daily", methods=["GET"])
@admin_token_required
@limiter.exempt
def get_video_views_daily(current_admin, video_id):
    days = request.args.get("days", 30, type=int)

    results = (
        db.session.query(
            cast(VideoView.created_at, Date).label("date"),
            func.count(VideoView.id).label("views"),
        )
        .filter(VideoView.video_id == video_id)
        .group_by(cast(VideoView.created_at, Date))
        .order_by(cast(VideoView.created_at, Date).desc())
        .limit(days)
        .all()
    )

    results = list(reversed(results))

    return jsonify([
        {"date": r.date.isoformat(), "views": int(r.views)}
        for r in results
    ]), 200

    
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