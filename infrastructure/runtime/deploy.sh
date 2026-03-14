#!/usr/bin/env bash
set -euo pipefail

# INFRA_ROOT и AUTOTEKA_ROOT — только из аргументов или переменных окружения
if [ -f /etc/autoteka/options.env ]; then
  set -a
  # shellcheck disable=SC1090
  source /etc/autoteka/options.env || true
  set +a
fi
export INFRA_ROOT="${INFRA_ROOT:-}"
export AUTOTEKA_ROOT="${AUTOTEKA_ROOT:-}"
if [ -z "${INFRA_ROOT}" ] || [[ "${INFRA_ROOT}" != /* ]] || \
   [ -z "${AUTOTEKA_ROOT}" ] || [[ "${AUTOTEKA_ROOT}" != /* ]]; then
  echo "INFRA_ROOT и AUTOTEKA_ROOT должны быть заданы абсолютными путями." >&2
  echo "Пример: export INFRA_ROOT=/opt/vue-app/infrastructure" >&2
  echo "        export AUTOTEKA_ROOT=/opt/vue-app" >&2
  echo "  autoteka deploy" >&2
  exit 2
fi
# shellcheck disable=SC1090
source "$INFRA_ROOT/lib/laravel-runtime.sh"
# shellcheck disable=SC1090
source "$INFRA_ROOT/lib/telegram.sh"
load_autoteka_env
load_telegram_env

LOG="/var/log/autoteka-deploy.log"
LOCK="/var/lock/autoteka-deploy.lock"
STATE_DIR="/var/lib"
PHP_READY_TIMEOUT="${PHP_READY_TIMEOUT}"
ADMIN_SMOKE_URL="${ADMIN_SMOKE_URL}"
SCRIPT_ID="deploy"
DEPLOY_ACTION="обновление приложения"
DEPLOY_STAGE="init"

if ! mkdir -p /var/lock /var/log /var/lib 2>/dev/null || \
   [ ! -w /var/lock ] || \
   [ ! -w /var/log ] || \
   [ ! -w /var/lib ]; then
  RUNTIME_DIR="${AUTOTEKA_ROOT}/.runtime"
  mkdir -p "$RUNTIME_DIR/lock" "$RUNTIME_DIR/log" "$RUNTIME_DIR/lib"
  LOG="$RUNTIME_DIR/log/autoteka-deploy.log"
  LOCK="$RUNTIME_DIR/lock/autoteka-deploy.lock"
  STATE_DIR="$RUNTIME_DIR/lib"
fi
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
  api_artisan_in_php '--version >/dev/null'
  admin_artisan_in_php '--version >/dev/null'

  DEPLOY_STAGE="artisan_keygen"
  ensure_app_key

  DEPLOY_STAGE="artisan_migrate"
  admin_artisan_in_php 'migrate --force'

  DEPLOY_STAGE="artisan_seed"
  admin_artisan_in_php 'db:seed --class=AdminUserSeeder --force'

  DEPLOY_STAGE="sqlite_write_check"
  check_sqlite_write_access

  DEPLOY_STAGE="compose_up_web"
  ensure_package_lock_for_deploy
  compose up -d --build --remove-orphans web

  DEPLOY_STAGE="admin_smoke_check"
  http_smoke_check "$ADMIN_SMOKE_URL"

  printf '%s
' "$CURRENT_HEAD" > "$STATE_DIR/vue-app-last-good" || true
  clear_script_notification_locks "$SCRIPT_ID"
  notify_info "$SCRIPT_ID" "$DEPLOY_ACTION завершено успешно" "DEPLOY_SUCCESS" "версия $CURRENT_HEAD, commit $CURRENT_SUBJECT"
  echo "$(date -Is) deploy success ($CURRENT_HEAD)"
  echo "$(date -Is) === deploy end ==="
} >> "$LOG" 2>&1
