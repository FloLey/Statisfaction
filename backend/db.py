import os
from typing import Generator

import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://statisfaction:statisfaction@localhost:5490/statisfactiondb",
)

SCHEMA = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        garmin_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        distance_km DOUBLE PRECISION,
        duration_min DOUBLE PRECISION,
        avg_hr INTEGER,
        max_hr INTEGER,
        avg_pace_min_km DOUBLE PRECISION,
        elevation_gain_m DOUBLE PRECISION
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS splits (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER NOT NULL
            REFERENCES activities(id) ON DELETE CASCADE,
        split_number INTEGER NOT NULL,
        distance_km DOUBLE PRECISION,
        duration_min DOUBLE PRECISION,
        pace_min_km DOUBLE PRECISION,
        avg_hr INTEGER,
        elevation_gain_m DOUBLE PRECISION
    )
    """,
    """
    ALTER TABLE splits
        ADD COLUMN IF NOT EXISTS split_type TEXT
        CHECK (split_type IN ('running', 'walking', 'idle', 'fast'))
    """,
]


def _connect(dsn: str | None = None) -> psycopg2.extensions.connection:
    conn = psycopg2.connect(dsn or DATABASE_URL, cursor_factory=RealDictCursor)
    return conn


def init_db(dsn: str | None = None) -> None:
    conn = _connect(dsn)
    cur = conn.cursor()
    for stmt in SCHEMA:
        cur.execute(stmt)
    conn.commit()
    conn.close()


def get_db(
    dsn: str | None = None,
) -> Generator[psycopg2.extensions.connection, None, None]:
    conn = _connect(dsn)
    try:
        yield conn
    finally:
        conn.close()
