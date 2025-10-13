"""Change users.role from enum to string

Revision ID: 0006
Revises: 0005
Create Date: 2025-10-13 01:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) Create a temporary string column
    op.add_column('users', sa.Column('role_tmp', sa.String(length=50), nullable=True))

    # 2) Copy data from enum to string
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE users SET role_tmp = LOWER(role::text)"))

    # 3) Drop default on old enum column if any (Postgres)
    try:
        op.execute(sa.text("ALTER TABLE users ALTER COLUMN role DROP DEFAULT"))
    except Exception:
        pass

    # 4) Drop the old enum column
    op.drop_column('users', 'role')

    # 5) Rename temp column to role
    op.alter_column('users', 'role_tmp', new_column_name='role', existing_type=sa.String(length=50), nullable=False)

    # 6) Set server default to 'user' and backfill nulls
    op.execute(sa.text("UPDATE users SET role = 'user' WHERE role IS NULL OR role = ''"))
    op.execute(sa.text("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'"))

    # 7) Drop the enum type if exists
    try:
        op.execute(sa.text("DROP TYPE IF EXISTS userrole"))
    except Exception:
        pass


def downgrade() -> None:
    # Recreate enum type
    userrole = postgresql.ENUM('ADMIN', 'USER', 'MODERATOR', name='userrole')
    userrole.create(op.get_bind(), checkfirst=True)

    # Add enum column back nullable
    op.add_column('users', sa.Column('role_enum', userrole, nullable=True))

    # Copy string values into enum (uppercase to match enum labels)
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE users
        SET role_enum = CASE UPPER(role)
            WHEN 'ADMIN' THEN 'ADMIN'::userrole
            WHEN 'MODERATOR' THEN 'MODERATOR'::userrole
            ELSE 'USER'::userrole
        END
    """))

    # Drop default on string column
    try:
        op.execute(sa.text("ALTER TABLE users ALTER COLUMN role DROP DEFAULT"))
    except Exception:
        pass

    # Drop string column and rename enum column back to role
    op.drop_column('users', 'role')
    op.alter_column('users', 'role_enum', new_column_name='role')

    # Set default back to USER and not null
    op.execute(sa.text("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'USER'::userrole"))
    op.alter_column('users', 'role', existing_type=userrole, nullable=False)

