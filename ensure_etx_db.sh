#!/bin/bash

# Ensure role "user" (password: "password") and database "etxprocessor" exist.
# Uses a superuser/admin DSN to perform operations.
#
# Usage:
#   ./ensure_etx_db.sh
#   ADMIN_DSN="postgresql://postgres:postgres@127.0.0.1:5432/postgres" ./ensure_etx_db.sh

set -euo pipefail

ADMIN_DSN=${ADMIN_DSN:-"postgresql://postgres:postgres@127.0.0.1:5432/postgres"}

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Please install PostgreSQL client tools."
  exit 1
fi

echo "Using admin DSN: ${ADMIN_DSN}"

# Create role "postgres" if missing (psql \gexec trick avoids errors if exists)
psql "${ADMIN_DSN}" -v ON_ERROR_STOP=1 -c \
  "SELECT 'CREATE ROLE \"postgres\" LOGIN PASSWORD ''postgres''' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'user')\\gexec"

# Create database if missing, owned by "postgres"
psql "${ADMIN_DSN}" -v ON_ERROR_STOP=1 -c \
  "SELECT 'CREATE DATABASE etxprocessor OWNER \"postgres\"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'etxprocessor')\\gexec"

# Grant privileges
psql "${ADMIN_DSN%/postgres}/etxprocessor" -v ON_ERROR_STOP=1 -c \
  'GRANT ALL PRIVILEGES ON SCHEMA public TO "postgres"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "user"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "user";'

# Validate application DSN
APP_DSN="postgresql://postgres:postgres@127.0.0.1:5432/etxprocessor"
echo "Validating application DSN: ${APP_DSN}"
psql "${APP_DSN}" -tAc "SELECT current_user || '@' || current_database();"

echo "Done."


