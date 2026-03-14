#!/usr/bin/env bash
set -euo pipefail

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

DRY_RUN="no"
if [ "${1:-}" = "--dry-run" ] || [ "${1:-}" = "-n" ]; then
  DRY_RUN="yes"
  shift
fi

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'USAGE'
Usage:
  "$INFRA_ROOT"/maintenance/storage-backup.sh [--dry-run]

Purpose:
  Create backup archive for Laravel storage and SQLite database from php container
  and remove old archives by retention policy.

Environment (/etc/autoteka/options.env):
  STORAGE_BACKUP_DIR             Target directory for archives.
                                 Default: /root/autoteka-storage-backups
  STORAGE_BACKUP_RETENTION_DAYS  Delete archives older than this number of days.
                                 Default: 7
USAGE
  exit 0
fi

if [ $# -gt 0 ]; then
  echo "Unknown argument: $1" >&2
  exit 2
fi

BACKUP_DIR="${STORAGE_BACKUP_DIR}"
RETENTION_DAYS="${STORAGE_BACKUP_RETENTION_DAYS}"
TS="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$BACKUP_DIR/storage-db-$TS.tar.gz"
COMPOSE_FILE="$INFRA_ROOT/runtime/docker-compose.yml"

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "STORAGE_BACKUP_RETENTION_DAYS must be integer, got: $RETENTION_DAYS" >&2
  exit 1
fi

if [ "$DRY_RUN" = "yes" ]; then
  echo "[dry-run] backup dir: $BACKUP_DIR"
  echo "[dry-run] archive: $ARCHIVE"
  echo "[dry-run] retention days: $RETENTION_DAYS"
  echo "[dry-run] command: docker compose -f $COMPOSE_FILE exec -T php sh -lc 'cd /var/www/backend && test -d storage && test -f database/database.sqlite && tar -czf - storage database/database.sqlite' > $ARCHIVE"
  echo "[dry-run] command: find $BACKUP_DIR -maxdepth 1 -type f -name 'storage-db-*.tar.gz' -mtime +$RETENTION_DAYS -delete"
  exit 0
fi

mkdir -p "$BACKUP_DIR"

if ! /usr/bin/docker compose -f "$COMPOSE_FILE" exec -T php sh -lc \
  'set -eu; cd /var/www/backend; test -d storage; test -f database/database.sqlite; tar -czf - storage database/database.sqlite' > "$ARCHIVE"; then
  rm -f "$ARCHIVE"
  echo "Failed to create storage backup archive." >&2
  exit 1
fi

find "$BACKUP_DIR" -maxdepth 1 -type f -name 'storage-db-*.tar.gz' -mtime +"$RETENTION_DAYS" -delete

echo "Created storage backup: $ARCHIVE"
