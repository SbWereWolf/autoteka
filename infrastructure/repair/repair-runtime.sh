#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"
source "$INFRA_ROOT/lib/laravel-runtime.sh"
source "$INFRA_ROOT/lib/health-state.sh"

DRY_RUN=0
PRESERVE_HEALTH_STATE=0
PHP_READY_TIMEOUT="${PHP_READY_TIMEOUT}"
BACKEND_SMOKE_URL="${BACKEND_SMOKE_URL}"
API_SMOKE_URL="${API_SMOKE_URL}"
ADMIN_SMOKE_URL="${ADMIN_SMOKE_URL}"
SCRIPT_ID="server-watchdog"

usage() {
  cat <<'USAGE'
Usage:
  autoteka repair-runtime [--dry-run] [--preserve-health-state]

What it does:
  - rebuilds/starts php
  - prepares Laravel writable runtime
  - clears Laravel optimization caches
  - verifies sqlite/session/cache write access
  - rebuilds/starts web
  - runs smoke checks: /up, /api/v1/category-list, /admin/login

Flags:
  -n, --dry-run              Show what would be executed.
      --preserve-health-state
                             Do not reset watchdog health incident state.
  -h, --help                 Show this help.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    -n|--dry-run)
      DRY_RUN=1
      ;;
    --preserve-health-state)
      PRESERVE_HEALTH_STATE=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

run_smoke() {
  local url="$1"

  if is_dry_run; then
    dry_run_log "http_smoke_check $url"
  else
    http_smoke_check "$url"
  fi
}

run_cmd /usr/bin/docker compose -f "$INFRA_ROOT/runtime/docker-compose.yml" up -d --build --remove-orphans php

if ! is_dry_run; then
  wait_for_php_exec_ready "$PHP_READY_TIMEOUT"
  prepare_laravel_runtime
  ensure_public_storage_link
  clear_laravel_optimizations
  check_sqlite_write_access
  ensure_package_lock_for_deploy
  compose up -d --build --remove-orphans web
else
  dry_run_log "wait_for_php_exec_ready $PHP_READY_TIMEOUT"
  dry_run_log "prepare_laravel_runtime"
  dry_run_log "ensure_public_storage_link"
  dry_run_log "clear_laravel_optimizations"
  dry_run_log "check_sqlite_write_access"
  dry_run_log "ensure_package_lock_for_deploy"
  dry_run_log "/usr/bin/docker compose -f $INFRA_ROOT/runtime/docker-compose.yml up -d --build --remove-orphans web"
fi

run_smoke "$BACKEND_SMOKE_URL"
run_smoke "$API_SMOKE_URL"
run_smoke "$ADMIN_SMOKE_URL"

if ! is_dry_run; then
  mkdir -p /var/lib
  echo "0" > /var/lib/server-watchdog.state

  if [ "$PRESERVE_HEALTH_STATE" != "1" ]; then
    reset_all_health_incidents "$SCRIPT_ID"
  fi
else
  dry_run_log "echo 0 > /var/lib/server-watchdog.state"
  if [ "$PRESERVE_HEALTH_STATE" != "1" ]; then
    dry_run_log "reset_all_health_incidents $SCRIPT_ID"
  fi
fi

echo "Laravel runtime repaired and smoke-checks passed: $BACKEND_SMOKE_URL, $API_SMOKE_URL, $ADMIN_SMOKE_URL"
