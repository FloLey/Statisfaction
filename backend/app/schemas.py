from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TodoCreate(BaseModel):
    title: str


class TodoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime
    completed_at: datetime | None


class DailyStat(BaseModel):
    date: str
    count: int


class DailyStatsResponse(BaseModel):
    completed: list[DailyStat]
    created: list[DailyStat]
