"""add completed_at column

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-24

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = 'todos' AND column_name = 'completed_at'"
        )
    )
    if result.fetchone() is None:
        op.add_column(
            "todos",
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = 'todos' AND column_name = 'completed_at'"
        )
    )
    if result.fetchone() is not None:
        op.drop_column("todos", "completed_at")
