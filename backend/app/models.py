from datetime import datetime
from typing import Optional

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, LargeBinary, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    sections: Mapped[list["IdeaSection"]] = relationship(
        back_populates="idea",
        order_by="IdeaSection.display_order",
        cascade="all, delete-orphan",
    )
    widgets: Mapped[list["Widget"]] = relationship(
        back_populates="idea",
        order_by="Widget.display_order",
        cascade="all, delete-orphan",
    )


class IdeaSection(Base):
    __tablename__ = "idea_sections"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    idea_id: Mapped[int] = mapped_column(
        ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False
    )
    section_number: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    voice: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)

    idea: Mapped["Idea"] = relationship(back_populates="sections")
    widgets: Mapped[list["Widget"]] = relationship(
        back_populates="section", order_by="Widget.display_order"
    )


class Widget(Base):
    __tablename__ = "widgets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    idea_id: Mapped[int] = mapped_column(
        ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False
    )
    section_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("idea_sections.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    widget_type: Mapped[str] = mapped_column(
        SAEnum("html", "animated_svg", "chart_svg", "video", name="widget_type_enum"),
        nullable=False,
    )
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_binary: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    idea: Mapped["Idea"] = relationship(back_populates="widgets")
    section: Mapped[Optional["IdeaSection"]] = relationship(back_populates="widgets")
