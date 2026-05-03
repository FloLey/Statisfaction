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
    garmin_id: str
    name: str
    date: str
    distance_km: float | None
    duration_min: float | None
    avg_hr: int | None
    max_hr: int | None
    avg_pace_min_km: float | None
    elevation_gain_m: float | None


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
