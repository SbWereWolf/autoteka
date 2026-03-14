#!/usr/bin/env bash
set -euo pipefail

# Починка инфраструктуры: таймеры, счётчик watchdog.
# Запускать вручную после перезагрузки или когда метрики не обновляются.

# INFRA_ROOT и AUTOTEKA_ROOT — только из аргументов или переменных окружения
if [ -f /etc/autoteka/options.env ]; then
  set -a
  # shellcheck disable=SC1090
  source /etc/autoteka/options.env || true
  set +a
fi
export INFRA_ROOT="${INFRA_ROOT:-}"
export AUTOTEKA_ROOT="${AUTOTEKA_ROOT:-}"
if [ -z "${INFRA_ROOT}" ] || [[ "${INFRA_ROOT}" != /* ]] || \
   [ -z "${AUTOTEKA_ROOT}" ] || [[ "${AUTOTEKA_ROOT}" != /* ]]; then
  echo "INFRA_ROOT и AUTOTEKA_ROOT должны быть заданы абсолютными путями." >&2
  exit 2
fi
# shellcheck disable=SC1090
source "$INFRA_ROOT/lib/bootstrap.sh"
load_autoteka_env

if [ "$(id -u)" -ne 0 ]; then
  echo "Запуск от root: sudo autoteka repair-infra" >&2
  exit 1
fi

echo "=== repair-infra: восстановление таймеров и состояния ==="

# Таймеры — включить и запустить
systemctl enable --now \
  server-watchdog.timer \
  server-maintenance.timer \
  watch-changes.timer
systemctl restart \
  server-watchdog.timer \
  server-maintenance.timer \
  watch-changes.timer

# Счётчик watchdog — сброс
mkdir -p /var/lib /var/lib/server-watchdog/health
echo "0" > /var/lib/server-watchdog.state

# Проверка docker.service
if [ "$(systemctl is-active docker.service 2>/dev/null || echo inactive)" != "active" ]; then
  echo "WARN: docker.service не активен, запускаю..." >&2
  systemctl start docker.service || true
fi

echo "repair-infra: таймеры включены, счётчик watchdog сброшен"
