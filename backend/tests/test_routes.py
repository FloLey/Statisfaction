import os

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
