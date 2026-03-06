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
PHP_READY_TIMEOUT="${PHP_READY_TIMEOUT:-60}"

mkdir -p /var/lock /var/log /var/lib

wait_for_php() {
  local started_at
  started_at="$(date +%s)"

  while true; do
    if compose exec -T php sh -lc 'cd /var/www/backend && pwd >/dev/null' >/dev/null 2>&1; then
      return 0
    fi

    if [ $(( $(date +%s) - started_at )) -ge "$PHP_READY_TIMEOUT" ]; then
      echo "$(date) php container did not become ready within ${PHP_READY_TIMEOUT}s"
      return 1
    fi

    sleep 2
  done
}

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

  compose up -d --build --remove-orphans php
  wait_for_php

  compose exec -T php sh -lc '
    set -eu
    cd /var/www/backend
    [ -f .env ] || cp example.env .env
    mkdir -p database
    touch database/database.sqlite
    composer install --no-interaction --prefer-dist --optimize-autoloader
    php artisan --version >/dev/null
    php artisan down --force
    if ! grep -q "^APP_KEY=base64:" .env; then
      php artisan key:generate --force
    fi
    php artisan migrate --force
    php artisan db:seed --class=AdminUserSeeder --force
    php artisan up
  '

  compose up -d --build --remove-orphans web

  echo "$REMOTE_HASH" > /var/lib/vue-app-last-good || true
  echo "=== $(date) deploy success ($REMOTE_HASH) ==="
} >> "$LOG" 2>&1
