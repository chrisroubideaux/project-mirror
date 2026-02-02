# backend/videos/services/csv_export.py
import csv
import io
from typing import List
from videos.models import AnalyticsAlert, VideoView
from sqlalchemy import cast, Date
from sqlalchemy.sql import func
from extensions import db


# ----------------------------------
# Alerts CSV
# ----------------------------------

def export_alerts_csv(admin_id: str) -> str:
    alerts = (
        AnalyticsAlert.query
        .filter(AnalyticsAlert.admin_id == admin_id)
        .order_by(AnalyticsAlert.created_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "id",
        "created_at",
        "severity",
        "alert_type",
        "title",
        "message",
        "ai_explanation",
        "video_id",
        "acknowledged_at",
    ])

    for a in alerts:
        writer.writerow([
            a.id,
            a.created_at.isoformat(),
            a.severity,
            a.alert_type,
            a.title,
            a.message,
            (a.payload or {}).get("ai_explanation"),
            a.video_id,
            a.acknowledged_at.isoformat() if a.acknowledged_at else "",
        ])

    return output.getvalue()


# ----------------------------------
# Per-video daily views CSV
# ----------------------------------

def export_video_views_csv(video_id):
    rows = (
        db.session.query(
            cast(VideoView.created_at, Date).label("date"),
            func.count(VideoView.id).label("total_views"),
            func.sum(
                func.case(
                    [(VideoView.user_id.is_(None), 1)],
                    else_=0
                )
            ).label("guest_views"),
        )
        .filter(VideoView.video_id == video_id)
        .group_by(cast(VideoView.created_at, Date))
        .order_by(cast(VideoView.created_at, Date))
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "date",
        "total_views",
        "guest_views",
        "member_views",
    ])

    for r in rows:
        member_views = r.total_views - r.guest_views
        writer.writerow([
            r.date.isoformat(),
            r.total_views,
            r.guest_views,
            member_views,
        ])

    return output.getvalue()

