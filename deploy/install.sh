#!/usr/bin/env bash
set -euo pipefail

# Bootstrap server for autoteka deployment.
# - installs required packages (docker, fail2ban, logrotate)
# - ensures /etc/autoteka/deploy.env contains AUTOTEKA_ROOT
# - installs /usr/local/bin/autoteka wrapper
# - installs and enables systemd units/timers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/_common.sh"
export AUTOTEKA_ROOT="$ROOT_DIR"

echo "=== autoteka bootstrap started ==="

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates curl git wget bc logrotate fail2ban

# Docker: on Debian prefer docker.io (avoid conflicts docker-ce/containerd.io)
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found -> installing docker.io"
  apt-get install -y --no-install-recommends docker.io docker-compose-plugin \
    || apt-get install -y --no-install-recommends docker.io docker-compose
fi

systemctl enable --now docker

if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y --no-install-recommends docker-compose-plugin || true
fi

chmod +x \
  "$SCRIPT_DIR/install.sh" \
  "$SCRIPT_DIR/deploy.sh" \
  "$SCRIPT_DIR/watch-changes.sh" \
  "$SCRIPT_DIR/repair-runtime.sh" \
  "$SCRIPT_DIR/server-watchdog.sh" \
  "$SCRIPT_DIR/server-maintenance.sh" \
  "$SCRIPT_DIR/metrics-export.sh" \
  "$SCRIPT_DIR/uninstall.sh" \
  2>/dev/null || true

# Ensure metrics file exists inside repo
mkdir -p "$ROOT_DIR/deploy/metrics"
touch "$ROOT_DIR/deploy/metrics/data.json" || true

# Docker log limits
if [ -f "$SCRIPT_DIR/config/docker-daemon.json" ]; then
  install -m 0644 "$SCRIPT_DIR/config/docker-daemon.json" /etc/docker/daemon.json
  systemctl restart docker || true
fi

# Journald limits
mkdir -p /etc/systemd/journald.conf.d
if [ -f "$SCRIPT_DIR/config/journald-limits.conf" ]; then
  install -m 0644 "$SCRIPT_DIR/config/journald-limits.conf" /etc/systemd/journald.conf.d/limits.conf
  systemctl restart systemd-journald || true
fi

# Fail2ban sshd jail
mkdir -p /etc/fail2ban/jail.d
if [ -f "$SCRIPT_DIR/config/fail2ban-jail.local" ]; then
  install -m 0644 "$SCRIPT_DIR/config/fail2ban-jail.local" /etc/fail2ban/jail.d/sshd.local
fi
systemctl enable --now fail2ban >/dev/null 2>&1 || true
systemctl restart fail2ban >/dev/null 2>&1 || true

# Docker service self-healing
mkdir -p /etc/systemd/system/docker.service.d
if [ -f "$SCRIPT_DIR/systemd/docker.override.conf" ]; then
  install -m 0644 "$SCRIPT_DIR/systemd/docker.override.conf" /etc/systemd/system/docker.service.d/override.conf
fi

# /etc/autoteka envs
mkdir -p /etc/autoteka

# Telegram env (optional)
if [ ! -f /etc/autoteka/telegram.env ] && [ -f "$SCRIPT_DIR/config/telegram.env.example" ]; then
  install -m 0600 "$SCRIPT_DIR/config/telegram.env.example" /etc/autoteka/telegram.env
fi

# deploy.env (contains AUTOTEKA_ROOT)
if [ ! -f /etc/autoteka/deploy.env ] && [ -f "$SCRIPT_DIR/config/deploy.example.env" ]; then
  install -m 0600 "$SCRIPT_DIR/config/deploy.example.env" /etc/autoteka/deploy.env
fi

upsert_env() {
  local key="$1" value="$2" file="$3"
  if grep -qE "^${key}=" "$file" 2>/dev/null; then
    # in-place replace
    sed -i -E "s|^${key}=.*$|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

# Always pin current repo path (no hardcoded /opt/... in units)
if [ -f /etc/autoteka/deploy.env ]; then
  upsert_env "AUTOTEKA_ROOT" "$ROOT_DIR" "/etc/autoteka/deploy.env"
else
  echo "AUTOTEKA_ROOT=$ROOT_DIR" > /etc/autoteka/deploy.env
  chmod 600 /etc/autoteka/deploy.env
fi

# Wrapper in PATH (units call it)
install -m 0755 "$SCRIPT_DIR/wrapper/autoteka" /usr/local/bin/autoteka

# remove legacy unit names before installing new ones
systemctl stop vue-app-deploy.timer vue-app-deploy.service vue-app.service >/dev/null 2>&1 || true
systemctl disable vue-app-deploy.timer vue-app.service >/dev/null 2>&1 || true
rm -f \
  /etc/systemd/system/vue-app.service \
  /etc/systemd/system/vue-app-deploy.service \
  /etc/systemd/system/vue-app-deploy.timer \
  2>/dev/null || true

# systemd units
install -m 0644 "$SCRIPT_DIR/systemd/autoteka.service" /etc/systemd/system/autoteka.service
install -m 0644 "$SCRIPT_DIR/systemd/autoteka-deploy.service" /etc/systemd/system/autoteka-deploy.service
install -m 0644 "$SCRIPT_DIR/systemd/autoteka-deploy.timer" /etc/systemd/system/autoteka-deploy.timer
install -m 0644 "$SCRIPT_DIR/systemd/server-watchdog.service" /etc/systemd/system/server-watchdog.service
install -m 0644 "$SCRIPT_DIR/systemd/server-watchdog.timer" /etc/systemd/system/server-watchdog.timer
install -m 0644 "$SCRIPT_DIR/systemd/server-maintenance.service" /etc/systemd/system/server-maintenance.service
install -m 0644 "$SCRIPT_DIR/systemd/server-maintenance.timer" /etc/systemd/system/server-maintenance.timer

systemctl daemon-reload

# logrotate
if [ -f "$SCRIPT_DIR/config/logrotate-vue-app-deploy.conf" ]; then
  install -m 0644 "$SCRIPT_DIR/config/logrotate-vue-app-deploy.conf" /etc/logrotate.d/vue-app-deploy
fi
if [ -f "$SCRIPT_DIR/config/logrotate-server-watchdog.conf" ]; then
  install -m 0644 "$SCRIPT_DIR/config/logrotate-server-watchdog.conf" /etc/logrotate.d/server-watchdog
fi
if [ -f "$SCRIPT_DIR/config/logrotate-autoteka-telegram.conf" ]; then
  install -m 0644 "$SCRIPT_DIR/config/logrotate-autoteka-telegram.conf" /etc/logrotate.d/autoteka-telegram
fi

# Enable services/timers
systemctl enable --now autoteka.service
compose up -d --build --remove-orphans php
wait_for_php_exec_ready "${PHP_READY_TIMEOUT:-60}"
prepare_laravel_runtime
systemctl enable --now autoteka-deploy.timer
systemctl enable --now server-watchdog.timer
systemctl enable --now server-maintenance.timer

# Инициализация счётчика watchdog (сброс при установке)
mkdir -p /var/lib
echo "0" > /var/lib/server-watchdog.state

echo "=== autoteka bootstrap finished ==="
echo "AUTOTEKA_ROOT=$ROOT_DIR"
echo "Tip: check logs: /var/log/autoteka-deploy.log /var/log/server-watchdog.log /var/log/server-metrics.log /var/log/autoteka-telegram.log"
