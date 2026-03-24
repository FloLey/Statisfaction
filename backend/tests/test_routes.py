import os
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# Override DATABASE_URL before importing the app
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://statisfaction:statisfaction@localhost:5432/statisfactiondb_test",
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Todo  # noqa: E402


@pytest_asyncio.fixture(scope="session")
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def clean_tables(db_engine):
    yield
    async with db_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())


@pytest_asyncio.fixture
async def db_session(db_engine):
    session_factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine):
    session_factory = async_sessionmaker(db_engine, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_create_todo(client: AsyncClient):
    response = await client.post("/api/todos", json={"title": "Buy milk"})
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Buy milk"
    assert "id" in data
    assert "created_at" in data
    assert data["completed_at"] is None


@pytest.mark.asyncio
async def test_list_todos(client: AsyncClient):
    await client.post("/api/todos", json={"title": "Task 1"})
    await client.post("/api/todos", json={"title": "Task 2"})
    response = await client.get("/api/todos")
    assert response.status_code == 200
    todos = response.json()
    assert len(todos) == 2
    titles = {t["title"] for t in todos}
    assert titles == {"Task 1", "Task 2"}


@pytest.mark.asyncio
async def test_delete_todo(client: AsyncClient):
    create_resp = await client.post("/api/todos", json={"title": "To delete"})
    todo_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/todos/{todo_id}")
    assert delete_resp.status_code == 204

    list_resp = await client.get("/api/todos")
    assert list_resp.json() == []


@pytest.mark.asyncio
async def test_delete_todo_not_found(client: AsyncClient):
    response = await client.delete("/api/todos/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_complete_todo(client: AsyncClient):
    create_resp = await client.post("/api/todos", json={"title": "To complete"})
    todo_id = create_resp.json()["id"]

    patch_resp = await client.patch(f"/api/todos/{todo_id}/complete")
    assert patch_resp.status_code == 200
    data = patch_resp.json()
    assert data["completed_at"] is not None

    # Verify it persists in the list
    list_resp = await client.get("/api/todos")
    todo = list_resp.json()[0]
    assert todo["completed_at"] is not None


@pytest.mark.asyncio
async def test_uncomplete_todo(client: AsyncClient):
    create_resp = await client.post("/api/todos", json={"title": "Toggle me"})
    todo_id = create_resp.json()["id"]

    # Complete
    await client.patch(f"/api/todos/{todo_id}/complete")
    # Uncomplete
    patch_resp = await client.patch(f"/api/todos/{todo_id}/complete")
    assert patch_resp.status_code == 200
    assert patch_resp.json()["completed_at"] is None


@pytest.mark.asyncio
async def test_complete_todo_not_found(client: AsyncClient):
    response = await client.patch("/api/todos/99999/complete")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_daily_stats_empty(client: AsyncClient):
    response = await client.get("/api/todos/stats/daily")
    assert response.status_code == 200
    data = response.json()
    assert data["completed"] == []
    assert data["created"] == []


@pytest.mark.asyncio
async def test_daily_stats(client: AsyncClient, db_session):
    today = datetime.now(timezone.utc)
    yesterday = today - timedelta(days=1)

    # Insert todos with specific dates via the DB session
    todo1 = Todo(title="T1", created_at=yesterday)
    todo2 = Todo(title="T2", created_at=yesterday)
    todo3 = Todo(title="T3", created_at=today, completed_at=today)
    todo4 = Todo(title="T4", created_at=today, completed_at=yesterday)
    db_session.add_all([todo1, todo2, todo3, todo4])
    await db_session.commit()

    response = await client.get("/api/todos/stats/daily")
    assert response.status_code == 200
    data = response.json()

    # Created: 2 yesterday, 2 today
    created = {s["date"]: s["count"] for s in data["created"]}
    assert created[str(yesterday.date())] == 2
    assert created[str(today.date())] == 2

    # Completed: 1 yesterday, 1 today
    completed = {s["date"]: s["count"] for s in data["completed"]}
    assert completed[str(yesterday.date())] == 1
    assert completed[str(today.date())] == 1
