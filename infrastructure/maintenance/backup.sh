#!/usr/bin/env bash
set -euo pipefail

# Backup deploy settings: env, systemd, docker, fail2ban, logrotate + app data.
# Creates tar.gz archive with deploy configuration affecting app and Docker services.
# Runtime health incident state is intentionally NOT included.

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
  echo "  sudo $0" >&2
  echo "  sudo $0 --infra-root=/opt/vue-app/infrastructure --autoteka-root=/opt/vue-app" >&2
  exit 2
fi
# shellcheck disable=SC1090
source "$INFRA_ROOT/lib/bootstrap.sh"
load_autoteka_env

OUTPUT_DIR="/root"
IGNORE_ALLOWLIST_FILE="$INFRA_ROOT/maintenance/config/backup-ignored-allowlist.txt"

usage() {
  cat <<'USAGE'
Usage:
  sudo "$INFRA_ROOT"/maintenance/backup.sh [--output-dir=PATH]

Purpose:
  Create a backup archive with runtime configuration, project secrets and
  data required for restore on the same or another host.

Included in backup:
  - /etc/autoteka/options.env
  - /etc/autoteka/telegram.env
  - backend/.env and frontend/.env from AUTOTEKA_ROOT
  - backend/database and backend/storage from AUTOTEKA_ROOT
  - ignored-files curated allowlist from INFRA_ROOT
  - systemd units installed by the current infra install script
  - docker/journald/fail2ban/logrotate configuration managed by this project

Explicitly NOT included:
  - active watchdog/health incident state in /var/lib/server-watchdog*
  - Telegram notification dedup locks in ${TMPDIR:-/tmp}/autoteka-telegram-locks
  - Docker images and unnamed temporary files

Options:
  --output-dir=PATH   Directory where the .tar.gz archive will be created.
                      Default: /root
  -h, --help          Show this help.
USAGE
}

while [ "${1:-}" != "" ]; do
  case "$1" in
    --output-dir=*)
      OUTPUT_DIR="${1#--output-dir=}"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_NAME="autoteka-backup-$TIMESTAMP"
TMP_DIR=""
ARCHIVE=""

cleanup() {
  if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT

say() { echo -e ">>> $*"; }

copy_if_exists() {
  local src="$1" dest="$2"
  if [ -e "$src" ]; then
    mkdir -p "$(dirname "$dest")"
    cp -a "$src" "$dest"
    say "backed up: $src"
    return 0
  else
    echo "  (skip, not found: $src)" >&2
    return 1
  fi
}

copy_allowlisted_ignored() {
  local allowlist_file="$1"

  if [ ! -f "$allowlist_file" ]; then
    echo "  (skip, allowlist not found: $allowlist_file)" >&2
    return 0
  fi

  mkdir -p "$BACKUP_ROOT/project"
  cp -a "$allowlist_file" "$BACKUP_ROOT/project/backup-ignored-allowlist.txt"

  shopt -s nullglob dotglob globstar
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    line="${line#./}"
    line="${line#/}"
    if [ -z "$line" ]; then
      continue
    fi
    if [[ "$line" == "!"* ]]; then
      continue
    fi

    local matches=( "$AUTOTEKA_ROOT"/$line )
    if [ "${#matches[@]}" -eq 0 ]; then
      echo "  (skip, allowlist miss: $line)" >&2
      continue
    fi

    local src rel
    for src in "${matches[@]}"; do
      rel="${src#$AUTOTEKA_ROOT/}"
      case "$rel" in
        ""|../*|*/../*|*"/.."|..)
          echo "  (skip, invalid allowlist path: $src)" >&2
          continue
          ;;
      esac
      copy_if_exists "$src" "$BACKUP_ROOT/project/ignored/$rel" || true
    done
  done < "$allowlist_file"
  shopt -u nullglob dotglob globstar
}

TMP_DIR="$(mktemp -d)"
BACKUP_ROOT="$TMP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_ROOT"

say "Collecting runtime configuration and data..."

# /etc/autoteka
copy_if_exists /etc/autoteka/options.env "$BACKUP_ROOT/etc/autoteka/options.env" || true
copy_if_exists /etc/autoteka/telegram.env "$BACKUP_ROOT/etc/autoteka/telegram.env" || true

# project env
copy_if_exists "$AUTOTEKA_ROOT/backend/.env" "$BACKUP_ROOT/project/backend/.env" || true
copy_if_exists "$AUTOTEKA_ROOT/frontend/.env" "$BACKUP_ROOT/project/frontend/.env" || true

# project data
copy_if_exists "$AUTOTEKA_ROOT/backend/database" "$BACKUP_ROOT/project/backend/database" || true
copy_if_exists "$AUTOTEKA_ROOT/backend/storage" "$BACKUP_ROOT/project/backend/storage" || true

# curated ignored allowlist
copy_allowlisted_ignored "$IGNORE_ALLOWLIST_FILE"

# systemd units
for u in autoteka.service watch-changes.service watch-changes.timer \
  server-watchdog.service server-watchdog.timer \
  server-maintenance.service server-maintenance.timer; do
  copy_if_exists "/etc/systemd/system/$u" "$BACKUP_ROOT/etc/systemd/system/$u" || true
done

# docker override
copy_if_exists /etc/systemd/system/docker.service.d/override.conf \
  "$BACKUP_ROOT/etc/systemd/system/docker.service.d/override.conf" || true

# docker daemon
copy_if_exists /etc/docker/daemon.json "$BACKUP_ROOT/etc/docker/daemon.json" || true

# journald
copy_if_exists /etc/systemd/journald.conf.d/limits.conf \
  "$BACKUP_ROOT/etc/systemd/journald.conf.d/limits.conf" || true

# fail2ban
copy_if_exists /etc/fail2ban/jail.d/sshd.local \
  "$BACKUP_ROOT/etc/fail2ban/jail.d/sshd.local" || true

# logrotate
copy_if_exists /etc/logrotate.d/vue-app-deploy \
  "$BACKUP_ROOT/etc/logrotate.d/vue-app-deploy" || true
copy_if_exists /etc/logrotate.d/server-watchdog \
  "$BACKUP_ROOT/etc/logrotate.d/server-watchdog" || true
copy_if_exists /etc/logrotate.d/autoteka-telegram \
  "$BACKUP_ROOT/etc/logrotate.d/autoteka-telegram" || true
copy_if_exists /etc/logrotate.d/autoteka-backend \
  "$BACKUP_ROOT/etc/logrotate.d/autoteka-backend" || true

Path="$BACKUP_ROOT/BACKUP_NOTES.txt"
cat > "$Path" <<NOTES
Autoteka backup created at: $(date -Is)
AUTOTEKA_ROOT snapshot source: $AUTOTEKA_ROOT
INFRA_ROOT snapshot source: $INFRA_ROOT

This archive contains runtime configuration and selected project data:
- env and system configs
- backend/database and backend/storage
- curated ignored allowlist content

It intentionally does NOT include runtime watchdog/health incident state,
Telegram deduplication locks, logs, or Docker images.

After restore, restart monitoring from a clean state.
NOTES

# Create archive
mkdir -p "$OUTPUT_DIR"
ARCHIVE="$OUTPUT_DIR/${BACKUP_NAME}.tar.gz"
say "Creating archive: $ARCHIVE"
tar -czf "$ARCHIVE" -C "$TMP_DIR" "$BACKUP_NAME"

echo
echo "Backup created: $ARCHIVE"
echo "WARNING: Archive contains secrets. Store securely, do not commit to git."
echo "NOTE: Runtime health incident state is intentionally excluded."
