# backend/videos/routes.py

from datetime import datetime
from time import time

from flask import Blueprint, jsonify, request, current_app, Response
from sqlalchemy import func, cast, Date
from sqlalchemy.sql import case
from sqlalchemy.exc import IntegrityError
import jwt
import uuid
from sqlalchemy import text  # ⬅️ add this import at the top if missing
from extensions import db, limiter
from .models import Video, VideoView, VideoReaction, VideoShare, AnalyticsAlert

from videos.services.analytics_alerts import create_analytics_alert
from videos.services.anomaly_detection import detect_guest_surge
from videos.services.ai_explanations import generate_alert_explanation
from videos.services.csv_export import export_alerts_csv

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

from videos.services.csv_export import (
    export_alerts_csv,
    export_video_views_csv,
)

# =====================================================
# Per-view analytics (NEW)
# =====================================================

def _get_optional_user_id_from_bearer():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None

    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None

    try:
        payload = jwt.decode(
            token,
            current_app.config["JWT_SECRET_KEY"],  # ✅ CORRECT KEY
            algorithms=["HS256"],
        )

        # flask-jwt-extended uses "sub"
        return payload.get("sub")

    except Exception as e:
        current_app.logger.warning(f"JWT decode failed: {e}")
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
    """"""""""""""""""""""
    total views across the platform (true event data).
    """""""""""""""""""""""
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

    
# =====================================================
# ADMIN ANALYTICS — PER VIDEO VIEWS (DAILY, STACKED)
# =====================================================


@videos_bp.route(
    "/admin/video/<uuid:video_id>/views/daily/stacked",
    methods=["GET"]
)
@admin_token_required
def get_video_views_daily_stacked(current_admin, video_id):
   

    days = request.args.get("days", 30, type=int)

    # ----------------------------------
    # Query: daily guest vs member counts
    # ----------------------------------
    rows = (
        db.session.query(
            cast(VideoView.created_at, Date).label("date"),
            func.sum(
                case(
                    (VideoView.user_id.is_(None), 1),
                    else_=0
                )
            ).label("guest_views"),
            func.sum(
                case(
                    (VideoView.user_id.isnot(None), 1),
                    else_=0
                )
            ).label("member_views"),
        )
        .filter(VideoView.video_id == video_id)
        .group_by(cast(VideoView.created_at, Date))
        .order_by(cast(VideoView.created_at, Date).desc())
        .limit(days)
        .all()
    )

    # chart-friendly order
    rows = list(reversed(rows))

    result = [
        {
            "date": r.date.isoformat(),
            "guest": int(r.guest_views or 0),
            "member": int(r.member_views or 0),
        }
        for r in rows
    ]

    # ----------------------------------
    # Anomaly detection (SAFE)
    # ----------------------------------
    try:
        guest_series = [r["guest"] for r in result]

        anomaly = detect_guest_surge(guest_series)

        if anomaly.get("is_anomaly"):
            payload = {
                "video_id": str(video_id),
                "metric": "guest_views",
                "current": anomaly["current"],
                "baseline_avg": anomaly["baseline_avg"],
                "delta_pct": anomaly["delta_pct"],
                "window_days": anomaly["window"],
            }

            explanation = generate_alert_explanation(payload)

            create_analytics_alert(
                admin_id=current_admin.id,
                video_id=video_id,
                alert_type="guest_surge",
                severity="warning",
                title="Guest View Spike Detected",
                message=explanation,
                payload={
                    **payload,
                    "ai_explanation": explanation,
                },
            )

    except Exception as e:
        current_app.logger.error(
            f"Guest surge detection failed for video {video_id}: {e}"
        )

    return jsonify(result), 200


    
# =====================================================
# ADMIN ANALYTICS — PER VIDEO VIEWS (WEEKLY)
# =====================================================

@videos_bp.route("/admin/video/<uuid:video_id>/views/weekly", methods=["GET"])
@admin_token_required
@limiter.exempt
def get_video_views_weekly(current_admin, video_id):
    weeks = request.args.get("weeks", 12, type=int)

    results = (
        db.session.query(
            func.date_trunc("week", VideoView.created_at).label("week"),
            func.count(VideoView.id).label("views"),
        )
        .filter(VideoView.video_id == video_id)
        .group_by(func.date_trunc("week", VideoView.created_at))
        .order_by(func.date_trunc("week", VideoView.created_at).desc())
        .limit(weeks)
        .all()
    )

    results = list(reversed(results))

    return jsonify([
        {
            "week": r.week.date().isoformat(),
            "views": int(r.views),
        }
        for r in results
    ]), 200
    
# ==============================
# 
# ==============================    
    
    
@videos_bp.route("/admin/alerts", methods=["GET"])
@admin_token_required
def list_alerts(current_admin):
    limit = request.args.get("limit", 50, type=int)
    unread_only = request.args.get("unread", "0") == "1"

    q = AnalyticsAlert.query.filter(AnalyticsAlert.admin_id == current_admin.id)

    if unread_only:
        q = q.filter(AnalyticsAlert.acknowledged_at.is_(None))

    alerts = q.order_by(AnalyticsAlert.created_at.desc()).limit(limit).all()
    return jsonify([a.to_dict() for a in alerts]), 200

# =================================
# 
# =================================
@videos_bp.route("/admin/alerts", methods=["POST"])
@admin_token_required
def create_alert(current_admin):
    data = request.get_json() or {}

    alert, deduped = create_analytics_alert(
        admin_id=current_admin.id,
        video_id=data.get("video_id"),
        alert_type=data.get("alert_type", "generic"),
        severity=data.get("severity", "info"),
        title=data.get("title"),
        message=data.get("message"),
        payload=data.get("payload"),
    )

    return jsonify({
        "ok": True,
        "deduped": deduped,
        "alert": alert.to_dict(),
    }), 200 if deduped else 201


"""""""""""""""""""""""""""""""""
@videos_bp.route("/admin/alerts", methods=["POST"])
@admin_token_required
def create_alert(current_admin):
    data = request.get_json() or {}

    # simple validation
    title = data.get("title") or "Analytics Alert"
    message = data.get("message") or ""
    alert_type = data.get("alert_type") or "generic"
    severity = data.get("severity") or "info"
    video_id = data.get("video_id")  # optional

    # ✅ Deduping: if same type+video in last X minutes, ignore
    dedupe_minutes = 30
    since = datetime.utcnow() - timedelta(minutes=dedupe_minutes)

    exists = (
        AnalyticsAlert.query
        .filter(
            AnalyticsAlert.admin_id == current_admin.id,
            AnalyticsAlert.alert_type == alert_type,
            AnalyticsAlert.video_id == video_id if video_id else AnalyticsAlert.video_id.is_(None),
            AnalyticsAlert.created_at >= since,
        )
        .first()
    )
    if exists:
        return jsonify({"ok": True, "deduped": True, "alert": exists.to_dict()}), 200

    alert = AnalyticsAlert(
        admin_id=current_admin.id,
        video_id=video_id,
        alert_type=alert_type,
        severity=severity,
        title=title,
        message=message,
        payload=data.get("payload"),
    )
    db.session.add(alert)
    db.session.commit()

    return jsonify({"ok": True, "deduped": False, "alert": alert.to_dict()}), 201
"""""""""""""""""""""""""""""""""""
# ====================================
# 
# ====================================

@videos_bp.route("/admin/alerts/<uuid:alert_id>/ack", methods=["POST"])
@admin_token_required
def ack_alert(current_admin, alert_id):
    alert = AnalyticsAlert.query.get(alert_id)
    if not alert or alert.admin_id != current_admin.id:
        return jsonify({"error": "Not found"}), 404

    alert.acknowledged_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"ok": True, "alert": alert.to_dict()}), 200

# ====================================
# Csv export alerts
# ====================================

@videos_bp.route("/admin/alerts/export", methods=["GET"])
@admin_token_required
def export_alerts(current_admin):
    csv_data = export_alerts_csv(current_admin.id)

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=alerts.csv"
        },
    )
    
# ====================================
# Create Reel
# ====================================

@videos_bp.route("/admin/reels", methods=["POST"])
@admin_token_required
def create_reel(current_admin):
    data = request.get_json() or {}

    required = ["title", "poster_url", "video_url"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing field: {field}"}), 400

    reel = Video(
        title=data["title"],
        subtitle=data.get("subtitle"),
        description=data.get("description"),
        poster_url=data["poster_url"],
        video_url=data["video_url"],
        duration=data.get("duration"),
        aspect_ratio=data.get("aspect_ratio", "9:16"),
        visibility=data.get("visibility", "public"),
        is_reel=True,                      # 🔒 FORCE REEL
        created_by=current_admin.id,
    )

    db.session.add(reel)
    db.session.commit()

    return jsonify(reel.to_dict(admin_view=True)), 201

# ====================================
# Get all Reels
# ===================================

@videos_bp.route("/admin/reels", methods=["GET"])
@admin_token_required
def get_all_reels_admin(current_admin):
    reels = (
        Video.query
        .filter(Video.is_reel.is_(True))
        .order_by(Video.created_at.desc())
        .all()
    )

    return jsonify([r.to_dict(admin_view=True) for r in reels]), 200

# ===================================
# Get Reel by ID
# =================================

@videos_bp.route("/admin/reels/<uuid:video_id>", methods=["GET"])
@admin_token_required
def get_reel_admin(current_admin, video_id):
    reel = Video.query.get(video_id)

    if not reel or not reel.is_reel:
        return jsonify({"error": "Reel not found"}), 404

    return jsonify(reel.to_dict(admin_view=True)), 200

# ====================================
# Admin Update Reel
# ===================================

@videos_bp.route("/admin/reels/<uuid:video_id>", methods=["PUT"])
@admin_token_required
def update_reel(current_admin, video_id):
    reel = Video.query.get(video_id)

    if not reel or not reel.is_reel:
        return jsonify({"error": "Reel not found"}), 404

    data = request.get_json() or {}

    editable_fields = [
        "title",
        "subtitle",
        "description",
        "poster_url",
        "video_url",
        "duration",
        "aspect_ratio",
        "visibility",
        "is_active",
    ]

    for field in editable_fields:
        if field in data:
            setattr(reel, field, data[field])

    reel.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(reel.to_dict(admin_view=True)), 200


# ===================================
# Delete Reel (soft delete)
# ==================================

@videos_bp.route("/admin/reels/<uuid:video_id>", methods=["DELETE"])
@admin_token_required
def delete_reel(current_admin, video_id):
    reel = Video.query.get(video_id)

    if not reel or not reel.is_reel:
        return jsonify({"error": "Reel not found"}), 404

    reel.is_active = False
    reel.deleted_at = datetime.utcnow()
    reel.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"message": "Reel soft-deleted"}), 200


# ====================================
# Reactions to videos
# ===================================

@videos_bp.route("/<uuid:video_id>/react", methods=["POST"])
@token_required
def react_to_video(current_user, video_id):
    data = request.get_json() or {}
    reaction = data.get("reaction")  # "like" | "dislike"

    if reaction not in ("like", "dislike"):
        return jsonify({"error": "Invalid reaction"}), 400

    video = Video.query.get(video_id)
    if not video or not video.is_active:
        return jsonify({"error": "Video not found"}), 404

    existing = VideoReaction.query.filter_by(
        video_id=video.id,
        user_id=current_user.id
    ).first()

    try:
        if existing:
            # Same reaction → remove (toggle off)
            if existing.reaction == reaction:
                db.session.delete(existing)
                if reaction == "like":
                    video.like_count = max(0, video.like_count - 1)
            else:
                # Switch reaction
                if existing.reaction == "like":
                    video.like_count = max(0, video.like_count - 1)
                if reaction == "like":
                    video.like_count += 1

                existing.reaction = reaction
        else:
            new_reaction = VideoReaction(
                video_id=video.id,
                user_id=current_user.id,
                reaction=reaction,
            )
            db.session.add(new_reaction)
            if reaction == "like":
                video.like_count += 1

        video.updated_at = datetime.utcnow()
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Reaction conflict"}), 409

    return jsonify({
        "ok": True,
        "reaction": reaction,
        "like_count": video.like_count,
    }), 200

# ===================================
# User share video
# ==================================
@videos_bp.route("/<uuid:video_id>/reaction", methods=["GET"])
@token_required
def get_user_reaction(current_user, video_id):
    reaction = VideoReaction.query.filter_by(
        video_id=video_id,
        user_id=current_user.id
    ).first()

    return jsonify({
        "reaction": reaction.reaction if reaction else None
    }), 200

# ===================================
# Guest share video
# =================================
@videos_bp.route("/<uuid:video_id>/share", methods=["POST"])
def share_video(video_id):
    video = Video.query.get(video_id)
    if not video or not video.is_active:
        return jsonify({"error": "Video not found"}), 404

    user_id = _get_optional_user_id_from_bearer()

    db.session.add(VideoShare(
        video_id=video.id,
        user_id=user_id,
        created_at=datetime.utcnow(),
    ))

    db.session.commit()

    return jsonify({"ok": True}), 200


# ====================================
# Guest Reels 
# ====================================

@videos_bp.route("/reels", methods=["GET"])
def get_reels():
    limit = request.args.get("limit", 20, type=int)

    videos = (
        Video.query
        .filter(
            Video.is_active.is_(True),
            Video.visibility == "public",
            Video.is_reel.is_(True),
        )
        .order_by(Video.created_at.desc())
        .limit(limit)
        .all()
    )

    return jsonify([v.to_dict() for v in videos]), 200

# ==================================
# Get Reel by ID
# ==================================

@videos_bp.route("/reels/<uuid:video_id>", methods=["GET"])
def get_reel(video_id):
    video = Video.query.get(video_id)

    if (
        not video
        or not video.is_active
        or not video.is_reel
        or video.visibility != "public"
    ):
        return jsonify({"error": "Reel not found"}), 404

    return jsonify(video.to_dict()), 200


# ==================================
# React to Reel
# ==================================

@videos_bp.route("/reels/<uuid:video_id>/react", methods=["POST"])
@token_required
def react_to_reel(current_user, video_id):
    video = Video.query.get(video_id)

    if not video or not video.is_active or not video.is_reel:
        return jsonify({"error": "Reel not found"}), 404

    data = request.get_json() or {}
    reaction = data.get("reaction")

    if reaction not in ("like", "dislike"):
        return jsonify({"error": "Invalid reaction"}), 400

    existing = VideoReaction.query.filter_by(
        video_id=video.id,
        user_id=current_user.id
    ).first()

    if existing:
        if existing.reaction == reaction:
            db.session.delete(existing)
            if reaction == "like":
                video.like_count = max(0, video.like_count - 1)
        else:
            if existing.reaction == "like":
                video.like_count = max(0, video.like_count - 1)
            if reaction == "like":
                video.like_count += 1
            existing.reaction = reaction
    else:
        db.session.add(VideoReaction(
            video_id=video.id,
            user_id=current_user.id,
            reaction=reaction,
        ))
        if reaction == "like":
            video.like_count += 1

    video.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "ok": True,
        "reaction": reaction,
        "like_count": video.like_count,
    }), 
    
#  ==================================
# Get Reel reaction
# ==================================  
    
    
@videos_bp.route("/reels/<uuid:video_id>/reaction", methods=["GET"])
@token_required
def get_reel_reaction(current_user, video_id):
    reaction = VideoReaction.query.filter_by(
        video_id=video_id,
        user_id=current_user.id
    ).first()

    return jsonify({
        "reaction": reaction.reaction if reaction else None
    }), 200

# ==================================
# Share Reel
# ==================================


@videos_bp.route("/reels/<uuid:video_id>/share", methods=["POST"])
def share_reel(video_id):
    video = Video.query.get(video_id)

    if not video or not video.is_active or not video.is_reel:
        return jsonify({"error": "Reel not found"}), 404

    user_id = _get_optional_user_id_from_bearer()

    db.session.add(VideoShare(
        video_id=video.id,
        user_id=user_id,
        created_at=datetime.utcnow(),
    ))

    db.session.commit()

    return jsonify({"ok": True}), 200




@videos_bp.route("/member/reels", methods=["GET"])
@token_required
def get_member_reels(current_user):
    limit = request.args.get("limit", 20, type=int)

    videos = (
        Video.query
        .filter(
            Video.is_active.is_(True),
            Video.is_reel.is_(True),
            Video.visibility.in_(["public", "private"]),
        )
        .order_by(Video.created_at.desc())
        .limit(limit)
        .all()
    )

    return jsonify([v.to_dict() for v in videos]), 200

# =====================================================
# USER WATCH HISTORY
# =====================================================

@videos_bp.route("/history", methods=["GET"])
@token_required
def get_watch_history(current_user):
    

    # ----------------------------------
    # Subquery: latest view per video
    # ----------------------------------
    latest_views = (
        db.session.query(
            VideoView.video_id.label("video_id"),
            func.max(VideoView.created_at).label("last_viewed_at"),
        )
        .filter(
            VideoView.user_id == current_user.id  # ✅ UUID == UUID
        )
        .group_by(VideoView.video_id)
        .subquery()
    )

    # ----------------------------------
    # Join back to videos
    # ----------------------------------
    videos = (
        db.session.query(Video)
        .join(
            latest_views,
            Video.id == latest_views.c.video_id,
        )
        .filter(
            Video.is_active.is_(True)
        )
        .order_by(
            latest_views.c.last_viewed_at.desc()
        )
        .all()
    )

    return jsonify([video.to_dict() for video in videos]), 200

# =====================================================
@videos_bp.route("/member/<uuid:video_id>/view", methods=["POST"])
@token_required
def register_member_view(current_user, video_id):
    video = Video.query.get(video_id)
    if not video or not video.is_active:
        return jsonify({"error": "Video not found"}), 404

    db.session.add(VideoView(
        video_id=video.id,
        user_id=current_user.id,  # 🔑 THIS IS WHAT HISTORY NEEDS
        ip_address=request.remote_addr,
        created_at=datetime.utcnow(),
    ))

    video.view_count = (video.view_count or 0) + 1
    video.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"ok": True}), 200



@videos_bp.route("/admin/dev/clear-video-views", methods=["DELETE"])
@admin_token_required
def clear_video_views_dev(current_admin):
    db.session.execute(text("DELETE FROM video_views"))
    db.session.commit()
    return jsonify({"ok": True}), 200