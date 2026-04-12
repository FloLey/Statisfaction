from __future__ import annotations

from datetime import date

from garminconnect import Garmin

RUNNING_TYPE_KEYS = {"running", "trail_running", "treadmill_running", "track_running"}


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


def fetch_splits(client: Garmin, garmin_activity_id: str) -> list[dict]:
    raw = client.get_activity_splits(garmin_activity_id)
    laps = raw.get("lapDTOs", [])
    splits = []
    for i, lap in enumerate(laps, 1):
        splits.append(
            {
                "split_number": i,
                "distance_km": round(lap.get("distance", 0) / 1000, 3),
                "duration_min": round(lap.get("duration", 0) / 60, 2),
                "pace_min_km": pace_from_speed(lap.get("averageSpeed")),
                "avg_hr": lap.get("averageHR"),
                "elevation_gain_m": lap.get("elevationGain"),
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
