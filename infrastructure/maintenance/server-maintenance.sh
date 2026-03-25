#!/usr/bin/env bash
set -euo pipefail

# Daily safe maintenance:
# - apt cache clean
# - journal vacuum
# - docker dangling images/build cache cleanup (NO volume prune)
# - /tmp cleanup
# - fix logrotate status permissions

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"
source "$INFRA_ROOT/lib/runtime-compose.sh"
source "$INFRA_ROOT/lib/telegram.sh"
load_telegram_env

LOG="${LOG_DIR}/server-maintenance.log"
SCRIPT_ID="server-maintenance"
MAINTENANCE_ACTION="ежедневное обслуживание сервера"
MAINTENANCE_HAS_ERRORS=0
MAINTENANCE_ERRORS=()

log() { echo "$(date +"%Y-%m-%d %H:%M:%S") $*" | tee -a "$LOG"; }
notify_maintenance_error() {
  local code="$1"
  local reason="$2"

  MAINTENANCE_HAS_ERRORS=1
  MAINTENANCE_ERRORS+=("{\"code\":\"$code\",\"reason\":\"${reason//\"/\\\"}\"}")
  notify_error_once "$SCRIPT_ID" "$MAINTENANCE_ACTION" "$code" "$reason"
}

log "[maintenance] start"

if command -v apt >/dev/null 2>&1; then
  log "[maintenance] apt clean"
  if apt clean; then
    log "[maintenance] apt clean OK"
  else
    log "ERROR apt clean failed"
    notify_maintenance_error "MAINTENANCE_APT_CLEAN_FAILED" "команда apt clean завершилась ошибкой"
  fi
fi

if command -v journalctl >/dev/null 2>&1; then
  log "[maintenance] journalctl --vacuum-size=100M"
  if journalctl --vacuum-size=100M; then
    log "[maintenance] journalctl --vacuum-size=100M OK"
  else
    log "ERROR journalctl --vacuum-size=100M failed"
    notify_maintenance_error "MAINTENANCE_JOURNAL_VACUUM_FAILED" \
      "команда journalctl --vacuum-size=100M завершилась ошибкой"
  fi
fi

if command -v docker >/dev/null 2>&1; then
  log "[maintenance] docker image prune -f"
  if docker image prune -f >/dev/null 2>&1; then
    log "[maintenance] docker image prune -f OK"
  else
    log "ERROR docker image prune -f failed"
    notify_maintenance_error "MAINTENANCE_DOCKER_IMAGE_PRUNE_FAILED" \
      "команда docker image prune -f завершилась ошибкой"
  fi

  log "[maintenance] docker builder prune -f"
  if docker builder prune -f >/dev/null 2>&1; then
    log "[maintenance] docker builder prune -f OK"
  else
    log "ERROR docker builder prune -f failed"
    notify_maintenance_error "MAINTENANCE_DOCKER_BUILDER_PRUNE_FAILED" \
      "команда docker builder prune -f завершилась ошибкой"
  fi

  log "[maintenance] docker container prune -f"
  if docker container prune -f >/dev/null 2>&1; then
    log "[maintenance] docker container prune -f OK"
  else
    log "ERROR docker container prune -f failed"
    notify_maintenance_error "MAINTENANCE_DOCKER_CONTAINER_PRUNE_FAILED" \
      "команда docker container prune -f завершилась ошибкой"
  fi
fi

log "[maintenance] cleanup /tmp older than 3 days"
if find /tmp -type f -mtime +3 -delete 2>/dev/null; then
  log "[maintenance] cleanup /tmp OK"
else
  log "ERROR /tmp cleanup failed"
  notify_maintenance_error "MAINTENANCE_TMP_CLEANUP_FAILED" \
    "не удалось очистить /tmp от файлов старше трёх дней"
fi

if [ -f /var/lib/logrotate/status ]; then
  log "[maintenance] chmod logrotate status"
  if chmod 600 /var/lib/logrotate/status; then
    log "[maintenance] chmod logrotate status OK"
  else
    log "ERROR chmod /var/lib/logrotate/status failed"
    notify_maintenance_error "MAINTENANCE_LOGROTATE_PERM_FIX_FAILED" \
      "не удалось исправить права /var/lib/logrotate/status"
  fi
fi

if command -v docker >/dev/null 2>&1; then
  if autoteka_runtime_compose exec -T php true >/dev/null 2>&1; then
    log "[maintenance] Laravel optimize:clear + session prune"
    if ! autoteka_runtime_compose exec -T php sh -lc 'cd /var/www/backend/apps/ShopAPI && php artisan optimize:clear --ansi' >/dev/null 2>&1; then
      log "WARN ShopAPI optimize:clear failed (non-fatal)"
    fi
    if ! autoteka_runtime_compose exec -T php sh -lc 'cd /var/www/backend/apps/ShopOperator && php artisan optimize:clear --ansi' >/dev/null 2>&1; then
      log "WARN ShopOperator optimize:clear failed (non-fatal)"
    fi
    if ! autoteka_runtime_compose exec -T php sh -lc 'cd /var/www/backend/apps/ShopAPI && php artisan autoteka:session:prune --ansi' >/dev/null 2>&1; then
      log "WARN ShopAPI session prune failed (non-fatal)"
    fi
    if ! autoteka_runtime_compose exec -T php sh -lc 'cd /var/www/backend/apps/ShopOperator && php artisan autoteka:session:prune --ansi' >/dev/null 2>&1; then
      log "WARN ShopOperator session prune failed (non-fatal)"
    fi
    log "[maintenance] Laravel optimize:clear + session prune OK"
  else
    log "[maintenance] Laravel maintenance skipped (php container not ready)"
  fi
fi

log "[maintenance] backup"
if bash "$INFRA_ROOT/maintenance/backup.sh"; then
  log "[maintenance] backup OK"
else
  log "ERROR backup failed"
  notify_maintenance_error "MAINTENANCE_BACKUP_FAILED" \
    "не удалось создать резервную копию"
fi

if [ "$MAINTENANCE_HAS_ERRORS" -eq 0 ]; then
  log "[maintenance] end, result: OK"
  clear_script_notification_locks "$SCRIPT_ID"
else
  MAINT_ERR_JSON="$(IFS=,; echo "${MAINTENANCE_ERRORS[*]}")"
  log "[maintenance] end ERRORS_START{\"errors\":[$MAINT_ERR_JSON]}ERRORS_END"
fi
