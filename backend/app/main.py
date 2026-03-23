import os
import subprocess
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .models import Todo
from .schemas import DailyStat, DailyStatsResponse, TodoCreate, TodoRead

_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5174")
CORS_ORIGINS = [o.strip() for o in _cors_origins.split(",")]


def run_migrations() -> None:
    subprocess.run(["alembic", "upgrade", "head"], check=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    yield


app = FastAPI(title="Statisfaction API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "DELETE", "PATCH"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/todos", response_model=list[TodoRead])
async def list_todos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Todo).order_by(Todo.created_at.desc()))
    return result.scalars().all()


@app.post("/api/todos", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
async def create_todo(body: TodoCreate, db: AsyncSession = Depends(get_db)):
    todo = Todo(title=body.title)
    db.add(todo)
    await db.commit()
    await db.refresh(todo)
    return todo


@app.get("/api/todos/stats/daily", response_model=DailyStatsResponse)
async def daily_stats(db: AsyncSession = Depends(get_db)):
    # Completed per day
    completed_date = func.date(Todo.completed_at).label("date")
    completed_result = await db.execute(
        select(completed_date, func.count().label("total"))
        .where(Todo.completed_at.isnot(None))
        .group_by(completed_date)
        .order_by(completed_date)
    )
    completed = [
        DailyStat(date=str(row.date), count=row.total) for row in completed_result.all()
    ]

    # Created per day
    created_date = func.date(Todo.created_at).label("date")
    created_result = await db.execute(
        select(created_date, func.count().label("total"))
        .group_by(created_date)
        .order_by(created_date)
    )
    created = [
        DailyStat(date=str(row.date), count=row.total) for row in created_result.all()
    ]

    return DailyStatsResponse(completed=completed, created=created)


@app.patch(
    "/api/todos/{todo_id}/complete",
    response_model=TodoRead,
)
async def toggle_complete(todo_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalar_one_or_none()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo.completed_at is None:
        todo.completed_at = datetime.now(timezone.utc)
    else:
        todo.completed_at = None
    await db.commit()
    await db.refresh(todo)
    return todo


@app.delete("/api/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(todo_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalar_one_or_none()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    await db.delete(todo)
    await db.commit()
