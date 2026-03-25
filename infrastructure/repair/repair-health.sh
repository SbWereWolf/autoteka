#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"
source "$INFRA_ROOT/lib/runtime-compose.sh"
source "$INFRA_ROOT/lib/laravel-runtime.sh"
source "$INFRA_ROOT/lib/dry-run.sh"
source "$INFRA_ROOT/lib/repair-php-web-common.sh"

DRY_RUN=0
DOMAIN=""
PHP_READY_TIMEOUT="${PHP_READY_TIMEOUT}"

usage() {
  cat <<'USAGE'
Usage:
  autoteka repair-health <nginx|php|backend|admin> [--dry-run]

Actions:
  nginx    Restart web container or recreate it if missing.
  php      Restart php-fpm container or recreate it if missing.
  backend  Repair Laravel runtime (php + writable paths + caches + sqlite check + web).
  admin    Same remediation as backend, intended for /admin/login incidents.

Flags:
  -n, --dry-run   Show what would be executed without changing state.
  -h, --help      Show this help.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    nginx|php|backend|admin)
      if [ -n "$DOMAIN" ]; then
        echo "Domain already set: $DOMAIN" >&2
        exit 2
      fi
      DOMAIN="$1"
      ;;
    -n|--dry-run)
      DRY_RUN=1
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

if [ -z "$DOMAIN" ]; then
  usage >&2
  exit 2
fi

container_exists() {
  docker inspect "$1" >/dev/null 2>&1
}

restart_or_up() {
  local container="$1"
  local service="$2"

  if container_exists "$container"; then
    if is_dry_run; then
      dry_run_log "docker restart $container"
    else
      docker restart "$container" >/dev/null
    fi
  else
    if is_dry_run; then
      dry_run_log "$(autoteka_runtime_compose_describe) up -d --build --remove-orphans $service"
    else
      autoteka_runtime_compose up -d --build --remove-orphans "$service"
    fi
  fi
}

repair_backend_runtime() {
  autoteka_repair_php_and_web_stack
}

case "$DOMAIN" in
  nginx)
    restart_or_up autoteka-http web
    ;;
  php)
    restart_or_up autoteka-php php
    ;;
  backend|admin)
    repair_backend_runtime
    ;;
  *)
    echo "Unsupported domain: $DOMAIN" >&2
    exit 2
    ;;
esac

printf 'repair-health completed for domain=%s%s\n' "$DOMAIN" "$( [ "$DRY_RUN" = "1" ] && printf ' (dry-run)' || true )"
