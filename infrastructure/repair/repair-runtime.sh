#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"
source "$INFRA_ROOT/lib/runtime-compose.sh"
source "$INFRA_ROOT/lib/laravel-runtime.sh"
source "$INFRA_ROOT/lib/health-state.sh"
source "$INFRA_ROOT/lib/repair-php-web-common.sh"

DRY_RUN=0
PRESERVE_HEALTH_STATE=0
PHP_READY_TIMEOUT="${PHP_READY_TIMEOUT}"
BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL}"
API_HEALTH_URL="${API_HEALTH_URL}"
ADMIN_HEALTH_URL="${ADMIN_HEALTH_URL}"
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

autoteka_repair_php_and_web_stack --with-package-lock

run_smoke "$BACKEND_HEALTH_URL"
run_smoke "$API_HEALTH_URL"
run_smoke "$ADMIN_HEALTH_URL"

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

echo "Laravel runtime repaired and smoke-checks passed: $BACKEND_HEALTH_URL, $API_HEALTH_URL, $ADMIN_HEALTH_URL"
