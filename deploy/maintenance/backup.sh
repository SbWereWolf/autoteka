#!/usr/bin/env bash
set -euo pipefail

# Backup deploy settings: env, systemd, docker, fail2ban, logrotate.
# Creates tar.gz archive with deploy configuration affecting app and Docker services.
# Runtime health incident state is intentionally NOT included.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR" && while [ ! -f "DEPLOY.md" ] && [ "$PWD" != "/" ]; do cd ..; done; pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"
# shellcheck disable=SC1090
source "$DEPLOY_DIR/lib/bootstrap.sh"
load_autoteka_env

OUTPUT_DIR="/root"

usage() {
  cat <<'USAGE'
Usage:
  sudo ./deploy/maintenance/backup.sh [--output-dir=PATH]

Purpose:
  Create a backup archive with deploy-time configuration and secrets needed to
  restore autoteka deployment settings on the same or another host.

Included in backup:
  - /etc/autoteka/deploy.env
  - /etc/autoteka/telegram.env
  - backend/.env and frontend/.env from AUTOTEKA_ROOT
  - systemd units installed by deploy/bootstrap/install.sh
  - docker/journald/fail2ban/logrotate configuration managed by this project

Explicitly NOT included:
  - active watchdog/health incident state in /var/lib/server-watchdog*
  - Telegram notification dedup locks in ${TMPDIR:-/tmp}/autoteka-telegram-locks
  - Docker images, volumes, bind-mounted runtime data, database contents
  - application logs and temporary files

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
copy_if_exists /etc/logrotate.d/autoteka-backend \
  "$BACKUP_ROOT/etc/logrotate.d/autoteka-backend" || true

Path="$BACKUP_ROOT/BACKUP_NOTES.txt"
cat > "$Path" <<NOTES
Autoteka deploy backup created at: $(date -Is)
AUTOTEKA_ROOT snapshot source: $AUTOTEKA_ROOT

This archive contains deploy-time configuration only.
It intentionally does NOT include runtime watchdog/health incident state,
Telegram deduplication locks, logs, Docker images, volumes, or application data.

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
