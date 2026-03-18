#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"
if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

# INFRA_ROOT и AUTOTEKA_ROOT уже проверены в autoteka_init_roots; здесь только ищем .env.

INFRA_ENV="$INFRA_ROOT/.env"
if [ ! -f "$INFRA_ENV" ]; then
  echo "Файл $INFRA_ENV не найден. Создайте его перед развёртыванием." >&2
  echo "Пример: cp -n \"$INFRA_ROOT/prod.env\" \"$INFRA_ENV\"" >&2
  exit 3
fi

set -a
source "$INFRA_ENV" || { echo "Ошибка загрузки $INFRA_ENV" >&2; exit 1; }
set +a

source "$INFRA_ROOT/lib/deploy-flow.sh"
export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"
export COMPOSE_DOCKER_CLI_BUILD="${COMPOSE_DOCKER_CLI_BUILD:-1}"
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y --no-install-recommends ca-certificates curl git wget bc logrotate fail2ban
if ! command -v docker >/dev/null 2>&1; then
  apt-get install -y --no-install-recommends docker.io docker-compose-plugin     || apt-get install -y --no-install-recommends docker.io docker-compose
fi
systemctl enable --now docker
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y --no-install-recommends docker-compose-plugin || true
fi

chmod +x "$INFRA_ROOT/bootstrap"/*.sh 2>/dev/null || true
chmod +x "$INFRA_ROOT/runtime"/*.sh 2>/dev/null || true
chmod +x "$INFRA_ROOT/repair"/*.sh 2>/dev/null || true
chmod +x "$INFRA_ROOT/maintenance"/*.sh 2>/dev/null || true
chmod +x "$INFRA_ROOT/observability/infrastructure"/*.sh 2>/dev/null || true
mkdir -p "$INFRA_ROOT/observability/application/metrics"
touch "$INFRA_ROOT/observability/application/metrics/data.json" || true

mkdir -p /etc/systemd/journald.conf.d /etc/fail2ban/jail.d /etc/systemd/system/docker.service.d /etc/autoteka
install -m 0600 "$INFRA_ENV" /etc/autoteka/options.env
# Telegram-переменные только в telegram.env, не в options.env
sed -i '/^TELEGRAM_TOKEN=/d;/^TELEGRAM_CHAT=/d;/^TELEGRAM_LOG_FILE=/d' /etc/autoteka/options.env

# Проверка опций Telegram в .env
if [ -n "${TELEGRAM_ENV_FILE:-}" ] && { [ -z "${TELEGRAM_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT:-}" ] || [ -z "${TELEGRAM_LOG_FILE:-}" ]; }; then
  echo "Предупреждение: TELEGRAM_ENV_FILE задан, но TELEGRAM_TOKEN, TELEGRAM_CHAT или TELEGRAM_LOG_FILE не заданы в $INFRA_ENV." >&2
  echo "Для Telegram-уведомлений watchdog добавьте в .env:" >&2
  echo "  TELEGRAM_TOKEN=<токен бота>" >&2
  echo "  TELEGRAM_CHAT=<id чата>" >&2
  echo "  TELEGRAM_LOG_FILE=<путь к логу>" >&2
  echo "" >&2
  echo "Заполнить и перезапустить install:" >&2
  echo "  nano $INFRA_ENV" >&2
  echo "  sudo $0" >&2
  echo "" >&2
fi

# Файл telegram создаётся по пути из TELEGRAM_ENV_FILE (.env), значения из .env переписываются
if [ -n "${TELEGRAM_ENV_FILE:-}" ]; then
  mkdir -p "$(dirname "$TELEGRAM_ENV_FILE")"
  install -m 0600 "$INFRA_ROOT/bootstrap/config/telegram.example.env" "$TELEGRAM_ENV_FILE"
  if [ -n "${TELEGRAM_TOKEN:-}" ]; then
    sed -i "s|^TELEGRAM_TOKEN=.*|TELEGRAM_TOKEN=${TELEGRAM_TOKEN}|" "$TELEGRAM_ENV_FILE"
  fi
  if [ -n "${TELEGRAM_CHAT:-}" ]; then
    sed -i "s|^TELEGRAM_CHAT=.*|TELEGRAM_CHAT=${TELEGRAM_CHAT}|" "$TELEGRAM_ENV_FILE"
  fi
  if [ -n "${TELEGRAM_LOG_FILE:-}" ]; then
    sed -i "s|^TELEGRAM_LOG_FILE=.*|TELEGRAM_LOG_FILE=${TELEGRAM_LOG_FILE}|" "$TELEGRAM_ENV_FILE"
  fi
fi

install -m 0755 "$INFRA_ROOT/bootstrap/bin/autoteka" /usr/local/bin/autoteka
install -m 0644 "$INFRA_ROOT/runtime/systemd/autoteka.service" /etc/systemd/system/autoteka.service
install -m 0644 "$INFRA_ROOT/runtime/systemd/watch-changes.service" /etc/systemd/system/watch-changes.service
install -m 0644 "$INFRA_ROOT/runtime/systemd/watch-changes.timer" /etc/systemd/system/watch-changes.timer
install -m 0644 "$INFRA_ROOT/observability/infrastructure/systemd/server-watchdog.service" /etc/systemd/system/server-watchdog.service
install -m 0644 "$INFRA_ROOT/observability/infrastructure/systemd/server-watchdog.timer" /etc/systemd/system/server-watchdog.timer
install -m 0644 "$INFRA_ROOT/maintenance/systemd/server-maintenance.service" /etc/systemd/system/server-maintenance.service
install -m 0644 "$INFRA_ROOT/maintenance/systemd/server-maintenance.timer" /etc/systemd/system/server-maintenance.timer
install -m 0644 "$INFRA_ROOT/maintenance/config/logrotate-autoteka-deploy.conf" /etc/logrotate.d/autoteka-deploy
install -m 0644 "$INFRA_ROOT/maintenance/config/logrotate-server-watchdog.conf" /etc/logrotate.d/server-watchdog
install -m 0644 "$INFRA_ROOT/maintenance/config/logrotate-autoteka-telegram.conf" /etc/logrotate.d/autoteka-telegram
install -m 0644 "$INFRA_ROOT/maintenance/config/logrotate-autoteka-backend.conf" /etc/logrotate.d/autoteka-backend

# Backup rules: создать из .example при первом развёртывании.
for base in backup-rules-root backup-rules-autoteka backup-rules-infra; do
  dst="$INFRA_ROOT/maintenance/config/$base.txt"
  src="$INFRA_ROOT/maintenance/config/$base.example.txt"
  if [ ! -f "$src" ]; then
    echo "Предупреждение: исходный файл $src не найден, пропуск." >&2
  elif [ -f "$dst" ]; then
    echo "Файл $dst уже существует, копирование из шаблона пропущено."
  else
    cp "$src" "$dst"
    echo "Создан $dst из шаблона."
  fi
done

systemctl daemon-reload
systemctl enable --now fail2ban >/dev/null 2>&1 || true
systemctl restart docker || true
systemctl restart systemd-journald || true
systemctl restart fail2ban >/dev/null 2>&1 || true

autoteka_run_deploy_flow --mode=install

systemctl enable --now autoteka.service

systemctl enable --now \
  watch-changes.timer \
  server-watchdog.timer \
  server-maintenance.timer

systemctl start server-watchdog.service watch-changes.service || true

systemctl restart \
  watch-changes.timer \
  server-watchdog.timer \
  server-maintenance.timer

mkdir -p /var/lib /var/lib/server-watchdog/health
printf '0
' > /var/lib/server-watchdog.state

echo "=== autoteka bootstrap finished ==="
echo "AUTOTEKA_ROOT=$AUTOTEKA_ROOT"
