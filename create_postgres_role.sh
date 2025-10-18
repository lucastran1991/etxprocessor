#!/bin/bash

# Create or update the PostgreSQL role "postgres" with password "postgres".
# Usage:
#   ADMIN_DSN="postgresql://admin:adminpass@127.0.0.1:5432/postgres" ./create_postgres_role.sh
# If ADMIN_DSN is not provided, defaults to postgresql://127.0.0.1:5432/postgres

set -euo pipefail

ADMIN_DSN=${ADMIN_DSN:-"postgresql://127.0.0.1:5432/postgres"}

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Please install PostgreSQL client tools."
  exit 1
fi

# Optional: ensure Postgres appears to be running on 5432
if ! lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Warning: Postgres does not appear to be listening on 5432. Continuing anyway..."
fi

echo "Using admin DSN: ${ADMIN_DSN}"

# Perform role create/update using an anonymous DO block
psql "${ADMIN_DSN}" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
    RAISE NOTICE 'Role postgres exists; updating password.';
    ALTER ROLE postgres WITH PASSWORD 'postgres';
  ELSE
    RAISE NOTICE 'Role postgres does not exist; creating with SUPERUSER and LOGIN.';
    CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';
  END IF;
END
$$;
SQL

echo "Role postgres ensured with specified password."


