#!/usr/bin/env bash
set -euo pipefail

# Backup deploy settings: env, systemd, docker, fail2ban, logrotate.
# Creates tar.gz archive with deploy configuration affecting app and Docker services.
#
# Usage: sudo ./deploy/backup.sh [--output-dir=/path]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/_common.sh"
load_autoteka_env

OUTPUT_DIR="/root"

usage() {
  cat <<'USAGE'
Usage:
  sudo ./deploy/backup.sh [--output-dir=/path]

Options:
  --output-dir=PATH  Directory for backup archive (default: /root)
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

TMP_DIR="$(mktemp -d)"
BACKUP_ROOT="$TMP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_ROOT"

say "Collecting deploy configuration..."

# /etc/autoteka
copy_if_exists /etc/autoteka/deploy.env "$BACKUP_ROOT/etc/autoteka/deploy.env" || true
copy_if_exists /etc/autoteka/telegram.env "$BACKUP_ROOT/etc/autoteka/telegram.env" || true

# project .env
copy_if_exists "$AUTOTEKA_ROOT/backend/.env" "$BACKUP_ROOT/project/backend/.env" || true
copy_if_exists "$AUTOTEKA_ROOT/frontend/.env" "$BACKUP_ROOT/project/frontend/.env" || true

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

# Create archive
mkdir -p "$OUTPUT_DIR"
ARCHIVE="$OUTPUT_DIR/${BACKUP_NAME}.tar.gz"
say "Creating archive: $ARCHIVE"
tar -czf "$ARCHIVE" -C "$TMP_DIR" "$BACKUP_NAME"

echo
echo "Backup created: $ARCHIVE"
echo "WARNING: Archive contains secrets. Store securely, do not commit to git."

