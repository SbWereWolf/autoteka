#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_SCRIPT_ROOT="$(cd "$SCRIPT_DIR" && while [ ! -f "DEPLOY.md" ] && [ "$PWD" != "/" ]; do cd ..; done; pwd)"
REPO_ROOT="${AUTOTEKA_ROOT:-$(git -C "$INFRA_SCRIPT_ROOT" rev-parse --show-toplevel 2>/dev/null || true)}"
if [ -z "$REPO_ROOT" ]; then
  echo "AUTOTEKA_ROOT is not set and could not be resolved from the current git worktree." >&2
  exit 1
fi
export AUTOTEKA_ROOT="$REPO_ROOT"
export INFRA_ROOT="${INFRA_ROOT:-$INFRA_SCRIPT_ROOT}"
# shellcheck disable=SC1090
source "$INFRA_SCRIPT_ROOT/lib/laravel-runtime.sh"
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
chmod +x "$INFRA_SCRIPT_ROOT/runtime"/*.sh 2>/dev/null || true
chmod +x "$INFRA_SCRIPT_ROOT/repair"/*.sh 2>/dev/null || true
chmod +x "$INFRA_SCRIPT_ROOT/maintenance"/*.sh 2>/dev/null || true
chmod +x "$INFRA_SCRIPT_ROOT/observability/infrastructure"/*.sh 2>/dev/null || true
mkdir -p "$INFRA_ROOT/observability/application/metrics"
touch "$INFRA_ROOT/observability/application/metrics/data.json" || true

mkdir -p /etc/systemd/journald.conf.d /etc/fail2ban/jail.d /etc/systemd/system/docker.service.d /etc/autoteka
if [ -f /etc/autoteka/deploy.env ]; then
  if grep -qE '^AUTOTEKA_ROOT=' /etc/autoteka/deploy.env; then
    sed -i -E "s|^AUTOTEKA_ROOT=.*$|AUTOTEKA_ROOT=$REPO_ROOT|" /etc/autoteka/deploy.env
  else
    echo "AUTOTEKA_ROOT=$REPO_ROOT" >> /etc/autoteka/deploy.env
  fi
  if grep -qE '^INFRA_ROOT=' /etc/autoteka/deploy.env; then
    sed -i -E "s|^INFRA_ROOT=.*$|INFRA_ROOT=$INFRA_ROOT|" /etc/autoteka/deploy.env
  else
    echo "INFRA_ROOT=$INFRA_ROOT" >> /etc/autoteka/deploy.env
  fi
else
  echo "AUTOTEKA_ROOT=$REPO_ROOT" > /etc/autoteka/deploy.env
  echo "INFRA_ROOT=$INFRA_ROOT" >> /etc/autoteka/deploy.env
  chmod 600 /etc/autoteka/deploy.env
fi

install -m 0755 "$INFRA_SCRIPT_ROOT/bootstrap/bin/autoteka" /usr/local/bin/autoteka
install -m 0644 "$INFRA_SCRIPT_ROOT/runtime/systemd/autoteka.service" /etc/systemd/system/autoteka.service
install -m 0644 "$INFRA_SCRIPT_ROOT/runtime/systemd/watch-changes.service" /etc/systemd/system/watch-changes.service
install -m 0644 "$INFRA_SCRIPT_ROOT/runtime/systemd/watch-changes.timer" /etc/systemd/system/watch-changes.timer
install -m 0644 "$INFRA_SCRIPT_ROOT/observability/infrastructure/systemd/server-watchdog.service" /etc/systemd/system/server-watchdog.service
install -m 0644 "$INFRA_SCRIPT_ROOT/observability/infrastructure/systemd/server-watchdog.timer" /etc/systemd/system/server-watchdog.timer
install -m 0644 "$INFRA_SCRIPT_ROOT/maintenance/systemd/server-maintenance.service" /etc/systemd/system/server-maintenance.service
install -m 0644 "$INFRA_SCRIPT_ROOT/maintenance/systemd/server-maintenance.timer" /etc/systemd/system/server-maintenance.timer
install -m 0644 "$INFRA_SCRIPT_ROOT/maintenance/config/logrotate-vue-app-deploy.conf" /etc/logrotate.d/vue-app-deploy
install -m 0644 "$INFRA_SCRIPT_ROOT/maintenance/config/logrotate-server-watchdog.conf" /etc/logrotate.d/server-watchdog
install -m 0644 "$INFRA_SCRIPT_ROOT/maintenance/config/logrotate-autoteka-telegram.conf" /etc/logrotate.d/autoteka-telegram
install -m 0644 "$INFRA_SCRIPT_ROOT/maintenance/config/logrotate-autoteka-backend.conf" /etc/logrotate.d/autoteka-backend
systemctl daemon-reload
systemctl enable --now fail2ban >/dev/null 2>&1 || true
systemctl restart docker || true
systemctl restart systemd-journald || true
systemctl restart fail2ban >/dev/null 2>&1 || true

compose up -d --build --remove-orphans php
wait_for_php_exec_ready "${PHP_READY_TIMEOUT:-60}"
prepare_laravel_runtime
admin_artisan_in_php 'migrate --force'
admin_artisan_in_php 'db:seed --class=AdminUserSeeder --force'
ensure_package_lock_for_deploy
compose up -d --build --remove-orphans web
systemctl enable --now autoteka.service
systemctl enable --now watch-changes.timer
systemctl enable --now server-watchdog.timer
systemctl enable --now server-maintenance.timer
mkdir -p /var/lib /var/lib/server-watchdog/health
printf '0
' > /var/lib/server-watchdog.state

echo "=== autoteka bootstrap finished ==="
echo "AUTOTEKA_ROOT=$REPO_ROOT"
