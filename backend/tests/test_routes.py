import os
import sys
from unittest.mock import MagicMock, patch

import psycopg2
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://statisfaction:statisfaction@localhost:5490/statisfactiondb_test",
)

_PROD_DB_NAMES = {"statisfactiondb"}
_parsed_db_name = TEST_DATABASE_URL.rstrip("/").rsplit("/", 1)[-1]
if _parsed_db_name in _PROD_DB_NAMES:
    raise RuntimeError(
        f"TEST_DATABASE_URL points to production database '{_parsed_db_name}'. "
        "Set TEST_DATABASE_URL to a dedicated test database"
        " (e.g. statisfactiondb_test)."
    )


@pytest.fixture(autouse=True)
def _fresh_db():
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL

    import db as db_mod

    db_mod.DATABASE_URL = TEST_DATABASE_URL
    db_mod.init_db(TEST_DATABASE_URL)

    yield

    conn = psycopg2.connect(TEST_DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS splits CASCADE")
    cur.execute("DROP TABLE IF EXISTS activities CASCADE")
    cur.execute("DROP TABLE IF EXISTS users CASCADE")
    conn.close()


@pytest.fixture()
def client():
    from main import app

    with TestClient(app) as c:
        yield c


# -- Health --


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# -- Users --


def test_create_user(client):
    resp = client.post(
        "/api/users",
        json={"name": "Alice", "email": "alice@garmin.com"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Alice"
    assert data["email"] == "alice@garmin.com"
    assert "id" in data
    assert "created_at" in data


def test_create_duplicate_user(client):
    client.post("/api/users", json={"name": "Bob", "email": "bob@garmin.com"})
    resp = client.post("/api/users", json={"name": "Bob", "email": "bob2@garmin.com"})
    assert resp.status_code == 409


def test_list_users(client):
    client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    client.post("/api/users", json={"name": "Bob", "email": "b@g.com"})
    resp = client.get("/api/users")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


# -- Activities --


def test_list_activities_empty(client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]
    resp = client.get(f"/api/users/{user_id}/activities")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_activities_user_not_found(client):
    resp = client.get("/api/users/999/activities")
    assert resp.status_code == 404


def test_list_activities(client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    import db as db_mod

    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            user_id,
            "111",
            "Morning Run",
            "2026-03-15 08:00:00",
            10.0,
            50.0,
            155,
            175,
            5.0,
            30.0,
        ),
    )
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            user_id,
            "222",
            "Evening Run",
            "2026-03-16 18:00:00",
            5.0,
            25.0,
            145,
            165,
            5.0,
            10.0,
        ),
    )
    conn.commit()
    conn.close()

    resp = client.get(f"/api/users/{user_id}/activities")
    assert resp.status_code == 200
    activities = resp.json()
    assert len(activities) == 2
    assert activities[0]["garmin_id"] == "222"


def test_get_activity_with_splits(client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    import db as db_mod

    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING id""",
        (
            user_id,
            "111",
            "Morning Run",
            "2026-03-15 08:00:00",
            10.0,
            50.0,
            155,
            175,
            5.0,
            30.0,
        ),
    )
    activity_id = cur.fetchone()["id"]
    cur.execute(
        """INSERT INTO splits
           (activity_id, split_number, distance_km,
            duration_min, pace_min_km, avg_hr, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (activity_id, 1, 1.0, 5.1, 5.1, 150, 3.0),
    )
    cur.execute(
        """INSERT INTO splits
           (activity_id, split_number, distance_km,
            duration_min, pace_min_km, avg_hr, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (activity_id, 2, 1.0, 4.9, 4.9, 155, 5.0),
    )
    conn.commit()
    conn.close()

    resp = client.get(f"/api/activities/{activity_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["garmin_id"] == "111"
    assert len(data["splits"]) == 2
    assert data["splits"][0]["split_number"] == 1


def test_get_activity_not_found(client):
    resp = client.get("/api/activities/999")
    assert resp.status_code == 404


# -- Sync --


FAKE_ACTIVITIES = [
    {
        "activityId": 12345,
        "activityName": "Morning Run",
        "activityType": {"typeKey": "running"},
        "startTimeLocal": "2026-03-15 08:00:00",
        "distance": 10050.0,
        "duration": 3120.0,
        "averageHR": 155,
        "maxHR": 175,
        "averageSpeed": 3.22,
        "elevationGain": 45.0,
    }
]


@patch("main.garmin_mod")
def test_sync_success(mock_garmin, client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    mock_client = MagicMock()
    mock_garmin.login.return_value = mock_client
    mock_garmin.fetch_activities.return_value = FAKE_ACTIVITIES
    mock_garmin.normalize_activity.side_effect = lambda raw: {
        "garmin_id": str(raw["activityId"]),
        "name": raw["activityName"],
        "date": raw["startTimeLocal"],
        "distance_km": 10.05,
        "duration_min": 52.0,
        "avg_hr": 155,
        "max_hr": 175,
        "avg_pace_min_km": 5.18,
        "elevation_gain_m": 45.0,
    }
    mock_garmin.fetch_splits.return_value = [
        {
            "split_number": 1,
            "distance_km": 1.0,
            "duration_min": 5.0,
            "pace_min_km": 5.0,
            "avg_hr": 150,
            "elevation_gain_m": 5.0,
            "split_type": "running",
        }
    ]

    resp = client.post(f"/api/users/{user_id}/sync", json={"password": "secret"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["synced"] == 1
    assert data["total"] == 1

    resp = client.get(f"/api/users/{user_id}/activities")
    assert len(resp.json()) == 1


@patch("main.garmin_mod")
def test_sync_bad_credentials(mock_garmin, client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    mock_garmin.login.side_effect = Exception("Invalid credentials")

    resp = client.post(f"/api/users/{user_id}/sync", json={"password": "wrong"})
    assert resp.status_code == 401


@patch("main.garmin_mod")
def test_sync_idempotent(mock_garmin, client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    mock_client = MagicMock()
    mock_garmin.login.return_value = mock_client
    mock_garmin.fetch_activities.return_value = FAKE_ACTIVITIES
    mock_garmin.normalize_activity.side_effect = lambda raw: {
        "garmin_id": str(raw["activityId"]),
        "name": raw["activityName"],
        "date": raw["startTimeLocal"],
        "distance_km": 10.05,
        "duration_min": 52.0,
        "avg_hr": 155,
        "max_hr": 175,
        "avg_pace_min_km": 5.18,
        "elevation_gain_m": 45.0,
    }
    mock_garmin.fetch_splits.return_value = []

    resp = client.post(f"/api/users/{user_id}/sync", json={"password": "secret"})
    assert resp.json()["synced"] == 1

    resp = client.post(f"/api/users/{user_id}/sync", json={"password": "secret"})
    assert resp.json()["synced"] == 0
    assert resp.json()["total"] == 1


def test_sync_user_not_found(client):
    resp = client.post("/api/users/999/sync", json={"password": "secret"})
    assert resp.status_code == 404


# -- Splits --


def test_get_activity_splits_include_split_type(client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    import db as db_mod

    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING id""",
        (user_id, "abc", "Run", "2026-01-01 07:00:00", 5.0, 25.0, 150, 170, 5.0, 10.0),
    )
    activity_id = cur.fetchone()["id"]
    cur.execute(
        """INSERT INTO splits
           (activity_id, split_number, distance_km,
            duration_min, pace_min_km, avg_hr, elevation_gain_m, split_type)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (activity_id, 1, 1.0, 5.0, 5.0, 150, 2.0, "running"),
    )
    cur.execute(
        """INSERT INTO splits
           (activity_id, split_number, distance_km,
            duration_min, pace_min_km, avg_hr, elevation_gain_m, split_type)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (activity_id, 2, 0.1, 3.0, 25.0, 90, 0.0, "idle"),
    )
    conn.commit()
    conn.close()

    resp = client.get(f"/api/activities/{activity_id}")
    assert resp.status_code == 200
    splits = resp.json()["splits"]
    assert splits[0]["split_type"] == "running"
    assert splits[1]["split_type"] == "idle"


# -- Reclassify --


def test_reclassify_splits(client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    import db as db_mod

    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING id""",
        (user_id, "xyz", "Run", "2026-01-01 07:00:00", 5.0, 25.0, 150, 170, 5.0, 10.0),
    )
    activity_id = cur.fetchone()["id"]
    # Insert splits without split_type (simulating pre-backfill data)
    cur.execute(
        """INSERT INTO splits
           (activity_id, split_number, distance_km,
            duration_min, pace_min_km, avg_hr, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (activity_id, 1, 1.0, 5.0, 5.0, 150, 2.0),  # running
    )
    cur.execute(
        """INSERT INTO splits
           (activity_id, split_number, distance_km,
            duration_min, pace_min_km, avg_hr, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (activity_id, 2, 0.5, 8.0, 15.0, 100, 0.0),  # walking
    )
    cur.execute(
        """INSERT INTO splits
           (activity_id, split_number, distance_km,
            duration_min, pace_min_km, avg_hr, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (activity_id, 3, 1.0, 3.5, 3.5, 175, 5.0),  # fast
    )
    conn.commit()
    conn.close()

    resp = client.post(f"/api/users/{user_id}/reclassify")
    assert resp.status_code == 200
    assert resp.json()["updated_splits"] == 3
    assert resp.json()["updated_run_types"] == 1

    # Verify types were set correctly
    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        "SELECT split_number, split_type FROM splits"
        " WHERE activity_id = %s ORDER BY split_number",
        (activity_id,),
    )
    rows = cur.fetchall()
    conn.close()
    assert rows[0]["split_type"] == "running"
    assert rows[1]["split_type"] == "walking"
    assert rows[2]["split_type"] == "fast"


def test_reclassify_user_not_found(client):
    resp = client.post("/api/users/999/reclassify")
    assert resp.status_code == 404


# -- run_type --


def test_run_type_in_activity_list(client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    import db as db_mod

    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m, run_type)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            user_id, "t1", "Tempo Run", "2026-03-15 08:00:00",
            8.0, 40.0, 160, 180, 5.0, 20.0, "tempo",
        ),
    )
    conn.commit()
    conn.close()

    resp = client.get(f"/api/users/{user_id}/activities")
    assert resp.status_code == 200
    activities = resp.json()
    assert len(activities) == 1
    assert activities[0]["run_type"] == "tempo"


def test_run_type_in_activity_detail(client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    import db as db_mod

    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m, run_type)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING id""",
        (
            user_id, "t2", "Sprint Session", "2026-03-16 08:00:00",
            6.0, 35.0, 165, 185, 5.5, 15.0, "sprints",
        ),
    )
    activity_id = cur.fetchone()["id"]
    conn.commit()
    conn.close()

    resp = client.get(f"/api/activities/{activity_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["run_type"] == "sprints"


def test_run_type_null_when_not_set(client):
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    import db as db_mod

    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING id""",
        (
            user_id, "t3", "Old Run", "2026-03-17 08:00:00",
            5.0, 25.0, 150, 170, 5.0, 10.0,
        ),
    )
    activity_id = cur.fetchone()["id"]
    conn.commit()
    conn.close()

    resp = client.get(f"/api/activities/{activity_id}")
    assert resp.status_code == 200
    assert resp.json()["run_type"] is None


def test_reclassify_sets_run_type(client):
    """After reclassify, activities with interval splits get a run_type."""
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    import db as db_mod

    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING id""",
        (
            user_id, "r1", "Intervals", "2026-03-18 08:00:00",
            6.0, 30.0, 165, 190, 5.0, 10.0,
        ),
    )
    activity_id = cur.fetchone()["id"]
    # Insert alternating fast/idle splits (interval pattern)
    for i, (pace, stype) in enumerate(
        [(3.5, "fast"), (25.0, "idle"), (3.5, "fast"), (25.0, "idle"), (3.5, "fast")], 1
    ):
        cur.execute(
            """INSERT INTO splits
               (activity_id, split_number, distance_km,
                duration_min, pace_min_km, avg_hr, elevation_gain_m, split_type)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (activity_id, i, 1.0, 5.0, pace, 160, 5.0, stype),
        )
    conn.commit()
    conn.close()

    resp = client.post(f"/api/users/{user_id}/reclassify")
    assert resp.status_code == 200
    assert resp.json()["updated_run_types"] == 1

    resp = client.get(f"/api/activities/{activity_id}")
    assert resp.json()["run_type"] == "sprints"


# -- User settings --


def test_get_settings_returns_defaults(client):
    """GET settings for user with no saved settings returns default values."""
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    resp = client.get(f"/api/users/{user_id}/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert data["pace_fast_max_min_km"] == 4.0
    assert data["long_run_min_km"] == 12.0
    assert data["interval_alt_ratio"] == 0.60


def test_put_settings_upsert(client):
    """PUT settings saves and GET returns updated values."""
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    new_settings = {
        "pace_fast_max_min_km": 5.0,
        "pace_walking_min_km": 10.0,
        "pace_idle_min_km": 20.0,
        "long_run_min_km": 15.0,
        "hills_elev_per_km_threshold": 50.0,
        "tempo_min_fast_fraction": 0.10,
        "interval_min_fast_splits": 3,
        "interval_alt_ratio": 0.70,
    }
    resp = client.put(f"/api/users/{user_id}/settings", json=new_settings)
    assert resp.status_code == 200
    assert resp.json()["pace_fast_max_min_km"] == 5.0

    resp = client.get(f"/api/users/{user_id}/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert data["pace_fast_max_min_km"] == 5.0
    assert data["long_run_min_km"] == 15.0


def test_put_settings_second_upsert(client):
    """PUT settings twice correctly overwrites the first save."""
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    base = {
        "pace_fast_max_min_km": 5.0,
        "pace_walking_min_km": 10.0,
        "pace_idle_min_km": 20.0,
        "long_run_min_km": 12.0,
        "hills_elev_per_km_threshold": 30.0,
        "tempo_min_fast_fraction": 0.15,
        "interval_min_fast_splits": 2,
        "interval_alt_ratio": 0.60,
    }
    client.put(f"/api/users/{user_id}/settings", json=base)
    base["pace_fast_max_min_km"] = 4.5
    client.put(f"/api/users/{user_id}/settings", json=base)

    resp = client.get(f"/api/users/{user_id}/settings")
    assert resp.json()["pace_fast_max_min_km"] == 4.5


def test_get_settings_user_not_found(client):
    resp = client.get("/api/users/999/settings")
    assert resp.status_code == 404


def test_put_settings_user_not_found(client):
    body = {
        "pace_fast_max_min_km": 5.0,
        "pace_walking_min_km": 10.0,
        "pace_idle_min_km": 20.0,
        "long_run_min_km": 12.0,
        "hills_elev_per_km_threshold": 30.0,
        "tempo_min_fast_fraction": 0.15,
        "interval_min_fast_splits": 2,
        "interval_alt_ratio": 0.60,
    }
    resp = client.put("/api/users/999/settings", json=body)
    assert resp.status_code == 404


def test_reclassify_uses_custom_settings(client):
    """Reclassify with custom pace_fast_max_min_km=5.0 reclassifies splits."""
    resp = client.post("/api/users", json={"name": "Alice", "email": "a@g.com"})
    user_id = resp.json()["id"]

    # Save custom settings: fast threshold at 5.0 min/km
    client.put(
        f"/api/users/{user_id}/settings",
        json={
            "pace_fast_max_min_km": 5.0,
            "pace_walking_min_km": 10.0,
            "pace_idle_min_km": 20.0,
            "long_run_min_km": 12.0,
            "hills_elev_per_km_threshold": 30.0,
            "tempo_min_fast_fraction": 0.15,
            "interval_min_fast_splits": 2,
            "interval_alt_ratio": 0.60,
        },
    )

    import db as db_mod

    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING id""",
        (user_id, "s1", "Tempo", "2026-03-20 08:00:00", 8.0, 40.0, 160, 180, 4.8, 20.0),
    )
    activity_id = cur.fetchone()["id"]
    # Split at 4.5 min/km — running with default, but fast with threshold=5.0
    cur.execute(
        """INSERT INTO splits
           (activity_id, split_number, distance_km,
            duration_min, pace_min_km, avg_hr, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (activity_id, 1, 2.0, 9.0, 4.5, 165, 5.0),
    )
    conn.commit()
    conn.close()

    resp = client.post(f"/api/users/{user_id}/reclassify")
    assert resp.status_code == 200

    # Verify split was reclassified as fast
    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        "SELECT split_type FROM splits WHERE activity_id = %s", (activity_id,)
    )
    row = cur.fetchone()
    conn.close()
    assert row["split_type"] == "fast"
