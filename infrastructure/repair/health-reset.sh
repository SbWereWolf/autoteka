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
  exit 2
fi
# shellcheck disable=SC1090
source "$INFRA_ROOT/lib/bootstrap.sh"
# shellcheck disable=SC1090
source "$INFRA_ROOT/lib/health-state.sh"
load_autoteka_env

DRY_RUN=0
TARGET=""
SCRIPT_ID="server-watchdog"

usage() {
  cat <<'USAGE'
Usage:
  autoteka health-reset <nginx|php|backend|admin|api|all> [--dry-run]

Purpose:
  Clear active watchdog incident state and Telegram dedup locks for one
  health domain or for all domains.

Flags:
  -n, --dry-run   Show what would be removed without changing anything.
  -h, --help      Show this help.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    nginx|php|backend|admin|api|all)
      if [ -n "$TARGET" ]; then
        echo "Target already set: $TARGET" >&2
        exit 2
      fi
      TARGET="$1"
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

if [ -z "$TARGET" ]; then
  usage >&2
  exit 2
fi

reset_target() {
  local domain="$1"
  reset_health_domain_incident "$SCRIPT_ID" "$domain"
  printf 'reset health incident for domain=%s%s\n' "$domain" "$( [ "$DRY_RUN" = "1" ] && printf ' (dry-run)' || true )"
}

if [ "$TARGET" = "all" ]; then
  for domain in nginx php backend admin api; do
    reset_target "$domain"
  done
else
  reset_target "$TARGET"
fi
