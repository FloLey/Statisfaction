import os

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .models import Todo
from .schemas import TodoCreate, TodoOut


ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5174").split(",")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/todos", response_model=list[TodoOut])
async def list_todos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Todo).order_by(Todo.created_at.desc()))
    return result.scalars().all()


@app.post("/api/todos", response_model=TodoOut, status_code=201)
async def create_todo(body: TodoCreate, db: AsyncSession = Depends(get_db)):
    todo = Todo(title=body.title)
    db.add(todo)
    await db.commit()
    await db.refresh(todo)
    return todo


@app.delete("/api/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: int, db: AsyncSession = Depends(get_db)):
    todo = await db.get(Todo, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    await db.delete(todo)
    await db.commit()
    return Response(status_code=204)
