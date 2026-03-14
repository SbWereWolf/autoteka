#!/usr/bin/env sh
set -eu

cd /workspace/frontend

if [ ! -f .env ] && [ -f example.env ]; then
  cp example.env .env
fi

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null || true)" ]; then
  npm ci
fi

MODE="${FRONTEND_MODE}"
PORT="${FRONTEND_PORT}"

case "$MODE" in
  source)
    exec npm run dev -- --host 0.0.0.0 --port "$PORT"
    ;;
  bundle-watch)
    mkdir -p dist
    exec npm run build -- --watch
    ;;
  *)
    echo "Unsupported FRONTEND_MODE=$MODE. Use source or bundle-watch." >&2
    exit 1
    ;;
esac
