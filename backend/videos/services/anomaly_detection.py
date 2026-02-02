# backend/videos/services/anomaly_detection.py

# backend/videos/services/anomaly_detection.py

from statistics import mean, stdev
from typing import List, Dict


def detect_spike(
    *,
    values: List[int],
    window: int = 7,
    z_threshold: float = 2.5,
) -> Dict:
    """
    Generic spike detector using rolling z-score.

    Returns a dict describing the anomaly.
    """

    if len(values) < window + 1:
        return {"is_anomaly": False}

    baseline_values = values[-(window + 1):-1]
    current_value = values[-1]

    avg = mean(baseline_values)
    std = stdev(baseline_values) if len(baseline_values) > 1 else 0

    if std == 0:
        return {"is_anomaly": False}

    z = (current_value - avg) / std

    if z < z_threshold:
        return {"is_anomaly": False}

    delta_pct = ((current_value - avg) / avg) * 100 if avg > 0 else None

    return {
        "is_anomaly": True,
        "current": current_value,
        "baseline_avg": round(avg, 2),
        "std_dev": round(std, 2),
        "z_score": round(z, 2),
        "delta_pct": round(delta_pct, 1) if delta_pct is not None else None,
        "window": window,
    }


def detect_guest_surge(
    guest_views: List[int],
) -> Dict:
    """
    Opinionated wrapper for guest-view anomalies.
    """
    return detect_spike(
        values=guest_views,
        window=7,
        z_threshold=2.5,
    )
