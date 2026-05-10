from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str


class UserRead(BaseModel):
    id: int
    name: str
    email: str
    created_at: str


class SyncRequest(BaseModel):
    password: str


class SyncResponse(BaseModel):
    synced: int
    total: int


class SplitRead(BaseModel):
    split_number: int
    distance_km: float | None
    duration_min: float | None
    pace_min_km: float | None
    avg_hr: int | None
    elevation_gain_m: float | None
    split_type: str | None


class ActivitySummary(BaseModel):
    id: int
    user_id: int
    garmin_id: str
    name: str
    date: str
    distance_km: float | None
    duration_min: float | None
    avg_hr: int | None
    max_hr: int | None
    avg_pace_min_km: float | None
    elevation_gain_m: float | None
    run_type: str | None


class ActivityDetail(ActivitySummary):
    splits: list[SplitRead]


class SplitWithActivity(BaseModel):
    split_number: int
    distance_km: float | None
    duration_min: float | None
    pace_min_km: float | None
    avg_hr: int | None
    elevation_gain_m: float | None
    split_type: str | None
    activity_id: int
    activity_name: str
    activity_date: str


class ReclassifyResponse(BaseModel):
    updated_splits: int
    updated_run_types: int


class UserSettings(BaseModel):
    pace_fast_max_min_km: float = 4.5
    pace_walking_min_km: float = 10.0
    pace_idle_min_km: float = 20.0
    long_run_min_km: float = 12.0
    hills_elev_per_km_threshold: float = 30.0
    tempo_min_fast_fraction: float = 0.15
    interval_min_fast_splits: int = 2
    interval_alt_ratio: float = 0.3
    iqr_multiplier: float = 6.0
