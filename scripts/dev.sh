#!/usr/bin/env bash
# Starts the Vite dev server in the background and logs its output.
# Usage: scripts/dev.sh [port]   (default port: 5173)
set -euo pipefail

PORT="${1:-5173}"
LOG_FILE="/tmp/carb-planner-dev.log"

cd "$(dirname "$0")/.."

if lsof -i ":$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Dev server already running on port $PORT"
  echo "Local: http://localhost:$PORT/en/calculator/"
  exit 0
fi

nohup npm run dev -- --port "$PORT" > "$LOG_FILE" 2>&1 &
disown

sleep 2
echo "Dev server starting (logs: $LOG_FILE)"
cat "$LOG_FILE"
