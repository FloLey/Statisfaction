import os
import subprocess
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .models import Idea, IdeaSection, Todo, Widget
from .schemas import IdeaDetailRead, IdeaRead, TodoCreate, TodoRead

_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5174")
CORS_ORIGINS = [o.strip() for o in _cors_origins.split(",")]


def run_migrations() -> None:
    subprocess.run(["alembic", "upgrade", "head"], check=True)


def run_seeds() -> None:
    subprocess.run(["python", "scripts/seed_ideas.py"], check=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    run_seeds()
    yield


app = FastAPI(title="Statisfaction API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "DELETE"],
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


@app.delete("/api/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(todo_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalar_one_or_none()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    await db.delete(todo)
    await db.commit()


@app.get("/api/ideas", response_model=list[IdeaRead])
async def list_ideas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Idea).order_by(Idea.created_at.desc()))
    return result.scalars().all()


@app.get("/api/ideas/{slug}", response_model=IdeaDetailRead)
async def get_idea(slug: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Idea)
        .where(Idea.slug == slug)
        .options(
            selectinload(Idea.sections).selectinload(IdeaSection.widgets),
            selectinload(Idea.widgets),
        )
    )
    idea = result.scalar_one_or_none()
    if idea is None:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea
