"""Set default avatar URLs for users missing one

Revision ID: 0005
Revises: 00abb0b67e0d
Create Date: 2025-10-13 00:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0005'
down_revision = '00abb0b67e0d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    users = conn.execute(sa.text("SELECT id, avatar_url FROM users")).fetchall()
    for row in users:
        user_id = str(row[0])
        avatar = row[1]
        if not avatar or avatar.strip() == '':
            # Use deterministic pravatar URL based on user id
            url = f"https://i.pravatar.cc/150?u={user_id}"
            conn.execute(sa.text("UPDATE users SET avatar_url = :url WHERE id = :id"), {"url": url, "id": user_id})


def downgrade() -> None:
    # No-op: do not unset avatars on downgrade
    pass


