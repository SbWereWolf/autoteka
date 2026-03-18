#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"
source "$INFRA_ROOT/lib/deploy-flow.sh"
source "$INFRA_ROOT/lib/telegram.sh"
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

  DEPLOY_STAGE="init"

  autoteka_run_deploy_flow --mode=deploy

  printf '%s\n' "$CURRENT_HEAD" > "$STATE_DIR/autoteka-http-last-good" || true
  clear_script_notification_locks "$SCRIPT_ID"
  load_telegram_env
  if telegram_enabled; then
    notify_info "$SCRIPT_ID" "$DEPLOY_ACTION завершено успешно" "DEPLOY_SUCCESS" "версия $CURRENT_HEAD, commit $CURRENT_SUBJECT"
  else
    echo "$(date -Is) deploy: telegram отключён (TELEGRAM_TOKEN или TELEGRAM_CHAT не заданы)"
  fi
  echo "$(date -Is) deploy success ($CURRENT_HEAD)"
  echo "$(date -Is) === deploy end ==="
} >> "$LOG" 2>&1
