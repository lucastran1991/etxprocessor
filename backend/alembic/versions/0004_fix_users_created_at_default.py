"""Set default now() for users.created_at

Revision ID: 0004
Revises: 0003
Create Date: 2025-10-13 00:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('users', 'created_at', server_default=sa.text('now()'))


def downgrade() -> None:
    op.alter_column('users', 'created_at', server_default=None)


