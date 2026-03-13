#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR" && while [ ! -f "DEPLOY.md" ] && [ "$PWD" != "/" ]; do cd ..; done; pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"
# shellcheck disable=SC1090
source "$DEPLOY_DIR/lib/bootstrap.sh"
load_autoteka_env

DRY_RUN="no"
if [ "${1:-}" = "--dry-run" ] || [ "${1:-}" = "-n" ]; then
  DRY_RUN="yes"
  shift
fi

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'USAGE'
Usage:
  ./deploy/maintenance/storage-backup.sh [--dry-run]

Purpose:
  Create backup archive for Laravel storage and SQLite database from php container
  and remove old archives by retention policy.

Environment (/etc/autoteka/deploy.env):
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

BACKUP_DIR="${STORAGE_BACKUP_DIR:-/root/autoteka-storage-backups}"
RETENTION_DAYS="${STORAGE_BACKUP_RETENTION_DAYS:-7}"
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
