#!/usr/bin/env bash
# Диагностика: общая картина и рекомендации по repair-командам.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"

echo "=== autoteka diagnose ==="
echo "$(date +"%Y-%m-%d %H:%M:%S")"
echo ""

# Контейнеры
echo "--- Контейнеры ---"
if [ -f "$INFRA_ROOT/runtime/docker-compose.yml" ]; then
  docker compose -f "$INFRA_ROOT/runtime/docker-compose.yml" ps 2>/dev/null || echo "docker compose недоступен или контейнеры не запущены"
else
  echo "docker-compose.yml не найден"
fi
echo ""

# Таймеры
echo "--- Таймеры ---"
for t in watch-changes.timer server-watchdog.timer server-maintenance.timer; do
  status=$(systemctl is-active "$t" 2>/dev/null || echo "не найден")
  echo "  $t: $status"
done
echo ""

# Health endpoints (если контейнеры запущены)
echo "--- Health endpoints ---"
for url in "http://127.0.0.1/healthcheck" "http://127.0.0.1/up" "http://127.0.0.1/api/v1/category-list" "http://127.0.0.1/admin/login"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$url" 2>/dev/null || echo "---")
  echo "  $url: $code"
done
echo ""

# Последние записи в логах
echo "--- Последние записи в логах (tail -3) ---"
if [ -n "${AUTOTEKA_LOG_DIR:-}" ]; then
  for log in "${AUTOTEKA_LOG_DIR}/autoteka-deploy.log" "${AUTOTEKA_LOG_DIR}/server-maintenance.log" "${AUTOTEKA_LOG_DIR}/telegram.log" "${AUTOTEKA_LOG_DIR}/server-watchdog.log" "${AUTOTEKA_LOG_DIR}/server-metrics.log"; do
    if [ -f "$log" ]; then
      echo "  $log:"
      tail -3 "$log" 2>/dev/null | sed 's/^/    /'
    else
      echo "  $log: не найден"
    fi
  done
else
  echo "  AUTOTEKA_LOG_DIR не задан, пропуск"
fi
echo ""

# Рекомендации
echo "--- Рекомендации ---"
echo "  При проблемах с контейнерами: autoteka repair-health <nginx|php|backend|admin>"
echo "  При проблемах с таймерами: autoteka repair-infra"
echo "  Полная починка runtime: autoteka repair-runtime --dry-run (проверка), затем без --dry-run"
echo "  Сброс incident state: autoteka health-reset all"
echo "  Подробная диагностика: см. docs/manual/ADMIN_MANUAL.md §12"
exit 0
