#!/usr/bin/env bash
set -euo pipefail

# Legacy undeploy (BEFORE repo move).
# Matches current (old) deployment scheme:
# - repo root is hardcoded as /opt/vue-app
# - docker-compose.yml lives in repo root
# - systemd units run /opt/vue-app/deploy/*

MODE="${1:-soft}"
shift || true

APP_DIR="/opt/vue-app"
FORCE="no"
RM_APP_DIR="no"

usage() {
  cat <<'USAGE'
Usage:
  sudo ./deploy/undeploy-pre-move.sh soft [--app-dir /path]
  sudo ./deploy/undeploy-pre-move.sh purge [--app-dir /path] [--force]
  sudo ./deploy/undeploy-pre-move.sh nuke  [--app-dir /path] [--force] [--rm-app-dir]
USAGE
}

while [ "${1:-}" != "" ]; do
  case "$1" in
    --app-dir) APP_DIR="${2:-}"; shift 2;;
    --force) FORCE="yes"; shift;;
    --rm-app-dir) RM_APP_DIR="yes"; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 2;;
  esac
done

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

UNITS=(
  vue-app.service
  vue-app-deploy.service
  vue-app-deploy.timer
  server-watchdog.service
  server-watchdog.timer
  server-maintenance.service
  server-maintenance.timer
)

LOGROTATE_FILES=(
  /etc/logrotate.d/vue-app-deploy
  /etc/logrotate.d/server-watchdog
)

APP_LOGS=(
  /var/log/vue-app-deploy.log
  /var/log/server-watchdog.log
  /var/log/server-metrics.log
  /var/log/server-maintenance.log
)

APP_STATE=(
  /var/lib/vue-app-prev-commit
  /var/lib/vue-app-last-good
  /var/lib/server-watchdog.state
  /var/lib/server-watchdog.reboot
  /var/lock/vue-app-deploy.lock
)

SYSTEM_FILES=(
  /etc/docker/daemon.json
  /etc/systemd/journald.conf.d/limits.conf
  /etc/fail2ban/jail.d/sshd.local
  /etc/systemd/system/docker.service.d/override.conf
)

say() { echo -e ">>> $*"; }
exists() { [ -e "$1" ]; }

safe_systemctl() {
  systemctl "$@" >/dev/null 2>&1 || true
}

confirm_or_exit() {
  local msg="$1"
  if [ "$FORCE" = "yes" ]; then
    return 0
  fi
  echo
  echo "!!! CONFIRM: $msg"
  read -r -p "Type 'YES' to continue: " ans
  if [ "$ans" != "YES" ]; then
    echo "Aborted."
    exit 1
  fi
}

backup_and_remove() {
  local backup_dir="$1"; shift
  mkdir -p "$backup_dir"
  for f in "$@"; do
    if exists "$f"; then
      local dest="$backup_dir${f}"
      mkdir -p "$(dirname "$dest")"
      cp -a "$f" "$dest"
      rm -f "$f"
      say "removed: $f (backup: $dest)"
    fi
  done
}

stop_soft() {
  say "Stopping timers/services (legacy soft)..."
  safe_systemctl stop vue-app-deploy.timer server-watchdog.timer server-maintenance.timer
  safe_systemctl disable vue-app-deploy.timer server-watchdog.timer server-maintenance.timer

  safe_systemctl stop vue-app-deploy.service server-watchdog.service server-maintenance.service vue-app.service
  safe_systemctl disable vue-app.service || true

  if command -v docker >/dev/null 2>&1; then
    if [ -f "$APP_DIR/docker-compose.yml" ]; then
      say "docker compose down (APP_DIR=$APP_DIR)"
      docker compose -f "$APP_DIR/docker-compose.yml" down --remove-orphans >/dev/null 2>&1 || true
    fi

    if docker ps -a --format '{{.Names}}' | grep -qx 'vue-app'; then
      say "docker rm -f vue-app"
      docker rm -f vue-app >/dev/null 2>&1 || true
    fi
  fi
}

purge() {
  confirm_or_exit "PURGE (legacy) will remove app units/logrotate + app logs/state."
  stop_soft

  say "Removing app systemd units..."
  for u in "${UNITS[@]}"; do
    safe_systemctl disable "$u"
    safe_systemctl stop "$u"
    rm -f "/etc/systemd/system/$u" || true
  done
  systemctl daemon-reload || true

  say "Removing logrotate rules..."
  rm -f "${LOGROTATE_FILES[@]}" 2>/dev/null || true

  say "Removing app logs/state..."
  rm -f "${APP_LOGS[@]}" 2>/dev/null || true
  rm -f "${APP_STATE[@]}" 2>/dev/null || true
}

nuke() {
  confirm_or_exit "NUKE (legacy) will ALSO remove system configs installed by install.sh (with backup)."
  purge

  local ts
  ts="$(date +%Y%m%d-%H%M%S)"
  local backup_dir="/root/undeploy-legacy-backup-$ts"
  say "Backup: $backup_dir"
  backup_and_remove "$backup_dir" "${SYSTEM_FILES[@]}"

  say "Reloading systemd daemon..."
  systemctl daemon-reload || true

  say "Restarting journald/fail2ban/docker (best-effort)..."
  systemctl restart systemd-journald >/dev/null 2>&1 || true
  systemctl restart fail2ban >/dev/null 2>&1 || true
  systemctl restart docker >/dev/null 2>&1 || true

  if [ "$RM_APP_DIR" = "yes" ]; then
    confirm_or_exit "REMOVE APP DIR: This will delete '$APP_DIR' recursively."
    rm -rf "$APP_DIR"
  fi
}

case "$MODE" in
  soft) stop_soft; say "SOFT done.";;
  purge) purge; say "PURGE done.";;
  nuke) nuke; say "NUKE done.";;
  *) echo "Unknown mode: $MODE"; usage; exit 2;;
esac
