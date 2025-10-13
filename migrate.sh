#!/usr/bin/env bash
set -euo pipefail

# Usage: ./migrate.sh "commit message for migration"
# - Autogenerates a new Alembic revision from current models and upgrades to head
# - Requires the backend virtualenv at backend/venv

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_BIN="$BACKEND_DIR/venv/bin"
ALEMBIC_BIN="$VENV_BIN/alembic"

MSG="${1:-auto migration}"

if [[ ! -x "$ALEMBIC_BIN" ]]; then
  echo "Error: Alembic not found at $ALEMBIC_BIN. Ensure backend venv is created and dependencies installed." >&2
  exit 1
fi

export PYTHONPATH="$BACKEND_DIR"
cd "$BACKEND_DIR"

echo "[migrate] Generating revision: $MSG"
"$ALEMBIC_BIN" revision --autogenerate -m "$MSG"

echo "[migrate] Upgrading to head"
"$ALEMBIC_BIN" upgrade head

echo "[migrate] Done"


