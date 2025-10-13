#!/usr/bin/env bash
set -euo pipefail

# ETX Processor - Production Deployment Script
# - Starts backend with Uvicorn in production mode
# - Builds and starts Next.js in production mode
# - Writes PID files and logs to project root

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

FORCE=0
if [[ ${1:-} == "--force" || ${1:-} == "-f" ]]; then FORCE=1; fi

echo "==> Deploying ETX Processor (production)${FORCE:+ (force)}"

check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then return 0; else return 1; fi
}

kill_port() {
  local PORT=$1
  if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "Killing processes on port $PORT"
    lsof -Pi :$PORT -sTCP:LISTEN -t | xargs -r kill -9 || true
  fi
}

deploy_backend() {
  echo "-- backend"
  cd "$BACKEND_DIR"
  if [ ! -d venv ]; then python3 -m venv venv; fi
  source venv/bin/activate
  pip install -r requirements.txt
  ./venv/bin/alembic upgrade head || alembic upgrade head
  if check_port 8000; then
    if [[ $FORCE -eq 1 ]]; then kill_port 8000; sleep 1; fi
  fi
  if check_port 8000; then echo "port 8000 in use; skipping"; else
    # Unified log with [BE] tag
    nohup ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 2>&1 | sed -e 's/^/[BE] /' >> "$ROOT_DIR/system.log" &
    echo $! > "$ROOT_DIR/backend.pid"
  fi
}

deploy_frontend() {
  echo "-- frontend"
  cd "$FRONTEND_DIR"
  npm install --silent
  npm run build
  if check_port 3000; then
    if [[ $FORCE -eq 1 ]]; then kill_port 3000; sleep 1; fi
  fi
  if check_port 3000; then echo "port 3000 in use; skipping"; else
    # Unified log with [FE] tag
    nohup npm run start -- -p 3000 2>&1 | sed -e 's/^/[FE] /' >> "$ROOT_DIR/system.log" &
    echo $! > "$ROOT_DIR/frontend.pid"
  fi
}

deploy_backend
deploy_frontend

echo "==> Deployment complete"
echo "API:      http://0.0.0.0:8000"
echo "Frontend: http://0.0.0.0:3000"


