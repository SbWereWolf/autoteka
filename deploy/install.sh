#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/vue-app"
SCRIPTS_DIR="$APP_DIR/deploy"

echo "=== vue-app bootstrap started ==="

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y --no-install-recommends   ca-certificates curl git wget bc logrotate fail2ban

# Docker: on Debian prefer docker.io (avoid conflicts docker-ce/containerd.io)
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found -> installing docker.io"
  apt-get install -y --no-install-recommends docker.io docker-compose-plugin     || apt-get install -y --no-install-recommends docker.io docker-compose
fi

systemctl enable --now docker

if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y --no-install-recommends docker-compose-plugin || true
fi

chmod +x   "$SCRIPTS_DIR/install.sh"   "$SCRIPTS_DIR/deploy.sh"   "$SCRIPTS_DIR/server-watchdog.sh"   "$SCRIPTS_DIR/server-maintenance.sh"   "$SCRIPTS_DIR/metrics-export.sh"   2>/dev/null || true

mkdir -p "$APP_DIR/metrics"
touch "$APP_DIR/metrics/data.json" || true

# Docker log limits
if [ -f "$SCRIPTS_DIR/config/docker-daemon.json" ]; then
  install -m 0644 "$SCRIPTS_DIR/config/docker-daemon.json" /etc/docker/daemon.json
  systemctl restart docker || true
fi

# Journald limits
mkdir -p /etc/systemd/journald.conf.d
if [ -f "$SCRIPTS_DIR/config/journald-limits.conf" ]; then
  install -m 0644 "$SCRIPTS_DIR/config/journald-limits.conf" /etc/systemd/journald.conf.d/limits.conf
  systemctl restart systemd-journald || true
fi

# Fail2ban sshd jail
mkdir -p /etc/fail2ban/jail.d
if [ -f "$SCRIPTS_DIR/config/fail2ban-jail.local" ]; then
  install -m 0644 "$SCRIPTS_DIR/config/fail2ban-jail.local" /etc/fail2ban/jail.d/sshd.local
fi
systemctl enable --now fail2ban >/dev/null 2>&1 || true
systemctl restart fail2ban >/dev/null 2>&1 || true

# Docker service self-healing
mkdir -p /etc/systemd/system/docker.service.d
if [ -f "$SCRIPTS_DIR/systemd/docker.override.conf" ]; then
  install -m 0644 "$SCRIPTS_DIR/systemd/docker.override.conf" /etc/systemd/system/docker.service.d/override.conf
fi

# Telegram env (optional)
mkdir -p /etc/vue-app
if [ ! -f /etc/vue-app/telegram.env ] && [ -f "$SCRIPTS_DIR/config/telegram.env.example" ]; then
  install -m 0600 "$SCRIPTS_DIR/config/telegram.env.example" /etc/vue-app/telegram.env
fi

# systemd units
install -m 0644 "$SCRIPTS_DIR/systemd/vue-app.service" /etc/systemd/system/vue-app.service
install -m 0644 "$SCRIPTS_DIR/systemd/vue-app-deploy.service" /etc/systemd/system/vue-app-deploy.service
install -m 0644 "$SCRIPTS_DIR/systemd/vue-app-deploy.timer" /etc/systemd/system/vue-app-deploy.timer
install -m 0644 "$SCRIPTS_DIR/systemd/server-watchdog.service" /etc/systemd/system/server-watchdog.service
install -m 0644 "$SCRIPTS_DIR/systemd/server-watchdog.timer" /etc/systemd/system/server-watchdog.timer
install -m 0644 "$SCRIPTS_DIR/systemd/server-maintenance.service" /etc/systemd/system/server-maintenance.service
install -m 0644 "$SCRIPTS_DIR/systemd/server-maintenance.timer" /etc/systemd/system/server-maintenance.timer

systemctl daemon-reload

# logrotate
if [ -f "$SCRIPTS_DIR/config/logrotate-vue-app-deploy.conf" ]; then
  install -m 0644 "$SCRIPTS_DIR/config/logrotate-vue-app-deploy.conf" /etc/logrotate.d/vue-app-deploy
fi
if [ -f "$SCRIPTS_DIR/config/logrotate-server-watchdog.conf" ]; then
  install -m 0644 "$SCRIPTS_DIR/config/logrotate-server-watchdog.conf" /etc/logrotate.d/server-watchdog
fi

# Enable services/timers
systemctl enable --now vue-app.service
systemctl enable --now vue-app-deploy.timer
systemctl enable --now server-watchdog.timer
systemctl enable --now server-maintenance.timer

echo "=== vue-app bootstrap finished ==="
echo "Tip: check logs: /var/log/vue-app-deploy.log /var/log/server-watchdog.log /var/log/server-metrics.log"
