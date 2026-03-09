#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-soft}"
shift || true

FORCE="no"
RM_ROOT_DIR="no"
RM_ETC_VUE_APP="no"

usage() {
  cat <<'USAGE'
Usage:
  sudo ./deploy/bootstrap/uninstall.sh soft  [--force]
  sudo ./deploy/bootstrap/uninstall.sh purge [--force] [--rm-etc]
  sudo ./deploy/bootstrap/uninstall.sh nuke  [--force] [--rm-etc] [--rm-root]

Modes:
  soft  - stop/disable timers+services + docker compose down. No file removal.
  purge - soft + remove app systemd units, logrotate rules, app logs/state.
  nuke  - purge + remove system-level configs installed by install.sh (with backup).

Flags:
  --force     Skip interactive confirmation for destructive actions
  --rm-etc    Also remove /etc/autoteka/* (secrets!)
  --rm-root   Also remove $AUTOTEKA_ROOT directory (DANGEROUS)
USAGE
}

while [ "${1:-}" != "" ]; do
  case "$1" in
    --force) FORCE="yes"; shift;;
    --rm-root) RM_ROOT_DIR="yes"; shift;;
    --rm-etc) RM_ETC_VUE_APP="yes"; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 2;;
  esac
done

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR" && while [ ! -f "DEPLOY.md" ] && [ "$PWD" != "/" ]; do cd ..; done; pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"
# shellcheck disable=SC1090
source "$DEPLOY_DIR/lib/laravel-runtime.sh"
load_autoteka_env

UNITS=(
  autoteka.service
  watch-changes.service
  watch-changes.timer
  server-watchdog.service
  server-watchdog.timer
  server-maintenance.service
  server-maintenance.timer
)

LOGROTATE_FILES=(
  /etc/logrotate.d/vue-app-deploy
  /etc/logrotate.d/server-watchdog
  /etc/logrotate.d/autoteka-telegram
  /etc/logrotate.d/autoteka-backend
)

APP_LOGS=(
  /var/log/autoteka-deploy.log
  /var/log/server-watchdog.log
  /var/log/server-metrics.log
  /var/log/server-maintenance.log
  /var/log/autoteka-telegram.log
)

APP_STATE=(
  /var/lib/vue-app-prev-commit
  /var/lib/vue-app-last-good
  /var/lib/server-watchdog.state
  /var/lib/server-watchdog.reboot
  /var/lib/server-watchdog
  /var/lock/autoteka-deploy.lock
  /var/lock/autoteka-server-watchdog.lock
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

soft() {
  say "AUTOTEKA_ROOT=$AUTOTEKA_ROOT"
  say "Stopping timers/services (soft)..."

  safe_systemctl stop watch-changes.timer server-watchdog.timer server-maintenance.timer
  safe_systemctl disable watch-changes.timer server-watchdog.timer server-maintenance.timer

  safe_systemctl stop watch-changes.service server-watchdog.service server-maintenance.service autoteka.service
  safe_systemctl disable autoteka.service || true

  if command -v docker >/dev/null 2>&1; then
    say "docker compose down"
    compose down --remove-orphans >/dev/null 2>&1 || true

    if docker ps -a --format '{{.Names}}' | grep -qx 'vue-app'; then
      say "docker rm -f vue-app"
      docker rm -f vue-app >/dev/null 2>&1 || true
    fi
  fi
}

purge() {
  confirm_or_exit "PURGE will remove app units/logrotate + app logs/state."
  soft

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

  if [ "$RM_ETC_VUE_APP" = "yes" ]; then
    confirm_or_exit "REMOVE /etc/autoteka/* (secrets)"
    rm -f /etc/autoteka/deploy.env /etc/autoteka/telegram.env 2>/dev/null || true
    rmdir /etc/autoteka 2>/dev/null || true
  fi
}

nuke() {
  confirm_or_exit "NUKE will ALSO remove system configs installed by install.sh (with backup)."
  purge

  local ts
  ts="$(date +%Y%m%d-%H%M%S)"
  local backup_dir="/root/uninstall-backup-$ts"
  say "Backup: $backup_dir"
  backup_and_remove "$backup_dir" "${SYSTEM_FILES[@]}"

  say "Reloading systemd daemon..."
  systemctl daemon-reload || true

  say "Restarting journald/fail2ban/docker (best-effort)..."
  systemctl restart systemd-journald >/dev/null 2>&1 || true
  systemctl restart fail2ban >/dev/null 2>&1 || true
  systemctl restart docker >/dev/null 2>&1 || true

  if [ "$RM_ROOT_DIR" = "yes" ]; then
    confirm_or_exit "REMOVE AUTOTEKA_ROOT: This will delete '$AUTOTEKA_ROOT' recursively."
    rm -rf "$AUTOTEKA_ROOT"
  fi
}

case "$MODE" in
  soft) soft; say "SOFT done.";;
  purge) purge; say "PURGE done.";;
  nuke) nuke; say "NUKE done.";;
  *) echo "Unknown mode: $MODE"; usage; exit 2;;
esac

say "Check:"
echo "  systemctl list-timers --all | egrep 'autoteka|server-watchdog|server-maintenance' || true"
echo "  docker ps -a | grep vue-app || true"
