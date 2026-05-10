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
    UserSettings,
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
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type"],
)


def _get_user_settings(user_id: int, cur) -> UserSettings:
    """Fetch per-user classification settings, returning defaults if none saved."""
    cur.execute("SELECT * FROM user_settings WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    if row:
        row_dict = dict(row)
        row_dict.pop("user_id", None)
        return UserSettings(**row_dict)
    return UserSettings()


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
            settings = _get_user_settings(user_id, cur)
            splits = garmin_mod.fetch_splits(
                client, normalized["garmin_id"], settings=settings
            )
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
            run_type = garmin_mod.classify_run_type(splits, settings=settings)
            cur.execute(
                "UPDATE activities SET run_type = %s WHERE id = %s",
                (run_type, activity_id),
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
        " avg_hr, max_hr, avg_pace_min_km, elevation_gain_m, run_type"
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

    settings = _get_user_settings(user_id, cur)

    # Step 1: reclassify individual splits by pace
    cur.execute(
        """SELECT s.id, s.pace_min_km
           FROM splits s
           JOIN activities a ON s.activity_id = a.id
           WHERE a.user_id = %s""",
        (user_id,),
    )
    splits = cur.fetchall()
    for s in splits:
        new_type = garmin_mod.classify_split(s["pace_min_km"], settings=settings)
        cur.execute(
            "UPDATE splits SET split_type = %s WHERE id = %s",
            (new_type, s["id"]),
        )

    # Step 2: compute run_type per activity (must come after splits are updated)
    cur.execute(
        "SELECT id FROM activities WHERE user_id = %s",
        (user_id,),
    )
    activity_ids = [row["id"] for row in cur.fetchall()]
    for act_id in activity_ids:
        cur.execute(
            """SELECT split_type, distance_km, elevation_gain_m, split_number
               FROM splits WHERE activity_id = %s ORDER BY split_number""",
            (act_id,),
        )
        act_splits = [dict(s) for s in cur.fetchall()]
        run_type = garmin_mod.classify_run_type(act_splits, settings=settings)
        cur.execute(
            "UPDATE activities SET run_type = %s WHERE id = %s",
            (run_type, act_id),
        )

    conn.commit()
    return {"updated_splits": len(splits), "updated_run_types": len(activity_ids)}


@app.get("/api/users/{user_id}/settings", response_model=UserSettings)
def get_user_settings(user_id: int, conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cur.fetchone():
        raise HTTPException(404, detail="User not found")
    return _get_user_settings(user_id, cur)


@app.put("/api/users/{user_id}/settings", response_model=UserSettings)
def update_user_settings(
    user_id: int,
    body: UserSettings,
    conn=Depends(get_db),
):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cur.fetchone():
        raise HTTPException(404, detail="User not found")
    cur.execute(
        """INSERT INTO user_settings (
               user_id,
               pace_fast_max_min_km, pace_walking_min_km, pace_idle_min_km,
               long_run_min_km, hills_elev_per_km_threshold,
               tempo_min_fast_fraction, interval_min_fast_splits, interval_alt_ratio
           ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (user_id) DO UPDATE SET
               pace_fast_max_min_km        = EXCLUDED.pace_fast_max_min_km,
               pace_walking_min_km         = EXCLUDED.pace_walking_min_km,
               pace_idle_min_km            = EXCLUDED.pace_idle_min_km,
               long_run_min_km             = EXCLUDED.long_run_min_km,
               hills_elev_per_km_threshold = EXCLUDED.hills_elev_per_km_threshold,
               tempo_min_fast_fraction     = EXCLUDED.tempo_min_fast_fraction,
               interval_min_fast_splits    = EXCLUDED.interval_min_fast_splits,
               interval_alt_ratio          = EXCLUDED.interval_alt_ratio""",
        (
            user_id,
            body.pace_fast_max_min_km,
            body.pace_walking_min_km,
            body.pace_idle_min_km,
            body.long_run_min_km,
            body.hills_elev_per_km_threshold,
            body.tempo_min_fast_fraction,
            body.interval_min_fast_splits,
            body.interval_alt_ratio,
        ),
    )
    conn.commit()
    return body


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
