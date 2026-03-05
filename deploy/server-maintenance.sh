#!/usr/bin/env bash
set -euo pipefail

# Daily safe maintenance:
# - apt cache clean
# - journal vacuum
# - docker dangling images/build cache cleanup (NO volume prune)
# - /tmp cleanup
# - fix logrotate status permissions

LOG="/var/log/server-maintenance.log"

log() { echo "$(date -Is) $*" | tee -a "$LOG"; }

log "Maintenance start"

if command -v apt >/dev/null 2>&1; then
  log "apt clean"
  apt clean || true
fi

if command -v journalctl >/dev/null 2>&1; then
  log "journalctl --vacuum-size=100M"
  journalctl --vacuum-size=100M || true
fi

if command -v docker >/dev/null 2>&1; then
  log "docker image prune -f"
  docker image prune -f >/dev/null 2>&1 || true

  log "docker builder prune -f"
  docker builder prune -f >/dev/null 2>&1 || true

  log "docker container prune -f"
  docker container prune -f >/dev/null 2>&1 || true
fi

log "cleanup /tmp older than 3 days"
find /tmp -type f -mtime +3 -delete 2>/dev/null || true

if [ -f /var/lib/logrotate/status ]; then
  chmod 600 /var/lib/logrotate/status || true
fi

log "Maintenance end"
