#!/usr/bin/env bash
set -euo pipefail

# Restore deploy settings from backup archive.
# Restore recreates configuration, optionally restores project data, then resets
# watchdog/health runtime state so monitoring starts from a clean baseline.

# INFRA_ROOT и AUTOTEKA_ROOT — только из аргументов или переменных окружения
if [ -f /etc/autoteka/options.env ]; then
  set -a
  # shellcheck disable=SC1090
  source /etc/autoteka/options.env || true
  set +a
fi
_INFRA_ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --infra-root=*) INFRA_ROOT="${1#--infra-root=}"; shift ;;
    --autoteka-root=*) AUTOTEKA_ROOT="${1#--autoteka-root=}"; shift ;;
    *) _INFRA_ARGS+=("$1"); shift ;;
  esac
done
set -- "${_INFRA_ARGS[@]}"
export INFRA_ROOT="${INFRA_ROOT:-}"
export AUTOTEKA_ROOT="${AUTOTEKA_ROOT:-}"
if [ -z "${INFRA_ROOT}" ] || [[ "${INFRA_ROOT}" != /* ]] || \
   [ -z "${AUTOTEKA_ROOT}" ] || [[ "${AUTOTEKA_ROOT}" != /* ]]; then
  echo "INFRA_ROOT и AUTOTEKA_ROOT должны быть заданы абсолютными путями." >&2
  echo "Пример: export INFRA_ROOT=/opt/vue-app/infrastructure" >&2
  echo "        export AUTOTEKA_ROOT=/opt/vue-app" >&2
  echo "  sudo $0 <archive>" >&2
  echo "  sudo $0 <archive> --infra-root=/opt/vue-app/infrastructure --autoteka-root=/opt/vue-app" >&2
  exit 2
fi

DRY_RUN="no"
FORCE="no"
PROFILE="full"
TARGET_ROOT=""
EXPLICIT_TARGET_ROOT="no"
ARCHIVE=""
HEALTH_STATE_DIR="/var/lib/server-watchdog/health"
WATCHDOG_STATE_FILE="/var/lib/server-watchdog.state"
WATCHDOG_REBOOT_FILE="/var/lib/server-watchdog.reboot"
TELEGRAM_LOCK_DIR="${TMPDIR:-/tmp}/autoteka-telegram-locks"

usage() {
  cat <<'USAGE'
Usage:
  sudo "$INFRA_ROOT"/maintenance/restore.sh <archive> [--profile=full|config] [--dry-run] [--force] [--target-root=PATH]

Purpose:
  Restore runtime configuration from an autoteka backup archive, optionally
  restore project data, then reset runtime health/watchdog incident state.

Positional arguments:
  <archive>                Path to autoteka-backup-*.tar.gz created by backup.sh.

Options:
  --profile=full|config    Restore scope profile. Default: full.
                           full   = config + project data + ignored allowlist files.
                           config = config + project env only.
  --dry-run                Show what would be restored and reset.
                           No files, timers, or runtime state will be changed.
  --force                  Skip interactive confirmation.
  --target-root=PATH       Restore project files into PATH.
                           If provided explicitly, AUTOTEKA_ROOT in options.env
                           is rewritten to this PATH.
  -h, --help               Show this help.

Notes:
  - Runtime health incident state is NOT restored from backup.
  - During restore watchdog counters, cooldown markers, and Telegram dedup lock
    files are cleared so the restored host starts from a clean state.
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
    --profile=*)
      PROFILE="${1#--profile=}"
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

if [ "$PROFILE" != "full" ] && [ "$PROFILE" != "config" ]; then
  echo "Unsupported profile: $PROFILE" >&2
  exit 2
fi

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

safe_systemctl() {
  systemctl "$@" 2>/dev/null || true
}

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

restore_tree_if_exists() {
  local src="$1" dest="$2"
  if [ -d "$src" ]; then
    mkdir -p "$dest"
    cp -a "$src"/. "$dest"/
    say "restored directory tree: $dest"
  fi
}

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

reset_runtime_health_state() {
  say "Resetting watchdog/health runtime state..."
  mkdir -p /var/lib "$HEALTH_STATE_DIR" "$TELEGRAM_LOCK_DIR"
  rm -f "$HEALTH_STATE_DIR"/* 2>/dev/null || true
  rm -f "$WATCHDOG_STATE_FILE" "$WATCHDOG_REBOOT_FILE" 2>/dev/null || true
  rm -f "$TELEGRAM_LOCK_DIR"/autoteka.server-watchdog.*.lock 2>/dev/null || true
  echo "0" > "$WATCHDOG_STATE_FILE"
}

show_dry_run_plan() {
  say "DRY RUN - no files will be written"
  echo
  echo "Archive: $ARCHIVE"
  echo "Backup root: $BACKUP_ROOT"
  echo "Profile: $PROFILE"
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
      project/backend/database/*)
        if [ "$PROFILE" = "full" ]; then
          echo "  $rel -> $TARGET_ROOT/backend/database/*"
        fi
        ;;
      project/backend/storage/*)
        if [ "$PROFILE" = "full" ]; then
          echo "  $rel -> $TARGET_ROOT/backend/storage/*"
        fi
        ;;
      project/ignored/*)
        if [ "$PROFILE" = "full" ]; then
          echo "  $rel -> $TARGET_ROOT/${rel#project/ignored/}"
        fi
        ;;
      project/backup-ignored-allowlist.txt)
        if [ "$PROFILE" = "full" ]; then
          echo "  $rel -> <target INFRA_ROOT>/maintenance/config/backup-ignored-allowlist.txt"
        fi
        ;;
      *)
        echo "  $rel -> (not restored automatically)"
        ;;
    esac
  done
  echo
  echo "Runtime state cleanup after restore:"
  echo "  rm -f $HEALTH_STATE_DIR/*"
  echo "  rm -f $WATCHDOG_STATE_FILE"
  echo "  rm -f $WATCHDOG_REBOOT_FILE"
  echo "  rm -f $TELEGRAM_LOCK_DIR/autoteka.server-watchdog.*.lock"
  echo "  echo 0 > $WATCHDOG_STATE_FILE"
  echo
  echo "Best-effort service actions after restore:"
  echo "  systemctl daemon-reload"
  echo "  systemctl restart systemd-journald"
  echo "  systemctl restart fail2ban"
  echo "  systemctl restart docker"
  echo "  systemctl restart autoteka.service"
  echo "  systemctl enable --now watch-changes.timer"
  echo "  systemctl enable --now server-watchdog.timer"
  echo "  systemctl enable --now server-maintenance.timer"
}

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
  if [ -f "$BACKUP_ROOT/etc/autoteka/options.env" ]; then
    # shellcheck disable=SC1090
    set -a
    source "$BACKUP_ROOT/etc/autoteka/options.env" || true
    set +a
    TARGET_ROOT="${AUTOTEKA_ROOT:-}"
  fi
  if [ -z "$TARGET_ROOT" ] && [ -f /etc/autoteka/options.env ]; then
    set -a
    source /etc/autoteka/options.env 2>/dev/null || true
    set +a
    TARGET_ROOT="${AUTOTEKA_ROOT:-}"
  fi
  if [ -z "$TARGET_ROOT" ]; then
    TARGET_ROOT="$AUTOTEKA_ROOT"
    say "Using AUTOTEKA_ROOT as target: $TARGET_ROOT"
  fi
fi

if [ "$DRY_RUN" = "yes" ]; then
  show_dry_run_plan
  exit 0
fi

confirm_or_exit "Restore profile '$PROFILE' will overwrite existing runtime configuration and reset active watchdog incident state."

say "Restoring /etc/autoteka..."
restore_file_private "$BACKUP_ROOT/etc/autoteka/options.env" /etc/autoteka/options.env
restore_file_private "$BACKUP_ROOT/etc/autoteka/telegram.env" /etc/autoteka/telegram.env

# Update AUTOTEKA_ROOT in options.env if --target-root was explicitly specified
if [ "$EXPLICIT_TARGET_ROOT" = "yes" ] && [ -f /etc/autoteka/options.env ]; then
  if grep -qE '^AUTOTEKA_ROOT=' /etc/autoteka/options.env; then
    sed -i -E "s|^AUTOTEKA_ROOT=.*$|AUTOTEKA_ROOT=$TARGET_ROOT|" /etc/autoteka/options.env
  else
    echo "AUTOTEKA_ROOT=$TARGET_ROOT" >> /etc/autoteka/options.env
  fi
  chmod 600 /etc/autoteka/options.env
  say "updated AUTOTEKA_ROOT in options.env to $TARGET_ROOT"
fi

say "Restoring project .env..."
restore_file_private "$BACKUP_ROOT/project/backend/.env" "$TARGET_ROOT/backend/.env"
restore_file_private "$BACKUP_ROOT/project/frontend/.env" "$TARGET_ROOT/frontend/.env"

if [ "$PROFILE" = "full" ]; then
  say "Restoring project data (backend/database + backend/storage)..."
  restore_tree_if_exists "$BACKUP_ROOT/project/backend/database" "$TARGET_ROOT/backend/database"
  restore_tree_if_exists "$BACKUP_ROOT/project/backend/storage" "$TARGET_ROOT/backend/storage"

  if [ -d "$BACKUP_ROOT/project/ignored" ]; then
    say "Restoring ignored allowlist files..."
    cp -a "$BACKUP_ROOT/project/ignored"/. "$TARGET_ROOT"/
  fi

  restore_infra_root="$INFRA_ROOT"
  if [ -n "${restore_infra_root:-}" ]; then
    restore_file "$BACKUP_ROOT/project/backup-ignored-allowlist.txt" \
      "$restore_infra_root/maintenance/config/backup-ignored-allowlist.txt"
  fi
fi

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
restore_file "$BACKUP_ROOT/etc/logrotate.d/autoteka-backend" /etc/logrotate.d/autoteka-backend

reset_runtime_health_state

say "Reloading systemd daemon..."
systemctl daemon-reload

say "Restarting services (best effort)..."
safe_systemctl restart systemd-journald
safe_systemctl restart fail2ban
safe_systemctl restart docker
safe_systemctl restart autoteka.service
safe_systemctl enable --now watch-changes.timer
safe_systemctl enable --now server-watchdog.timer
safe_systemctl enable --now server-maintenance.timer

echo
echo "Restore completed (profile=$PROFILE)."
echo "Recommended follow-up: autoteka watchdog --dry-run"
echo "Recommended checks: curl -i http://127.0.0.1/healthcheck ; curl -i http://127.0.0.1/up"
