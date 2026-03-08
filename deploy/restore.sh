#!/usr/bin/env bash
set -euo pipefail

# Restore deploy settings from backup archive.
#
# Usage: sudo ./deploy/restore.sh <archive> [--dry-run] [--force] [--target-root=/path]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DRY_RUN="no"
FORCE="no"
TARGET_ROOT=""
EXPLICIT_TARGET_ROOT="no"
ARCHIVE=""

usage() {
  cat <<'USAGE'
Usage:
  sudo ./deploy/restore.sh <archive> [--dry-run] [--force] [--target-root=/path]

Options:
  --dry-run       Show what would be restored, do not write files
  --force         Skip interactive confirmation
  --target-root=PATH  Restore project .env files to this path (default: from deploy.env in archive or current)
USAGE
}

while [ "${1:-}" != "" ]; do
  case "$1" in
    --dry-run)
      DRY_RUN="yes"
      shift
      ;;
    --force)
      FORCE="yes"
      shift
      ;;
    --target-root=*)
      TARGET_ROOT="${1#--target-root=}"
      EXPLICIT_TARGET_ROOT="yes"
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
      if [ -z "$ARCHIVE" ]; then
        ARCHIVE="$1"
        shift
      else
        echo "Unexpected argument: $1" >&2
        usage
        exit 2
      fi
      ;;
  esac
done

if [ -z "$ARCHIVE" ]; then
  echo "Archive path required." >&2
  usage
  exit 2
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

if [ ! -f "$ARCHIVE" ]; then
  echo "Archive not found: $ARCHIVE" >&2
  exit 1
fi

TMP_DIR=""
cleanup() {
  if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT

say() { echo -e ">>> $*"; }

# Extract and find backup root
TMP_DIR="$(mktemp -d)"
tar -xzf "$ARCHIVE" -C "$TMP_DIR"
BACKUP_ROOT=""
for d in "$TMP_DIR"/autoteka-backup-*; do
  if [ -d "$d" ]; then
    BACKUP_ROOT="$d"
    break
  fi
done
if [ -z "$BACKUP_ROOT" ] || [ ! -d "$BACKUP_ROOT" ]; then
  echo "Invalid archive: no autoteka-backup-* directory found" >&2
  exit 1
fi

# Resolve TARGET_ROOT for project files
if [ -z "$TARGET_ROOT" ]; then
  if [ -f "$BACKUP_ROOT/etc/autoteka/deploy.env" ]; then
    # shellcheck disable=SC1090
    set -a
    source "$BACKUP_ROOT/etc/autoteka/deploy.env" || true
    set +a
    TARGET_ROOT="${AUTOTEKA_ROOT:-}"
  fi
  if [ -z "$TARGET_ROOT" ] && [ -f /etc/autoteka/deploy.env ]; then
    set -a
    source /etc/autoteka/deploy.env 2>/dev/null || true
    set +a
    TARGET_ROOT="${AUTOTEKA_ROOT:-}"
  fi
  if [ -z "$TARGET_ROOT" ]; then
    TARGET_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
    say "Using repo root as target: $TARGET_ROOT"
  fi
fi

if [ "$DRY_RUN" = "yes" ]; then
  say "DRY RUN - no files will be written"
  echo
  echo "Archive: $ARCHIVE"
  echo "Backup root: $BACKUP_ROOT"
  echo "Target project root: $TARGET_ROOT"
  echo
  echo "Files to restore:"
  find "$BACKUP_ROOT" -type f | while read -r f; do
    rel="${f#$BACKUP_ROOT/}"
    case "$rel" in
      etc/*)
        echo "  $rel -> /$rel"
        ;;
      project/backend/.env)
        echo "  $rel -> $TARGET_ROOT/backend/.env"
        ;;
      project/frontend/.env)
        echo "  $rel -> $TARGET_ROOT/frontend/.env"
        ;;
      *)
        echo "  $rel -> (unknown target)"
        ;;
    esac
  done
  exit 0
fi

confirm_or_exit() {
  if [ "$FORCE" = "yes" ]; then
    return 0
  fi
  echo
  echo "!!! CONFIRM: $1"
  read -r -p "Type 'YES' to continue: " ans
  if [ "$ans" != "YES" ]; then
    echo "Aborted."
    exit 1
  fi
}

confirm_or_exit "Restore will overwrite existing deploy configuration."

restore_file() {
  local src="$1" dest="$2"
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dest")"
    install -m 0644 "$src" "$dest"
    say "restored: $dest"
  fi
}

restore_file_private() {
  local src="$1" dest="$2"
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dest")"
    install -m 0600 "$src" "$dest"
    say "restored: $dest"
  fi
}

say "Restoring /etc/autoteka..."
restore_file_private "$BACKUP_ROOT/etc/autoteka/deploy.env" /etc/autoteka/deploy.env
restore_file_private "$BACKUP_ROOT/etc/autoteka/telegram.env" /etc/autoteka/telegram.env

# Update AUTOTEKA_ROOT in deploy.env if --target-root was explicitly specified
if [ "$EXPLICIT_TARGET_ROOT" = "yes" ] && [ -f /etc/autoteka/deploy.env ]; then
  if grep -qE '^AUTOTEKA_ROOT=' /etc/autoteka/deploy.env; then
    sed -i -E "s|^AUTOTEKA_ROOT=.*$|AUTOTEKA_ROOT=$TARGET_ROOT|" /etc/autoteka/deploy.env
    say "updated AUTOTEKA_ROOT in deploy.env to $TARGET_ROOT"
  else
    echo "AUTOTEKA_ROOT=$TARGET_ROOT" >> /etc/autoteka/deploy.env
  fi
fi

say "Restoring project .env..."
restore_file_private "$BACKUP_ROOT/project/backend/.env" "$TARGET_ROOT/backend/.env"
restore_file_private "$BACKUP_ROOT/project/frontend/.env" "$TARGET_ROOT/frontend/.env"

say "Restoring systemd units..."
for u in autoteka.service watch-changes.service watch-changes.timer \
  server-watchdog.service server-watchdog.timer \
  server-maintenance.service server-maintenance.timer; do
  restore_file "$BACKUP_ROOT/etc/systemd/system/$u" "/etc/systemd/system/$u"
done
restore_file "$BACKUP_ROOT/etc/systemd/system/docker.service.d/override.conf" \
  /etc/systemd/system/docker.service.d/override.conf

say "Restoring system configs..."
restore_file "$BACKUP_ROOT/etc/docker/daemon.json" /etc/docker/daemon.json
restore_file "$BACKUP_ROOT/etc/systemd/journald.conf.d/limits.conf" \
  /etc/systemd/journald.conf.d/limits.conf
restore_file "$BACKUP_ROOT/etc/fail2ban/jail.d/sshd.local" \
  /etc/fail2ban/jail.d/sshd.local

say "Restoring logrotate..."
restore_file "$BACKUP_ROOT/etc/logrotate.d/vue-app-deploy" /etc/logrotate.d/vue-app-deploy
restore_file "$BACKUP_ROOT/etc/logrotate.d/server-watchdog" /etc/logrotate.d/server-watchdog
restore_file "$BACKUP_ROOT/etc/logrotate.d/autoteka-telegram" /etc/logrotate.d/autoteka-telegram

say "Reloading systemd daemon..."
systemctl daemon-reload

say "Restarting services..."
systemctl restart systemd-journald 2>/dev/null || true
systemctl restart fail2ban 2>/dev/null || true
systemctl restart docker 2>/dev/null || true
systemctl restart autoteka.service 2>/dev/null || true

echo
echo "Restore completed. Check: systemctl status autoteka.service; docker compose -f deploy/docker-compose.yml ps"
