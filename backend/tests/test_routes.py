import os
import sys
from unittest.mock import MagicMock, patch

import psycopg2
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://statisfaction:statisfaction@localhost:5490/statisfactiondb",
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
    client.post(
        "/api/users", json={"name": "Bob", "email": "bob@garmin.com"}
    )
    resp = client.post(
        "/api/users", json={"name": "Bob", "email": "bob2@garmin.com"}
    )
    assert resp.status_code == 409


def test_list_users(client):
    client.post(
        "/api/users", json={"name": "Alice", "email": "a@g.com"}
    )
    client.post(
        "/api/users", json={"name": "Bob", "email": "b@g.com"}
    )
    resp = client.get("/api/users")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


# -- Activities --


def test_list_activities_empty(client):
    resp = client.post(
        "/api/users", json={"name": "Alice", "email": "a@g.com"}
    )
    user_id = resp.json()["id"]
    resp = client.get(f"/api/users/{user_id}/activities")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_activities_user_not_found(client):
    resp = client.get("/api/users/999/activities")
    assert resp.status_code == 404


def test_list_activities(client):
    resp = client.post(
        "/api/users", json={"name": "Alice", "email": "a@g.com"}
    )
    user_id = resp.json()["id"]

    import db as db_mod

    conn = db_mod._connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (user_id, "111", "Morning Run", "2026-03-15 08:00:00",
         10.0, 50.0, 155, 175, 5.0, 30.0),
    )
    cur.execute(
        """INSERT INTO activities
           (user_id, garmin_id, name, date, distance_km, duration_min,
            avg_hr, max_hr, avg_pace_min_km, elevation_gain_m)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (user_id, "222", "Evening Run", "2026-03-16 18:00:00",
         5.0, 25.0, 145, 165, 5.0, 10.0),
    )
    conn.commit()
    conn.close()

    resp = client.get(f"/api/users/{user_id}/activities")
    assert resp.status_code == 200
    activities = resp.json()
    assert len(activities) == 2
    assert activities[0]["garmin_id"] == "222"


def test_get_activity_with_splits(client):
    resp = client.post(
        "/api/users", json={"name": "Alice", "email": "a@g.com"}
    )
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
        (user_id, "111", "Morning Run", "2026-03-15 08:00:00",
         10.0, 50.0, 155, 175, 5.0, 30.0),
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
    resp = client.post(
        "/api/users", json={"name": "Alice", "email": "a@g.com"}
    )
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
        }
    ]

    resp = client.post(
        f"/api/users/{user_id}/sync", json={"password": "secret"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["synced"] == 1
    assert data["total"] == 1

    resp = client.get(f"/api/users/{user_id}/activities")
    assert len(resp.json()) == 1


@patch("main.garmin_mod")
def test_sync_bad_credentials(mock_garmin, client):
    resp = client.post(
        "/api/users", json={"name": "Alice", "email": "a@g.com"}
    )
    user_id = resp.json()["id"]

    mock_garmin.login.side_effect = Exception("Invalid credentials")

    resp = client.post(
        f"/api/users/{user_id}/sync", json={"password": "wrong"}
    )
    assert resp.status_code == 401


@patch("main.garmin_mod")
def test_sync_idempotent(mock_garmin, client):
    resp = client.post(
        "/api/users", json={"name": "Alice", "email": "a@g.com"}
    )
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

    resp = client.post(
        f"/api/users/{user_id}/sync", json={"password": "secret"}
    )
    assert resp.json()["synced"] == 1

    resp = client.post(
        f"/api/users/{user_id}/sync", json={"password": "secret"}
    )
    assert resp.json()["synced"] == 0
    assert resp.json()["total"] == 1


def test_sync_user_not_found(client):
    resp = client.post(
        "/api/users/999/sync", json={"password": "secret"}
    )
    assert resp.status_code == 404
