#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR" && while [ ! -f "DEPLOY.md" ] && [ "$PWD" != "/" ]; do cd ..; done; pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"
# shellcheck disable=SC1090
source "$DEPLOY_DIR/lib/_common.sh"
load_autoteka_env
load_telegram_env

LOG="/var/log/autoteka-deploy.log"
LOCK="/var/lock/autoteka-deploy.lock"
PHP_READY_TIMEOUT="${PHP_READY_TIMEOUT:-60}"
ADMIN_SMOKE_URL="${ADMIN_SMOKE_URL:-http://127.0.0.1/admin/login}"
SCRIPT_ID="deploy"
DEPLOY_ACTION="обновление приложения"
DEPLOY_STAGE="init"

mkdir -p /var/lock /var/log /var/lib
export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"
export COMPOSE_DOCKER_CLI_BUILD="${COMPOSE_DOCKER_CLI_BUILD:-1}"

on_deploy_error() {
  local exit_code="$?"
  notify_error_once "$SCRIPT_ID" "$DEPLOY_ACTION" "DEPLOY_FAILED" "сбой на этапе '$DEPLOY_STAGE', код выхода $exit_code"
  exit "$exit_code"
}
trap on_deploy_error ERR

exec 9>"$LOCK"
flock -n 9 || exit 0

{
  echo "$(date -Is) === deploy start ==="
  cd "$AUTOTEKA_ROOT"
  CURRENT_HEAD="$(git rev-parse HEAD)"
  CURRENT_SUBJECT="$(git log -1 --format=%s "$CURRENT_HEAD")"
  echo "$(date -Is) rolling out HEAD $CURRENT_HEAD"

  DEPLOY_STAGE="compose_up_php"
  compose up -d --build --remove-orphans php

  DEPLOY_STAGE="wait_for_php"
  wait_for_php_exec_ready "$PHP_READY_TIMEOUT"

  DEPLOY_STAGE="laravel_prepare"
  prepare_laravel_runtime

  DEPLOY_STAGE="artisan_check"
  compose exec -T php sh -lc 'set -eu; cd /var/www/backend; php artisan --version >/dev/null'

  DEPLOY_STAGE="artisan_keygen"
  compose exec -T php sh -lc 'set -eu; cd /var/www/backend; if ! grep -q "^APP_KEY=base64:" .env; then php artisan key:generate --force; fi'

  DEPLOY_STAGE="artisan_migrate"
  compose exec -T php sh -lc 'set -eu; cd /var/www/backend; php artisan migrate --force'

  DEPLOY_STAGE="artisan_seed"
  compose exec -T php sh -lc 'set -eu; cd /var/www/backend; php artisan db:seed --class=AdminUserSeeder --force'

  DEPLOY_STAGE="sqlite_write_check"
  check_sqlite_write_access

  DEPLOY_STAGE="compose_up_web"
  compose up -d --build --remove-orphans web

  DEPLOY_STAGE="admin_smoke_check"
  http_smoke_check "$ADMIN_SMOKE_URL"

  printf '%s
' "$CURRENT_HEAD" > /var/lib/vue-app-last-good || true
  clear_script_notification_locks "$SCRIPT_ID"
  notify_info "$SCRIPT_ID" "$DEPLOY_ACTION завершено успешно" "DEPLOY_SUCCESS" "версия $CURRENT_HEAD, commit $CURRENT_SUBJECT"
  echo "$(date -Is) deploy success ($CURRENT_HEAD)"
  echo "$(date -Is) === deploy end ==="
} >> "$LOG" 2>&1
