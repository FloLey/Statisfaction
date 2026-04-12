# Statisfaction

A full-stack web app where multiple users can import their Garmin running activity data and view their racing stats.

| Layer    | Stack                                          |
|----------|------------------------------------------------|
| Frontend | React 18 + Vite + TypeScript                   |
| Backend  | FastAPI (Python 3.12) + PostgreSQL 16           |
| Garmin   | garminconnect (pip)                            |
| Access   | Tailscale only (100.109.197.38)                |

---

## Quick Start (Production)

```bash
cp .env.example .env
# Edit .env with your settings
docker compose up --build -d
```

- Frontend: http://100.109.197.38:7746
- Backend API: http://100.109.197.38:7745

---

## Development (Hot Reload)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Services bind to `127.0.0.1` only for local dev.

---

## API

| Method | Path                            | Description                          |
|--------|---------------------------------|--------------------------------------|
| GET    | /api/health                     | Health check                         |
| GET    | /api/users                      | List all users                       |
| POST   | /api/users                      | Create a user                        |
| POST   | /api/users/{id}/sync            | Sync running activities from Garmin  |
| GET    | /api/users/{id}/activities      | List activities for a user           |
| GET    | /api/activities/{id}            | Activity detail with splits          |

**POST /api/users** body: `{"name": "string", "email": "garmin-email"}`

**POST /api/users/{id}/sync** body: `{"password": "garmin-password"}` — password is used only for the sync request and never stored.

---

## Running Tests

### Backend

Requires a running PostgreSQL instance (or use the dev compose DB on port 5433):

```bash
cd backend
pip install -r requirements.txt
TEST_DATABASE_URL=postgresql://statisfaction:statisfaction@localhost:5490/statisfactiondb pytest
```

### Frontend

```bash
cd frontend
npm install
npm test
```

---

## Project Structure

```
.
├── backend/
│   ├── main.py            # FastAPI routes + app setup
│   ├── db.py              # PostgreSQL schema + connection management
│   ├── garmin.py          # Garmin Connect integration
│   ├── models.py          # Pydantic request/response models
│   ├── tests/             # pytest tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   └── components/
│   └── vite.config.ts
├── docker-compose.yml      # Production (binds to Tailscale IP)
├── docker-compose.dev.yml  # Development (hot reload, localhost)
└── .env.example
```

---

## Database Schema

PostgreSQL 16 with three tables:

- **users** — id, name (unique), email, created_at
- **activities** — id, user_id, garmin_id (unique), name, date, distance_km, duration_min, avg_hr, max_hr, avg_pace_min_km, elevation_gain_m
- **splits** — id, activity_id, split_number, distance_km, duration_min, pace_min_km, avg_hr, elevation_gain_m

---

## Known Limitations

- `garminconnect` can break when Garmin changes their Cloudflare configuration. Auth failures are surfaced clearly to the user.
- MFA-enabled Garmin accounts are not supported. Users must disable MFA to sync.
- Initial sync for users with many activities may take several minutes due to Garmin API rate limits.
