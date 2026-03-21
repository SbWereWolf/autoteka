#!/usr/bin/env sh
set -eu

cd /workspace/frontend

if [ ! -f .env ] && [ -f example.env ]; then
  cp example.env .env
fi

LOCK_HASH_FILE="node_modules/.package-lock.sha256"
CURRENT_LOCK_HASH="$(sha256sum package-lock.json | awk '{print $1}')"

needs_install="0"

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null || true)" ]; then
  needs_install="1"
elif [ ! -f "$LOCK_HASH_FILE" ] || [ "$(cat "$LOCK_HASH_FILE" 2>/dev/null || true)" != "$CURRENT_LOCK_HASH" ]; then
  needs_install="1"
elif ! node -e "require.resolve('vite/package.json'); require.resolve('@vitejs/plugin-vue/package.json'); require.resolve('vite-plugin-vue-devtools/package.json')" >/dev/null 2>&1; then
  needs_install="1"
fi

if [ "$needs_install" = "1" ]; then
  npm ci
  printf '%s\n' "$CURRENT_LOCK_HASH" > "$LOCK_HASH_FILE"
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
