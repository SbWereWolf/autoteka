#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"
source "$INFRA_ROOT/lib/health-state.sh"

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
