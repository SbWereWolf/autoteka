#!/bin/bash
set -euo pipefail

# Auto-deploy (polling) from git:
# - fetch origin/main (by default)
# - if new commits -> reset --hard and docker compose up -d --build
# - logs to /var/log/vue-app-deploy.log
# - protected from parallel runs via flock

APP_DIR="/opt/vue-app"
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
LOG="/var/log/vue-app-deploy.log"
LOCK="/var/lock/vue-app-deploy.lock"

mkdir -p /var/lock /var/log /var/lib

exec 9>"$LOCK"
if ! flock -n 9; then
  exit 0
fi

{
  echo "=== $(date) deploy start ==="

  # some systems require safe.directory if owner differs
  git config --global --add safe.directory "$APP_DIR" >/dev/null 2>&1 || true

  cd "$APP_DIR"

  git fetch "$REMOTE" "$BRANCH"

  LOCAL="$(git rev-parse HEAD)"
  REMOTE_HASH="$(git rev-parse "$REMOTE/$BRANCH")"

  if [ "$LOCAL" = "$REMOTE_HASH" ]; then
    echo "$(date) no changes ($LOCAL)"
    exit 0
  fi

  echo "$(date) updating $LOCAL -> $REMOTE_HASH"
  echo "$LOCAL" > /var/lib/vue-app-prev-commit || true

  git reset --hard "$REMOTE/$BRANCH"

  # optional: update base images
  docker compose pull || true

  docker compose up -d --build --remove-orphans

  echo "$REMOTE_HASH" > /var/lib/vue-app-last-good || true
  echo "=== $(date) deploy success ($REMOTE_HASH) ==="
} >> "$LOG" 2>&1
