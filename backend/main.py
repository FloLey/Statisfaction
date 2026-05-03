import os
import time
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone

import psycopg2
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import garmin as garmin_mod
from db import get_db, init_db
from models import (
    ActivityDetail,
    ActivitySummary,
    ReclassifyResponse,
    SplitWithActivity,
    SyncRequest,
    SyncResponse,
    UserCreate,
    UserRead,
)

_cors_env = os.getenv("CORS_ORIGINS", "http://localhost:7746")
CORS_ORIGINS = [o.strip() for o in _cors_env.split(",")]


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Statisfaction API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/users", response_model=list[UserRead])
def list_users(conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, created_at FROM users ORDER BY name")
    return cur.fetchall()


@app.post("/api/users", response_model=UserRead, status_code=201)
def create_user(body: UserCreate, conn=Depends(get_db)):
    now = datetime.now(timezone.utc).isoformat()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (name, email, created_at)"
            " VALUES (%s, %s, %s) RETURNING id, name, email, created_at",
            (body.name, body.email, now),
        )
        conn.commit()
        return cur.fetchone()
    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(409, detail="User already exists")


@app.post("/api/users/{user_id}/sync", response_model=SyncResponse)
def sync_activities(
    user_id: int,
    body: SyncRequest,
    conn=Depends(get_db),
):
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    if not user:
        raise HTTPException(404, detail="User not found")

    try:
        client = garmin_mod.login(user["email"], body.password)
    except Exception:
        raise HTTPException(401, detail="Garmin login failed")

    cur.execute(
        "SELECT MAX(date) as latest FROM activities WHERE user_id = %s",
        (user_id,),
    )
    row = cur.fetchone()
    if row["latest"]:
        since = date.fromisoformat(row["latest"][:10])
    else:
        since = date.today() - timedelta(days=365)

    raw_activities = garmin_mod.fetch_activities(client, since)

    synced = 0
    for raw in raw_activities:
        normalized = garmin_mod.normalize_activity(raw)
        cur.execute(
            "SELECT id FROM activities WHERE garmin_id = %s",
            (normalized["garmin_id"],),
        )
        if cur.fetchone():
            continue

        cur.execute(
            """INSERT INTO activities
               (user_id, garmin_id, name, date, distance_km,
                duration_min, avg_hr, max_hr,
                avg_pace_min_km, elevation_gain_m)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               RETURNING id""",
            (
                user_id,
                normalized["garmin_id"],
                normalized["name"],
                normalized["date"],
                normalized["distance_km"],
                normalized["duration_min"],
                normalized["avg_hr"],
                normalized["max_hr"],
                normalized["avg_pace_min_km"],
                normalized["elevation_gain_m"],
            ),
        )
        activity_id = cur.fetchone()["id"]

        try:
            splits = garmin_mod.fetch_splits(client, normalized["garmin_id"])
            for s in splits:
                cur.execute(
                    """INSERT INTO splits
                       (activity_id, split_number, distance_km,
                        duration_min, pace_min_km, avg_hr,
                        elevation_gain_m, split_type)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (
                        activity_id,
                        s["split_number"],
                        s["distance_km"],
                        s["duration_min"],
                        s["pace_min_km"],
                        s["avg_hr"],
                        s["elevation_gain_m"],
                        s["split_type"],
                    ),
                )
        except Exception:
            pass  # splits are nice-to-have

        synced += 1
        time.sleep(0.3)

    conn.commit()

    cur.execute(
        "SELECT COUNT(*) as cnt FROM activities WHERE user_id = %s",
        (user_id,),
    )
    total = cur.fetchone()["cnt"]
    return {"synced": synced, "total": total}


@app.get(
    "/api/users/{user_id}/activities",
    response_model=list[ActivitySummary],
)
def list_activities(user_id: int, conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cur.fetchone():
        raise HTTPException(404, detail="User not found")
    cur.execute(
        "SELECT * FROM activities WHERE user_id = %s ORDER BY date DESC",
        (user_id,),
    )
    return cur.fetchall()


@app.get(
    "/api/activities/{activity_id}",
    response_model=ActivityDetail,
)
def get_activity(activity_id: int, conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute(
        "SELECT id, garmin_id, name, date, distance_km, duration_min,"
        " avg_hr, max_hr, avg_pace_min_km, elevation_gain_m"
        " FROM activities WHERE id = %s",
        (activity_id,),
    )
    activity = cur.fetchone()
    if not activity:
        raise HTTPException(404, detail="Activity not found")
    cur.execute(
        "SELECT split_number, distance_km, duration_min, pace_min_km,"
        " avg_hr, elevation_gain_m, split_type"
        " FROM splits WHERE activity_id = %s ORDER BY split_number",
        (activity_id,),
    )
    result = dict(activity)
    result["splits"] = cur.fetchall()
    return result


@app.post(
    "/api/users/{user_id}/reclassify",
    response_model=ReclassifyResponse,
)
def reclassify_splits(user_id: int, conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cur.fetchone():
        raise HTTPException(404, detail="User not found")
    cur.execute(
        """SELECT s.id, s.pace_min_km
           FROM splits s
           JOIN activities a ON s.activity_id = a.id
           WHERE a.user_id = %s""",
        (user_id,),
    )
    splits = cur.fetchall()
    for s in splits:
        new_type = garmin_mod.classify_split(s["pace_min_km"])
        cur.execute(
            "UPDATE splits SET split_type = %s WHERE id = %s",
            (new_type, s["id"]),
        )
    conn.commit()
    return {"updated_splits": len(splits)}


@app.get(
    "/api/users/{user_id}/splits",
    response_model=list[SplitWithActivity],
)
def list_user_splits(user_id: int, conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cur.fetchone():
        raise HTTPException(404, detail="User not found")
    cur.execute(
        """SELECT s.split_number, s.distance_km, s.duration_min,
                  s.pace_min_km, s.avg_hr, s.elevation_gain_m,
                  s.split_type,
                  a.id as activity_id, a.name as activity_name,
                  a.date as activity_date
           FROM splits s
           JOIN activities a ON s.activity_id = a.id
           WHERE a.user_id = %s
           ORDER BY a.date, s.split_number""",
        (user_id,),
    )
    return cur.fetchall()
