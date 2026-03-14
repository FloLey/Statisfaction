from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class TodoCreate(BaseModel):
    title: str


class TodoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime


class WidgetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: Optional[str]
    description: Optional[str]
    widget_type: str
    content: Optional[str]
    mime_type: Optional[str]
    metadata_json: Optional[dict[str, Any]]
    display_order: int


class IdeaSectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    section_number: Optional[str]
    title: str
    voice: Optional[str]
    content: str
    display_order: int
    widgets: list[WidgetRead]


class IdeaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    summary: Optional[str]
    created_at: datetime


class IdeaDetailRead(IdeaRead):
    sections: list[IdeaSectionRead]
    widgets: list[WidgetRead]
