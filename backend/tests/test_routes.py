import pytest


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_list_todos_empty(client):
    response = await client.get("/api/todos")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_todo(client):
    response = await client.post("/api/todos", json={"title": "Buy milk"})
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Buy milk"
    assert "id" in data
    assert "created_at" in data

    # Verify it appears in the list
    list_response = await client.get("/api/todos")
    assert list_response.status_code == 200
    todos = list_response.json()
    assert len(todos) == 1
    assert todos[0]["title"] == "Buy milk"


@pytest.mark.asyncio
async def test_delete_todo(client):
    # Create a todo first
    create_response = await client.post("/api/todos", json={"title": "Delete me"})
    assert create_response.status_code == 201
    todo_id = create_response.json()["id"]

    # Delete it
    delete_response = await client.delete(f"/api/todos/{todo_id}")
    assert delete_response.status_code == 204

    # Verify it's gone
    list_response = await client.get("/api/todos")
    assert list_response.json() == []


@pytest.mark.asyncio
async def test_delete_nonexistent_todo(client):
    response = await client.delete("/api/todos/99999")
    assert response.status_code == 404
