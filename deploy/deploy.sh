#!/usr/bin/env bash
set -euo pipefail

# Rollout current git HEAD:
# - does not fetch/reset git state
# - can be rerun manually for the current working copy
# - logs to /var/log/autoteka-deploy.log
# - protected from parallel runs via flock

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/_common.sh"
load_autoteka_env
load_telegram_env

LOG="/var/log/autoteka-deploy.log"
LOCK="/var/lock/autoteka-deploy.lock"
PHP_READY_TIMEOUT="${PHP_READY_TIMEOUT:-60}"
ADMIN_SMOKE_URL="${ADMIN_SMOKE_URL:-http://127.0.0.1/admin/login}"
SCRIPT_ID="deploy"
DEPLOY_ACTION="обновление приложения"
DEPLOY_STAGE="инициализация"
DEPLOY_REMOTE_HEAD=""
DEPLOY_REMOTE_SUBJECT=""

mkdir -p /var/lock /var/log /var/lib

log() {
  echo "$(date -Is) $*"
}

log_telegram_status() {
  local env_file="${TELEGRAM_ENV_FILE_DEFAULT}"

  log "telegram env path: $env_file"
  if [ -f "$env_file" ]; then
    log "telegram env file: found"
  else
    log "telegram env file: missing"
  fi

  if [ -n "${TELEGRAM_TOKEN:-}" ]; then
    log "telegram token: set"
  else
    log "telegram token: missing"
  fi

  if [ -n "${TELEGRAM_CHAT:-}" ]; then
    log "telegram chat: set"
  else
    log "telegram chat: missing"
  fi

  if telegram_enabled; then
    log "telegram notifications: enabled"
  else
    log "telegram notifications: disabled"
  fi
}

deploy_reason_code() {
  case "$1" in
    compose_pull)
      echo "DEPLOY_COMPOSE_PULL_FAILED"
      ;;
    compose_up_php)
      echo "DEPLOY_PHP_UP_FAILED"
      ;;
    laravel_prepare)
      echo "DEPLOY_LARAVEL_PREPARE_FAILED"
      ;;
    wait_for_php)
      echo "DEPLOY_PHP_WAIT_FAILED"
      ;;
    composer_install)
      echo "DEPLOY_COMPOSER_INSTALL_FAILED"
      ;;
    artisan_check)
      echo "DEPLOY_ARTISAN_CHECK_FAILED"
      ;;
    artisan_down)
      echo "DEPLOY_MAINTENANCE_DOWN_FAILED"
      ;;
    artisan_keygen)
      echo "DEPLOY_KEYGEN_FAILED"
      ;;
    artisan_migrate)
      echo "DEPLOY_MIGRATE_FAILED"
      ;;
    artisan_seed)
      echo "DEPLOY_SEED_FAILED"
      ;;
    sqlite_write_check)
      echo "DEPLOY_SQLITE_WRITE_CHECK_FAILED"
      ;;
    artisan_up)
      echo "DEPLOY_MAINTENANCE_UP_FAILED"
      ;;
    compose_up_web)
      echo "DEPLOY_WEB_UP_FAILED"
      ;;
    admin_smoke_check)
      echo "DEPLOY_ADMIN_SMOKE_CHECK_FAILED"
      ;;
    *)
      echo "DEPLOY_UNKNOWN_FAILED"
      ;;
  esac
}

on_deploy_error() {
  local exit_code="$?"
  local reason_code

  reason_code="$(deploy_reason_code "$DEPLOY_STAGE")"
  log "deploy failed: stage=$DEPLOY_STAGE exit_code=$exit_code"
  notify_error_once "$SCRIPT_ID" "$DEPLOY_ACTION" "$reason_code" \
    "сбой на этапе '$DEPLOY_STAGE', код выхода $exit_code"

  exit "$exit_code"
}

trap on_deploy_error ERR

exec 9>"$LOCK"
if ! flock -n 9; then
  exit 0
fi

{
  log "=== deploy start ==="
  log "AUTOTEKA_ROOT=$AUTOTEKA_ROOT"
  log_telegram_status

  cd "$AUTOTEKA_ROOT"

  CURRENT_HEAD="$(git rev-parse HEAD)"
  CURRENT_SUBJECT="$(git log -1 --format=%s "$CURRENT_HEAD")"
  DEPLOY_REMOTE_HEAD="$CURRENT_HEAD"

  log "rolling out HEAD $CURRENT_HEAD"
  log "commit subject: $CURRENT_SUBJECT"

  # optional: update base images
  DEPLOY_STAGE="compose_pull"
  compose pull

  DEPLOY_STAGE="compose_up_php"
  compose up -d --build --remove-orphans php

  DEPLOY_STAGE="wait_for_php"
  wait_for_php_exec_ready "$PHP_READY_TIMEOUT"

  DEPLOY_STAGE="laravel_prepare"
  prepare_laravel_runtime

  DEPLOY_STAGE="composer_install"
  compose exec -T php sh -lc '
    set -eu
    cd /var/www/backend
    [ -f .env ] || cp example.env .env
    composer install --no-interaction --prefer-dist --optimize-autoloader
  '

  DEPLOY_STAGE="artisan_check"
  compose exec -T php sh -lc '
    set -eu
    cd /var/www/backend
    php artisan --version >/dev/null
  '

  clear_laravel_optimizations

  DEPLOY_STAGE="artisan_down"
  compose exec -T php sh -lc '
    set -eu
    cd /var/www/backend
    php artisan down
  '

  DEPLOY_STAGE="artisan_keygen"
  compose exec -T php sh -lc '
    set -eu
    cd /var/www/backend
    if ! grep -q "^APP_KEY=base64:" .env; then
      php artisan key:generate --force
    fi
  '

  DEPLOY_STAGE="artisan_migrate"
  compose exec -T php sh -lc '
    set -eu
    cd /var/www/backend
    php artisan migrate --force
  '

  DEPLOY_STAGE="artisan_seed"
  compose exec -T php sh -lc '
    set -eu
    cd /var/www/backend
    php artisan db:seed --class=AdminUserSeeder --force
  '

  DEPLOY_STAGE="sqlite_write_check"
  check_sqlite_write_access

  DEPLOY_STAGE="artisan_up"
  compose exec -T php sh -lc '
    set -eu
    cd /var/www/backend
    php artisan up
  '

  DEPLOY_STAGE="compose_up_web"
  compose up -d --build --remove-orphans web

  DEPLOY_STAGE="admin_smoke_check"
  http_smoke_check "$ADMIN_SMOKE_URL"

  printf '%s\n' "$CURRENT_HEAD" > /var/lib/vue-app-last-good || true
  DEPLOY_REMOTE_SUBJECT="$CURRENT_SUBJECT"
  clear_script_notification_locks "$SCRIPT_ID"
  notify_info "$SCRIPT_ID" "$DEPLOY_ACTION завершено успешно" "DEPLOY_SUCCESS" \
    "версия $CURRENT_HEAD, commit $DEPLOY_REMOTE_SUBJECT"
  log "deploy success ($CURRENT_HEAD)"
  log "=== deploy end ==="
} >> "$LOG" 2>&1
