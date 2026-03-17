#!/usr/bin/env bash
set -euo pipefail

# Restore deploy settings from backup archives.
# Accepts 1–3 archives via --archive-root, --archive-autoteka, --archive-infra.
# Uses autoteka CLI: timers-stop, timers-start, health-reset.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"

DRY_RUN="no"
FORCE="no"
ARCHIVE_ROOT=""
ARCHIVE_AUTOTEKA=""
ARCHIVE_INFRA=""

usage() {
  cat <<'USAGE'
Usage:
  sudo "$INFRA_ROOT"/maintenance/restore.sh [--archive-root=PATH] [--archive-autoteka=PATH] [--archive-infra=PATH] [--dry-run] [--force]

Purpose:
  Restore runtime configuration from autoteka backup archives.
  Each archive is extracted to its root: /, $AUTOTEKA_ROOT, $INFRA_ROOT.

Options:
  --archive-root=PATH      Archive for root (/) paths.
  --archive-autoteka=PATH  Archive for $AUTOTEKA_ROOT paths.
  --archive-infra=PATH     Archive for $INFRA_ROOT paths.
  --dry-run                Show planned actions without writing.
  --force                  Skip interactive confirmation.
  -h, --help               Show this help.

Notes:
  - At least one archive must be provided.
  - Uses autoteka timers-stop, timers-start, health-reset all.
USAGE
}

while [ "${1:-}" != "" ]; do
  case "$1" in
    --archive-root=*)
      ARCHIVE_ROOT="${1#--archive-root=}"
      shift
      ;;
    --archive-autoteka=*)
      ARCHIVE_AUTOTEKA="${1#--archive-autoteka=}"
      shift
      ;;
    --archive-infra=*)
      ARCHIVE_INFRA="${1#--archive-infra=}"
      shift
      ;;
    --dry-run)
      DRY_RUN="yes"
      shift
      ;;
    --force)
      FORCE="yes"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
    *)
      echo "Unexpected argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [ -z "$ARCHIVE_ROOT" ] && [ -z "$ARCHIVE_AUTOTEKA" ] && [ -z "$ARCHIVE_INFRA" ]; then
  echo "At least one archive required (--archive-root, --archive-autoteka, --archive-infra)." >&2
  usage
  exit 2
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

for arch in "$ARCHIVE_ROOT" "$ARCHIVE_AUTOTEKA" "$ARCHIVE_INFRA"; do
  [ -z "$arch" ] && continue
  if [ ! -f "$arch" ]; then
    echo "Archive not found: $arch" >&2
    exit 1
  fi
done

say() { printf '>>> %s\n' "$*"; }

autoteka_cmd() {
  if command -v autoteka >/dev/null 2>&1; then
    autoteka "$@"
  else
    "$INFRA_ROOT/bootstrap/bin/autoteka" "$@"
  fi
}

confirm_or_exit() {
  if [ "$FORCE" = "yes" ]; then
    return 0
  fi
  echo
  echo "!!! CONFIRM: Restore will overwrite files and reset watchdog state."
  read -r -p "Type 'YES' to continue: " ans
  if [ "$ans" != "YES" ]; then
    echo "Aborted."
    exit 1
  fi
}

if [ "$DRY_RUN" = "yes" ]; then
  say "DRY RUN - no files will be written"
  echo
  [ -n "$ARCHIVE_ROOT" ] && echo "  --archive-root -> extract to /"
  [ -n "$ARCHIVE_AUTOTEKA" ] && echo "  --archive-autoteka -> extract to $AUTOTEKA_ROOT"
  [ -n "$ARCHIVE_INFRA" ] && echo "  --archive-infra -> extract to $INFRA_ROOT"
  echo
  echo "autoteka timers-stop"
  echo "autoteka health-reset all"
  echo "autoteka repair-infra"
  exit 0
fi

confirm_or_exit "Restore will overwrite configuration and reset watchdog state."

say "Stopping timers (autoteka timers-stop)..."
autoteka_cmd timers-stop

if [ -n "$ARCHIVE_ROOT" ]; then
  say "Extracting root archive to /..."
  tar -xzf "$ARCHIVE_ROOT" -C /
fi

if [ -n "$ARCHIVE_AUTOTEKA" ]; then
  say "Extracting autoteka archive to $AUTOTEKA_ROOT..."
  tar -xzf "$ARCHIVE_AUTOTEKA" -C "$AUTOTEKA_ROOT"
fi

if [ -n "$ARCHIVE_INFRA" ]; then
  say "Extracting infra archive to $INFRA_ROOT..."
  tar -xzf "$ARCHIVE_INFRA" -C "$INFRA_ROOT"
fi

say "Resetting health state (autoteka health-reset all)..."
autoteka_cmd health-reset all

say "Reloading systemd daemon..."
systemctl daemon-reload

say "Restarting services (best effort)..."
systemctl restart systemd-journald 2>/dev/null || true
systemctl restart fail2ban 2>/dev/null || true
systemctl restart docker 2>/dev/null || true
systemctl restart autoteka.service 2>/dev/null || true

say "Starting timers and resetting watchdog state (autoteka repair-infra)..."
autoteka_cmd repair-infra

echo
echo "Restore completed."
echo "Recommended follow-up: autoteka watchdog --dry-run"
echo "Recommended checks: curl -i http://127.0.0.1/healthcheck ; curl -i http://127.0.0.1/up"
