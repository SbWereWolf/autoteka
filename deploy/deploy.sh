#!/usr/bin/env bash
set -euo pipefail

# Auto-deploy (polling) from git:
# - fetch origin/<branch>
# - if new commits -> reset --hard and docker compose up -d --build
# - logs to /var/log/vue-app-deploy.log
# - protected from parallel runs via flock

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/_common.sh"
load_autoteka_env

BRANCH="${BRANCH:-master}"
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
  echo "AUTOTEKA_ROOT=$AUTOTEKA_ROOT"

  # some systems require safe.directory if owner differs
  git config --global --add safe.directory "$AUTOTEKA_ROOT" >/dev/null 2>&1 || true

  cd "$AUTOTEKA_ROOT"

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
  compose pull || true

  compose up -d --build --remove-orphans

  echo "$REMOTE_HASH" > /var/lib/vue-app-last-good || true
  echo "=== $(date) deploy success ($REMOTE_HASH) ==="
} >> "$LOG" 2>&1
