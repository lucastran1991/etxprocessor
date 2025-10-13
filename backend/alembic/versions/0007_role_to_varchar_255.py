"""Change users.role to VARCHAR(255) NOT NULL with default 'user'

Revision ID: 0007
Revises: 0006
Create Date: 2025-10-13 19:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure no null/empty values before enforcing NOT NULL
    op.execute(sa.text("UPDATE users SET role = 'user' WHERE role IS NULL OR role = ''"))
    # Alter column type and set NOT NULL
    op.alter_column('users', 'role',
                    existing_type=sa.String(length=50),
                    type_=sa.String(length=255),
                    existing_nullable=False,
                    nullable=False)
    # Ensure server default
    op.execute(sa.text("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'"))


def downgrade() -> None:
    # Revert to String(50)
    op.alter_column('users', 'role',
                    existing_type=sa.String(length=255),
                    type_=sa.String(length=50),
                    existing_nullable=False,
                    nullable=False)

