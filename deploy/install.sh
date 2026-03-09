#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/_common.sh"
export AUTOTEKA_ROOT="$ROOT_DIR"
export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"
export COMPOSE_DOCKER_CLI_BUILD="${COMPOSE_DOCKER_CLI_BUILD:-1}"
export DEBIAN_FRONTEND=noninteractive

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

apt-get update
apt-get install -y --no-install-recommends ca-certificates curl git wget bc logrotate fail2ban
if ! command -v docker >/dev/null 2>&1; then
  apt-get install -y --no-install-recommends docker.io docker-compose-plugin     || apt-get install -y --no-install-recommends docker.io docker-compose
fi
systemctl enable --now docker
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y --no-install-recommends docker-compose-plugin || true
fi

chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null || true
mkdir -p "$ROOT_DIR/deploy/metrics"
touch "$ROOT_DIR/deploy/metrics/data.json" || true

mkdir -p /etc/systemd/journald.conf.d /etc/fail2ban/jail.d /etc/systemd/system/docker.service.d /etc/autoteka
[ -f "$SCRIPT_DIR/config/docker-daemon.json" ] && install -m 0644 "$SCRIPT_DIR/config/docker-daemon.json" /etc/docker/daemon.json || true
[ -f "$SCRIPT_DIR/config/journald-limits.conf" ] && install -m 0644 "$SCRIPT_DIR/config/journald-limits.conf" /etc/systemd/journald.conf.d/limits.conf || true
[ -f "$SCRIPT_DIR/config/fail2ban-jail.local" ] && install -m 0644 "$SCRIPT_DIR/config/fail2ban-jail.local" /etc/fail2ban/jail.d/sshd.local || true
[ -f "$SCRIPT_DIR/systemd/docker.override.conf" ] && install -m 0644 "$SCRIPT_DIR/systemd/docker.override.conf" /etc/systemd/system/docker.service.d/override.conf || true
[ -f "$SCRIPT_DIR/config/telegram.example.env" ] && [ ! -f /etc/autoteka/telegram.env ] && install -m 0600 "$SCRIPT_DIR/config/telegram.example.env" /etc/autoteka/telegram.env || true
[ -f "$SCRIPT_DIR/config/deploy.example.env" ] && [ ! -f /etc/autoteka/deploy.env ] && install -m 0600 "$SCRIPT_DIR/config/deploy.example.env" /etc/autoteka/deploy.env || true

if [ -f /etc/autoteka/deploy.env ]; then
  if grep -qE '^AUTOTEKA_ROOT=' /etc/autoteka/deploy.env; then
    sed -i -E "s|^AUTOTEKA_ROOT=.*$|AUTOTEKA_ROOT=$ROOT_DIR|" /etc/autoteka/deploy.env
  else
    echo "AUTOTEKA_ROOT=$ROOT_DIR" >> /etc/autoteka/deploy.env
  fi
else
  echo "AUTOTEKA_ROOT=$ROOT_DIR" > /etc/autoteka/deploy.env
  chmod 600 /etc/autoteka/deploy.env
fi

install -m 0755 "$SCRIPT_DIR/wrapper/autoteka" /usr/local/bin/autoteka
install -m 0644 "$SCRIPT_DIR/systemd/autoteka.service" /etc/systemd/system/autoteka.service
install -m 0644 "$SCRIPT_DIR/systemd/watch-changes.service" /etc/systemd/system/watch-changes.service
install -m 0644 "$SCRIPT_DIR/systemd/watch-changes.timer" /etc/systemd/system/watch-changes.timer
install -m 0644 "$SCRIPT_DIR/systemd/server-watchdog.service" /etc/systemd/system/server-watchdog.service
install -m 0644 "$SCRIPT_DIR/systemd/server-watchdog.timer" /etc/systemd/system/server-watchdog.timer
install -m 0644 "$SCRIPT_DIR/systemd/server-maintenance.service" /etc/systemd/system/server-maintenance.service
install -m 0644 "$SCRIPT_DIR/systemd/server-maintenance.timer" /etc/systemd/system/server-maintenance.timer
[ -f "$SCRIPT_DIR/config/logrotate-vue-app-deploy.conf" ] && install -m 0644 "$SCRIPT_DIR/config/logrotate-vue-app-deploy.conf" /etc/logrotate.d/vue-app-deploy || true
[ -f "$SCRIPT_DIR/config/logrotate-server-watchdog.conf" ] && install -m 0644 "$SCRIPT_DIR/config/logrotate-server-watchdog.conf" /etc/logrotate.d/server-watchdog || true
[ -f "$SCRIPT_DIR/config/logrotate-autoteka-telegram.conf" ] && install -m 0644 "$SCRIPT_DIR/config/logrotate-autoteka-telegram.conf" /etc/logrotate.d/autoteka-telegram || true
systemctl daemon-reload
systemctl enable --now fail2ban >/dev/null 2>&1 || true
systemctl restart docker || true
systemctl restart systemd-journald || true
systemctl restart fail2ban >/dev/null 2>&1 || true

compose up -d --build --remove-orphans php
wait_for_php_exec_ready "${PHP_READY_TIMEOUT:-60}"
prepare_laravel_runtime
compose exec -T php sh -lc 'set -eu; cd /var/www/backend; php artisan migrate --force; php artisan db:seed --class=AdminUserSeeder --force'
compose up -d --build --remove-orphans web
systemctl enable --now autoteka.service
systemctl enable --now watch-changes.timer
systemctl enable --now server-watchdog.timer
systemctl enable --now server-maintenance.timer
mkdir -p /var/lib /var/lib/server-watchdog/health
printf '0
' > /var/lib/server-watchdog.state

echo "=== autoteka bootstrap finished ==="
echo "AUTOTEKA_ROOT=$ROOT_DIR"
