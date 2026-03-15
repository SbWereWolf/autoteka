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
source "$INFRA_ROOT/lib/telegram.sh"
load_telegram_env

LOG="/var/log/server-maintenance.log"
SCRIPT_ID="server-maintenance"
MAINTENANCE_ACTION="ежедневное обслуживание сервера"
MAINTENANCE_HAS_ERRORS=0

log() { echo "$(date -Is) $*" | tee -a "$LOG"; }
notify_maintenance_error() {
  local code="$1"
  local reason="$2"

  MAINTENANCE_HAS_ERRORS=1
  notify_error_once "$SCRIPT_ID" "$MAINTENANCE_ACTION" "$code" "$reason"
}

log "Maintenance start"

if command -v apt >/dev/null 2>&1; then
  log "apt clean"
  if ! apt clean; then
    log "ERROR apt clean failed"
    notify_maintenance_error "MAINTENANCE_APT_CLEAN_FAILED" "команда apt clean завершилась ошибкой"
  fi
fi

if command -v journalctl >/dev/null 2>&1; then
  log "journalctl --vacuum-size=100M"
  if ! journalctl --vacuum-size=100M; then
    log "ERROR journalctl --vacuum-size=100M failed"
    notify_maintenance_error "MAINTENANCE_JOURNAL_VACUUM_FAILED" \
      "команда journalctl --vacuum-size=100M завершилась ошибкой"
  fi
fi

if command -v docker >/dev/null 2>&1; then
  log "docker image prune -f"
  if ! docker image prune -f >/dev/null 2>&1; then
    log "ERROR docker image prune -f failed"
    notify_maintenance_error "MAINTENANCE_DOCKER_IMAGE_PRUNE_FAILED" \
      "команда docker image prune -f завершилась ошибкой"
  fi

  log "docker builder prune -f"
  if ! docker builder prune -f >/dev/null 2>&1; then
    log "ERROR docker builder prune -f failed"
    notify_maintenance_error "MAINTENANCE_DOCKER_BUILDER_PRUNE_FAILED" \
      "команда docker builder prune -f завершилась ошибкой"
  fi

  log "docker container prune -f"
  if ! docker container prune -f >/dev/null 2>&1; then
    log "ERROR docker container prune -f failed"
    notify_maintenance_error "MAINTENANCE_DOCKER_CONTAINER_PRUNE_FAILED" \
      "команда docker container prune -f завершилась ошибкой"
  fi
fi

log "cleanup /tmp older than 3 days"
if ! find /tmp -type f -mtime +3 -delete 2>/dev/null; then
  log "ERROR /tmp cleanup failed"
  notify_maintenance_error "MAINTENANCE_TMP_CLEANUP_FAILED" \
    "не удалось очистить /tmp от файлов старше трёх дней"
fi

if [ -f /var/lib/logrotate/status ]; then
  if ! chmod 600 /var/lib/logrotate/status; then
    log "ERROR chmod /var/lib/logrotate/status failed"
    notify_maintenance_error "MAINTENANCE_LOGROTATE_PERM_FIX_FAILED" \
      "не удалось исправить права /var/lib/logrotate/status"
  fi
fi

log "storage+database backup"
if ! bash "$INFRA_ROOT/maintenance/storage-backup.sh"; then
  log "ERROR storage backup failed"
  notify_maintenance_error "MAINTENANCE_STORAGE_BACKUP_FAILED" \
    "не удалось создать storage+database backup или очистить старые архивы"
fi

log "Maintenance end"
if [ "$MAINTENANCE_HAS_ERRORS" -eq 0 ]; then
  clear_script_notification_locks "$SCRIPT_ID"
fi
