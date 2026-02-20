# backend/admin/analytics/aurora_analytics.py

from collections import Counter
from sqlalchemy import func
from statistics import mean
from extensions import db
from aurora.models_session_summary import AuroraSessionSummary

from aurora.models_personality import AuroraPersonality
from aurora.models_memory import AuroraUserMemory
from aurora.relationship import get_or_create_relationship

from users.models import User


def compute_aurora_overview():

    total_users = db.session.query(func.count(User.id)).scalar() or 0
    total_sessions = db.session.query(func.count(AuroraSessionSummary.id)).scalar() or 0

    if total_sessions == 0:
        return {
            "total_users": total_users,
            "total_sessions": 0,
            "avg_engagement": 0.0,
            "risk_flag_rate": 0.0,
            "emotion_distribution": {},
            "top_themes": []
        }

    sessions = AuroraSessionSummary.query.all()

    # Engagement average
    engagement_values = [
        s.engagement_score for s in sessions if s.engagement_score is not None
    ]
    avg_engagement = sum(engagement_values) / max(1, len(engagement_values))

    # Risk rate
    risk_count = sum(1 for s in sessions if s.risk_flag)
    risk_rate = risk_count / max(1, total_sessions)

    # Emotion distribution
    emotion_counter = Counter(
        (s.dominant_emotion or "neutral").lower()
        for s in sessions
    )

    # Theme aggregation
    theme_counter = Counter()
    for s in sessions:
        if s.primary_themes:
            for theme in s.primary_themes:
                theme_counter[str(theme).lower()] += 1

    top_themes = theme_counter.most_common(8)

    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "avg_engagement": round(avg_engagement, 4),
        "risk_flag_rate": round(risk_rate, 4),
        "emotion_distribution": dict(emotion_counter),
        "top_themes": top_themes
    }

# ========================================
# 
# =======================================
def compute_user_aurora_snapshot(user_id, window=10):

    rel = get_or_create_relationship(user_id)
    personality = AuroraPersonality.query.filter_by(user_id=user_id).first()

    sessions = (
        AuroraSessionSummary.query
        .filter_by(user_id=user_id)
        .order_by(AuroraSessionSummary.created_at.desc())
        .limit(window)
        .all()
    )

    engagement_trend = [
        s.engagement_score for s in sessions if s.engagement_score is not None
    ]

    emotion_list = [
        (s.dominant_emotion or "neutral").lower()
        for s in sessions
    ]

    emotion_distribution = Counter(emotion_list)

    risk_sessions = [s for s in sessions if s.risk_flag]
    risk_count = len(risk_sessions)
    last_risk_date = (
        risk_sessions[0].created_at.isoformat()
        if risk_sessions else None
    )

    memories = AuroraUserMemory.query.filter_by(user_id=user_id).all()

    total_memories = len(memories)
    avg_confidence = (
        mean([m.confidence for m in memories]) if memories else 0.0
    )

    memory_counter = Counter(m.key for m in memories)
    strongest_memories = memory_counter.most_common(5)

    return {
        "relationship": rel.to_dict(),
        "personality": {
            "tone": personality.tone if personality else None,
            "verbosity": personality.verbosity if personality else None,
            "pace": personality.pace if personality else None,
            "directness": personality.directness if personality else None,
            "probing_depth": personality.probing_depth if personality else None,
            "adaptive_score": personality.adaptive_score if personality else None,
            "admin_notes": personality.admin_notes if personality else {},
        },
        "engagement_trend": engagement_trend,
        "emotion_distribution": dict(emotion_distribution),
        "risk_sessions": risk_count,
        "last_risk_date": last_risk_date,
        "memory_summary": {
            "total_memories": total_memories,
            "avg_confidence": round(avg_confidence, 4),
            "strongest_keys": strongest_memories,
        }
    }