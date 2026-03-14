"""convert widget_type to enum

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-14

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

widget_type_enum = postgresql.ENUM(
    "html", "animated_svg", "chart_svg", "video",
    name="widget_type_enum",
)


def upgrade() -> None:
    widget_type_enum.create(op.get_bind(), checkfirst=True)
    op.alter_column(
        "widgets",
        "widget_type",
        type_=widget_type_enum,
        postgresql_using="widget_type::widget_type_enum",
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "widgets",
        "widget_type",
        type_=sa.String(50),
        postgresql_using="widget_type::varchar",
        existing_nullable=False,
    )
    widget_type_enum.drop(op.get_bind(), checkfirst=True)
