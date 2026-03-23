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

## Features

- **Task Management** — Create, complete, and delete tasks
- **Tabbed UI** — Switch between active tasks ("To Do"), completed tasks ("Done"), and daily statistics ("Stats")
- **Daily Stats** — Bar charts showing tasks created and completed per day

---

## API

| Method | Path                        | Description                     |
|--------|-----------------------------|---------------------------------|
| GET    | /api/health                 | Health check                    |
| GET    | /api/todos                  | List all items                  |
| POST   | /api/todos                  | Create an item                  |
| PATCH  | /api/todos/{id}/complete    | Toggle task completion          |
| DELETE | /api/todos/{id}             | Delete an item by id            |
| GET    | /api/todos/stats/daily      | Daily creation & completion counts |

**POST /api/todos** body: `{"title": "string"}`

**PATCH /api/todos/{id}/complete** returns the updated todo with `completed_at` set or cleared.

**GET /api/todos/stats/daily** returns `{"completed": [{"date": "YYYY-MM-DD", "count": N}], "created": [...]}`

---

## Running Tests

### Backend

Requires a running PostgreSQL instance (or use the dev compose DB):

```bash
cd backend
pip install -r requirements.txt
TEST_DATABASE_URL=postgresql+asyncpg://statisfaction:statisfaction@localhost:5433/statisfactiondb_test pytest
```

### Frontend

```bash
cd frontend
npm install
npm test
```

---

## In-App Documentation

Click the **Docs** button in the top-right corner of the header to open a documentation modal with usage instructions, API reference, and tech stack details.

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
│   ├── .coveragerc        # Coverage config (greenlet concurrency)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts         # Typed fetch helpers
│   │   └── components/    # AddTodo, TodoList, TabNav, CompletionChart + tests
│   └── vite.config.ts
├── docker-compose.yml      # Production (binds to Tailscale IP)
├── docker-compose.dev.yml  # Development (hot reload, localhost)
└── .env.example
```
