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
  echo "Повторный install: cp \"$INFRA_ROOT/backup.env\" \"$INFRA_ENV\"" >&2
  exit 3
fi

set -a
source "$INFRA_ENV" || { echo "Ошибка загрузки $INFRA_ENV" >&2; exit 1; }
set +a

if [ -z "${AUTOTEKA_OPTIONS_FILE:-}" ]; then
  echo "AUTOTEKA_OPTIONS_FILE не задан в $INFRA_ENV. Задайте путь к options.env." >&2
  exit 3
fi

if [ -z "${AUTOTEKA_LOG_DIR:-}" ]; then
  echo "AUTOTEKA_LOG_DIR не задан в $INFRA_ENV. Задайте путь к директории логов." >&2
  exit 3
fi

if [ -z "${HEALTH_STATE_DIR:-}" ]; then
  echo "HEALTH_STATE_DIR не задан в $INFRA_ENV. Задайте путь к директории health state." >&2
  exit 3
fi

source "$INFRA_ROOT/lib/deploy-flow.sh"
if [ -z "${DOCKER_BUILDKIT:-}" ]; then
  echo "DOCKER_BUILDKIT не задан в $INFRA_ENV." >&2
  exit 3
fi
if [ -z "${COMPOSE_DOCKER_CLI_BUILD:-}" ]; then
  echo "COMPOSE_DOCKER_CLI_BUILD не задан в $INFRA_ENV." >&2
  exit 3
fi
export DOCKER_BUILDKIT
export COMPOSE_DOCKER_CLI_BUILD
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y --no-install-recommends ca-certificates curl git wget bc logrotate fail2ban gettext
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

mkdir -p /etc/systemd/journald.conf.d /etc/fail2ban/jail.d /etc/systemd/system/docker.service.d "$(dirname "$AUTOTEKA_OPTIONS_FILE")"
install -m 0600 "$INFRA_ENV" "$AUTOTEKA_OPTIONS_FILE"
# Telegram-переменные только в telegram.env, не в options.env
sed -i '/^TELEGRAM_TOKEN=/d;/^TELEGRAM_CHAT=/d' "$AUTOTEKA_OPTIONS_FILE"
# TELEGRAM_LOCK_DIR: вычислить из временной папки ОС и записать в options.env
source "$INFRA_ROOT/lib/operational_system.sh"
TELEGRAM_LOCK_DIR="$(autoteka_get_os_temp_dir)/autoteka-telegram-locks"
if grep -q '^TELEGRAM_LOCK_DIR=' "$AUTOTEKA_OPTIONS_FILE" 2>/dev/null; then
  sed -i "s|^TELEGRAM_LOCK_DIR=.*|TELEGRAM_LOCK_DIR=${TELEGRAM_LOCK_DIR}|" "$AUTOTEKA_OPTIONS_FILE"
else
  printf 'TELEGRAM_LOCK_DIR=%s\n' "$TELEGRAM_LOCK_DIR" >> "$AUTOTEKA_OPTIONS_FILE"
fi

# Проверка опций Telegram в .env
if [ -n "${TELEGRAM_ENV_FILE:-}" ] && { [ -z "${TELEGRAM_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT:-}" ]; }; then
  echo "Предупреждение: TELEGRAM_ENV_FILE задан, но TELEGRAM_TOKEN или TELEGRAM_CHAT не заданы в $INFRA_ENV." >&2
  echo "Для Telegram-уведомлений watchdog добавьте в .env:" >&2
  echo "  TELEGRAM_TOKEN=<токен бота>" >&2
  echo "  TELEGRAM_CHAT=<id чата>" >&2
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
fi

install -m 0755 "$INFRA_ROOT/bootstrap/bin/autoteka" /usr/local/bin/autoteka
envsubst '${AUTOTEKA_OPTIONS_FILE}' < "$INFRA_ROOT/runtime/systemd/autoteka.service.template" | install -m 0644 /dev/stdin /etc/systemd/system/autoteka.service
envsubst '${AUTOTEKA_OPTIONS_FILE}' < "$INFRA_ROOT/runtime/systemd/watch-changes.service.template" | install -m 0644 /dev/stdin /etc/systemd/system/watch-changes.service
install -m 0644 "$INFRA_ROOT/runtime/systemd/watch-changes.timer" /etc/systemd/system/watch-changes.timer
envsubst '${AUTOTEKA_OPTIONS_FILE}' < "$INFRA_ROOT/observability/infrastructure/systemd/server-watchdog.service.template" | install -m 0644 /dev/stdin /etc/systemd/system/server-watchdog.service
install -m 0644 "$INFRA_ROOT/observability/infrastructure/systemd/server-watchdog.timer" /etc/systemd/system/server-watchdog.timer
envsubst '${AUTOTEKA_OPTIONS_FILE}' < "$INFRA_ROOT/maintenance/systemd/server-maintenance.service.template" | install -m 0644 /dev/stdin /etc/systemd/system/server-maintenance.service
install -m 0644 "$INFRA_ROOT/maintenance/systemd/server-maintenance.timer" /etc/systemd/system/server-maintenance.timer
envsubst '${AUTOTEKA_OPTIONS_FILE}' < "$INFRA_ROOT/bootstrap/config/autoteka.profile.template" | install -m 0644 /dev/stdin /etc/profile.d/autoteka.sh
mkdir -p "$AUTOTEKA_LOG_DIR"
for name in autoteka-deploy server-watchdog autoteka-telegram; do
  envsubst '${AUTOTEKA_LOG_DIR}' < "$INFRA_ROOT/maintenance/config/logrotate-${name}.template.conf" | install -m 0644 /dev/stdin "/etc/logrotate.d/$name"
done
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

mkdir -p /var/lib "$(dirname "$HEALTH_STATE_DIR")"
printf '0
' > /var/lib/server-watchdog.state

echo "=== autoteka bootstrap finished ==="
echo "AUTOTEKA_ROOT=$AUTOTEKA_ROOT"

# Переместить .env в backup.env для повторных запусков (cp backup.env .env перед следующим install)
if [ -f "$INFRA_ENV" ]; then
  mv -f "$INFRA_ENV" "$INFRA_ROOT/backup.env"
  echo ".env перемещён в backup.env"
fi
