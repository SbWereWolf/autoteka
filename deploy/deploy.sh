#!/usr/bin/env bash
set -euo pipefail

# Auto-deploy (polling) from git:
# - fetch origin/<branch>
# - if new commits -> stash local changes, reset --hard and docker compose up -d --build
# - logs to /var/log/vue-app-deploy.log
# - protected from parallel runs via flock

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/_common.sh"
load_autoteka_env
load_telegram_env

BRANCH="${BRANCH:-master}"
REMOTE="${REMOTE:-origin}"
LOG="/var/log/vue-app-deploy.log"
LOCK="/var/lock/vue-app-deploy.lock"
PHP_READY_TIMEOUT="${PHP_READY_TIMEOUT:-60}"
SCRIPT_ID="deploy"
DEPLOY_ACTION="обновление приложения"
DEPLOY_STAGE="инициализация"
DEPLOY_REMOTE_HEAD=""
DEPLOY_REMOTE_SUBJECT=""

mkdir -p /var/lock /var/log /var/lib

prepare_backend_runtime() {
  compose exec -T php sh -lc '
    set -eu
    cd /var/www/backend
    mkdir -p \
      bootstrap/cache \
      database \
      storage \
      storage/framework \
      storage/framework/cache \
      storage/framework/sessions \
      storage/framework/views \
      storage/logs
    touch database/database.sqlite
    chown -R www-data:www-data \
      bootstrap/cache \
      database \
      storage
    chmod -R ug+rwX \
      bootstrap/cache \
      database \
      storage
  '
}

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

log() {
  echo "$(date -Is) $*"
}

deploy_reason_code() {
  case "$1" in
    git_fetch)
      echo "DEPLOY_FETCH_FAILED"
      ;;
    git_stash)
      echo "DEPLOY_STASH_FAILED"
      ;;
    git_stash_verify)
      echo "DEPLOY_WORKTREE_DIRTY_AFTER_STASH"
      ;;
    git_reset)
      echo "DEPLOY_RESET_FAILED"
      ;;
    compose_pull)
      echo "DEPLOY_COMPOSE_PULL_FAILED"
      ;;
    compose_up_php)
      echo "DEPLOY_PHP_UP_FAILED"
      ;;
    prepare_runtime_permissions)
      echo "DEPLOY_RUNTIME_PERMISSIONS_FAILED"
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
    artisan_up)
      echo "DEPLOY_MAINTENANCE_UP_FAILED"
      ;;
    compose_up_web)
      echo "DEPLOY_WEB_UP_FAILED"
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

  # some systems require safe.directory if owner differs
  git config --global --add safe.directory "$AUTOTEKA_ROOT" >/dev/null 2>&1 || true

  cd "$AUTOTEKA_ROOT"

  DEPLOY_STAGE="git_fetch"
  git fetch "$REMOTE" "$BRANCH"

  LOCAL="$(git rev-parse HEAD)"
  REMOTE_HASH="$(git rev-parse "$REMOTE/$BRANCH")"
  DEPLOY_REMOTE_HEAD="$REMOTE_HASH"

  if [ "$LOCAL" = "$REMOTE_HASH" ]; then
    clear_script_notification_locks "$SCRIPT_ID"
    log "no changes ($LOCAL)"
    exit 0
  fi

  log "updating $LOCAL -> $REMOTE_HASH"

  WORKTREE_STATUS="$(git status --porcelain --untracked-files=all)"
  if [ -n "$WORKTREE_STATUS" ]; then
    STASH_MESSAGE="$(date -Is) autoteka auto deploy: очистка рабочей копии перед обновлением"

    DEPLOY_STAGE="git_stash"
    log "worktree is dirty; creating stash before update"
    STASH_OUTPUT="$(git stash push --include-untracked -m "$STASH_MESSAGE" 2>&1)"
    log "git stash result: $STASH_OUTPUT"

    STASH_ENTRY="$(git stash list -1 --format='%gd %cr %s')"
    if [ -n "$STASH_ENTRY" ]; then
      log "stash saved for restore: $STASH_ENTRY"
    else
      log "stash command completed without visible stash entry"
    fi

    DEPLOY_STAGE="git_stash_verify"
    REMAINING_STATUS="$(git status --porcelain --untracked-files=all)"
    if [ -n "$REMAINING_STATUS" ]; then
      log "worktree still dirty after stash:"
      printf '%s\n' "$REMAINING_STATUS"
      exit 1
    fi
  else
    log "worktree already clean; stash not required"
  fi

  printf '%s\n' "$LOCAL" > /var/lib/vue-app-prev-commit || true

  DEPLOY_STAGE="git_reset"
  git reset --hard "$REMOTE/$BRANCH"

  # optional: update base images
  DEPLOY_STAGE="compose_pull"
  compose pull

  DEPLOY_STAGE="compose_up_php"
  compose up -d --build --remove-orphans php

  DEPLOY_STAGE="wait_for_php"
  wait_for_php

  DEPLOY_STAGE="prepare_runtime_permissions"
  prepare_backend_runtime

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

  DEPLOY_STAGE="artisan_up"
  compose exec -T php sh -lc '
    set -eu
    cd /var/www/backend
    php artisan up
  '

  DEPLOY_STAGE="compose_up_web"
  compose up -d --build --remove-orphans web

  printf '%s\n' "$REMOTE_HASH" > /var/lib/vue-app-last-good || true
  DEPLOY_REMOTE_SUBJECT="$(git log -1 --format=%s "$REMOTE_HASH")"
  clear_script_notification_locks "$SCRIPT_ID"
  notify_info "$SCRIPT_ID" "$DEPLOY_ACTION завершено успешно" "DEPLOY_SUCCESS" \
    "версия $REMOTE_HASH, commit $DEPLOY_REMOTE_SUBJECT"
  log "deploy success ($REMOTE_HASH)"
  log "commit subject: $DEPLOY_REMOTE_SUBJECT"
  log "=== deploy end ==="
} >> "$LOG" 2>&1
