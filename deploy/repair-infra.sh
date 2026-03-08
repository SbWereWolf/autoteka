#!/usr/bin/env bash
set -euo pipefail

# Починка инфраструктуры: таймеры, счётчик watchdog.
# Запускать вручную после перезагрузки или когда метрики не обновляются.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/_common.sh"
load_autoteka_env

if [ "$(id -u)" -ne 0 ]; then
  echo "Запуск от root: sudo autoteka repair-infra" >&2
  exit 1
fi

echo "=== repair-infra: восстановление таймеров и состояния ==="

# Таймеры — включить и запустить
systemctl enable --now server-watchdog.timer
systemctl enable --now server-maintenance.timer
systemctl enable --now watch-changes.timer

# Счётчик watchdog — сброс
mkdir -p /var/lib
echo "0" > /var/lib/server-watchdog.state

# Проверка docker.service
if [ "$(systemctl is-active docker.service 2>/dev/null || echo inactive)" != "active" ]; then
  echo "WARN: docker.service не активен, запускаю..." >&2
  systemctl start docker.service || true
fi

echo "repair-infra: таймеры включены, счётчик watchdog сброшен"
