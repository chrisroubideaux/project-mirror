# backend/services/datetime_context.py

from datetime import datetime
from zoneinfo import ZoneInfo

# Default timezone for Aurora
DEFAULT_TZ = "America/Chicago"


def get_time_context(timezone: str = DEFAULT_TZ) -> dict:
    """
    Returns friendly time context for use in Aurora's system prompt.

    Output example:
    {
        "time_of_day": "evening",
        "day_name": "Tuesday",
        "month_name": "December",
        "date": 2,
        "full_date": "December 02, 2025",
        "full_time": "07:42 PM",
        "hour": 19,
        "is_weekend": False
    }

    This supports therapist-like, situational awareness in Aurora’s tone.
    """

    # Safely handle timezone
    try:
        now = datetime.now(ZoneInfo(timezone))
    except Exception:
        now = datetime.now()

    hour = now.hour

    # Broad time-of-day classification
    if 5 <= hour < 12:
        period = "morning"
    elif 12 <= hour < 17:
        period = "afternoon"
    elif 17 <= hour < 21:
        period = "evening"
    else:
        period = "night"

    day_name = now.strftime("%A")
    month_name = now.strftime("%B")
    day_number = now.day
    full_date = now.strftime("%B %d, %Y")
    full_time = now.strftime("%I:%M %p")
    is_weekend = day_name in ("Saturday", "Sunday")

    return {
        "time_of_day": period,
        "day_name": day_name,
        "month_name": month_name,
        "date": day_number,
        "full_date": full_date,
        "full_time": full_time,
        "hour": hour,
        "is_weekend": is_weekend,
    }
