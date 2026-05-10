from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from garminconnect import Garmin

if TYPE_CHECKING:
    from models import UserSettings

RUNNING_TYPE_KEYS = {"running", "trail_running", "treadmill_running", "track_running"}

PACE_IDLE_MIN_KM = 20.0
PACE_WALKING_MIN_KM = 10.0
PACE_FAST_MAX_MIN_KM = 4.0

# Run-type classification thresholds
INTERVAL_MIN_FAST_SPLITS = 2  # minimum fast splits to consider an interval pattern
INTERVAL_ALT_RATIO = 0.60  # 60% of fast/recovery transitions must alternate
HILLS_ELEV_PER_KM_THRESHOLD = 30.0  # m/km elevation on fast splits → hills (~3% grade)
TEMPO_MIN_FAST_FRACTION = 0.15  # fast splits must be ≥15% of total distance → tempo
LONG_RUN_MIN_KM = 12.0  # total distance threshold for "long"


def classify_split(
    pace_min_km: float | None,
    settings: UserSettings | None = None,
) -> str:
    idle_min = settings.pace_idle_min_km if settings else PACE_IDLE_MIN_KM
    walking_min = settings.pace_walking_min_km if settings else PACE_WALKING_MIN_KM
    fast_max = settings.pace_fast_max_min_km if settings else PACE_FAST_MAX_MIN_KM
    if pace_min_km is None or pace_min_km > idle_min:
        return "idle"
    if pace_min_km > walking_min:
        return "walking"
    if pace_min_km < fast_max:
        return "fast"
    return "running"


def _has_alternating_pattern(
    active: list[dict],
    recov_types: set[str],
    min_fast_splits: int,
    alt_ratio: float,
) -> bool:
    """Return True if splits show a meaningful fast<->recovery alternating pattern."""
    groups: list[str] = []
    for s in active:
        t = s.get("split_type")
        if t == "fast":
            simplified = "fast"
        elif t in recov_types:
            simplified = "recovery"
        else:
            simplified = "run"
        if not groups or groups[-1] != simplified:
            groups.append(simplified)

    fr_groups = [g for g in groups if g in ("fast", "recovery")]
    min_groups = 2 * min_fast_splits - 1
    if len(fr_groups) < min_groups:
        return False

    transitions = sum(
        1 for i in range(len(fr_groups) - 1) if fr_groups[i] != fr_groups[i + 1]
    )
    max_possible = len(fr_groups) - 1
    return max_possible > 0 and (transitions / max_possible) >= alt_ratio


def classify_run_type(
    splits: list[dict],
    settings: UserSettings | None = None,
) -> str:
    """Classify a run into one of: hills, sprints, tempo, long, easy.

    Priority: hills > sprints > tempo > long > easy.

    Args:
        splits: list of split dicts with keys split_type, distance_km,
                elevation_gain_m (as returned by fetch_splits or DB queries).
        settings: optional per-user thresholds; falls back to module constants.
    """
    s = settings
    min_fast = s.interval_min_fast_splits if s else INTERVAL_MIN_FAST_SPLITS
    alt_ratio = s.interval_alt_ratio if s else INTERVAL_ALT_RATIO
    hills_threshold = (
        s.hills_elev_per_km_threshold if s else HILLS_ELEV_PER_KM_THRESHOLD
    )
    tempo_fraction = s.tempo_min_fast_fraction if s else TEMPO_MIN_FAST_FRACTION
    long_min = s.long_run_min_km if s else LONG_RUN_MIN_KM

    active = [s for s in splits if s.get("split_type") is not None]
    if not active:
        return "easy"

    recov_types: set[str] = {"idle", "walking"}
    fast_splits = [s for s in active if s.get("split_type") == "fast"]
    fast_count = len(fast_splits)
    total_dist_km = sum(s.get("distance_km") or 0.0 for s in active)

    has_interval = fast_count >= min_fast and _has_alternating_pattern(
        active, recov_types, min_fast, alt_ratio
    )
    if has_interval:
        fast_dist = sum(s.get("distance_km") or 0.0 for s in fast_splits)
        fast_elev = sum(s.get("elevation_gain_m") or 0.0 for s in fast_splits)
        avg_elev_per_km = fast_elev / fast_dist if fast_dist > 0 else 0.0
        if avg_elev_per_km >= hills_threshold:
            return "hills"
        return "sprints"

    if fast_count >= 1:
        fast_dist = sum(s.get("distance_km") or 0.0 for s in fast_splits)
        if total_dist_km > 0 and fast_dist / total_dist_km >= tempo_fraction:
            return "tempo"

    if total_dist_km >= long_min:
        return "long"

    return "easy"


def login(email: str, password: str) -> Garmin:
    client = Garmin(email=email, password=password)
    client.login()
    return client


def fetch_activities(client: Garmin, since: date) -> list[dict]:
    today = date.today().isoformat()
    activities = client.get_activities_by_date(
        since.isoformat(), today, activitytype="running"
    )
    return [
        a
        for a in activities
        if a.get("activityType", {}).get("typeKey") in RUNNING_TYPE_KEYS
    ]


def fetch_splits(
    client: Garmin,
    garmin_activity_id: str,
    settings: UserSettings | None = None,
) -> list[dict]:
    raw = client.get_activity_splits(garmin_activity_id)
    laps = raw.get("lapDTOs", [])
    splits = []
    for i, lap in enumerate(laps, 1):
        pace = pace_from_speed(lap.get("averageSpeed"))
        splits.append(
            {
                "split_number": i,
                "distance_km": round(lap.get("distance", 0) / 1000, 3),
                "duration_min": round(lap.get("duration", 0) / 60, 2),
                "pace_min_km": pace,
                "avg_hr": lap.get("averageHR"),
                "elevation_gain_m": lap.get("elevationGain"),
                "split_type": classify_split(pace, settings=settings),
            }
        )
    return splits


def normalize_activity(raw: dict) -> dict:
    distance = raw.get("distance")
    duration = raw.get("duration")
    return {
        "garmin_id": str(raw["activityId"]),
        "name": raw.get("activityName", "Untitled"),
        "date": raw.get("startTimeLocal", ""),
        "distance_km": round(distance / 1000, 2) if distance else None,
        "duration_min": round(duration / 60, 2) if duration else None,
        "avg_hr": raw.get("averageHR"),
        "max_hr": raw.get("maxHR"),
        "avg_pace_min_km": pace_from_speed(raw.get("averageSpeed")),
        "elevation_gain_m": raw.get("elevationGain"),
    }


def pace_from_speed(speed_ms: float | None) -> float | None:
    if not speed_ms or speed_ms <= 0:
        return None
    return round(1000 / speed_ms / 60, 2)
