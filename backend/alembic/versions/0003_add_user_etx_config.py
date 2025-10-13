"""Add etx_config column to users

Revision ID: 0003
Revises: 0002
Create Date: 2025-10-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('etx_config', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'etx_config')


