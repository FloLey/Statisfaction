# Statisfaction

A minimal full-stack application accessible only via Tailscale.

| Layer    | Stack                                          |
|----------|------------------------------------------------|
| Frontend | React 18 + Vite + TypeScript                   |
| Backend  | FastAPI (Python 3.12) + SQLAlchemy async       |
| Database | PostgreSQL 16                                  |
| Access   | Tailscale only (100.109.197.38)                |

---

## Quick Start (Production)

```bash
cp .env.example .env
# Edit .env — set a strong POSTGRES_PASSWORD at minimum
docker compose up --build -d
```

- Frontend: http://100.109.197.38:5174
- Backend API: http://100.109.197.38:8001
- Migrations run automatically on backend startup.

---

## Development (Hot Reload)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Services bind to `127.0.0.1` only for local dev.

---

## API

| Method | Path               | Description           |
|--------|--------------------|-----------------------|
| GET    | /api/health        | Health check          |
| GET    | /api/todos         | List all items        |
| POST   | /api/todos         | Create an item        |
| DELETE | /api/todos/{id}    | Delete an item by id  |

**POST /api/todos** body: `{"title": "string"}`

---

## Running Tests

### Backend

Requires a running PostgreSQL instance (or use the dev compose DB):

```bash
cd backend
pip install -r requirements.txt
TEST_DATABASE_URL=postgresql+asyncpg://statisfaction:statisfaction@localhost:5432/statisfactiondb_test pytest
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
│   ├── app/
│   │   ├── main.py        # Routes + lifespan (runs migrations on startup)
│   │   ├── database.py    # Async SQLAlchemy engine + session
│   │   ├── models.py      # ORM model
│   │   └── schemas.py     # Pydantic schemas
│   ├── alembic/           # Database migrations
│   ├── tests/             # pytest tests (httpx AsyncClient)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts         # Typed fetch helpers
│   │   └── components/    # AddTodo, TodoList + their tests
│   └── vite.config.ts
├── docker-compose.yml      # Production (binds to Tailscale IP)
├── docker-compose.dev.yml  # Development (hot reload, localhost)
└── .env.example
```
