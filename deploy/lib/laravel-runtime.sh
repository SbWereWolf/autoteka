#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_LARAVEL_RUNTIME_SH:-}" ]; then
  AUTOTEKA_LIB_LARAVEL_RUNTIME_SH=1

  AUTOTEKA_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  # shellcheck disable=SC1090
  source "$AUTOTEKA_LIB_DIR/bootstrap.sh"

  compose() {
    /usr/bin/docker compose -f "$AUTOTEKA_ROOT/deploy/runtime/docker-compose.yml" "$@"
  }

  prepare_laravel_runtime() {
    compose exec -T php sh -lc '
      set -eu
      cd /var/www/backend
      [ -f .env ] || cp example.env .env
      mkdir -p \
        database \
        storage/app/public \
        storage/app/private \
        storage/framework/cache \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/framework/testing \
        storage/logs \
        bootstrap/cache \
        public/storage
      [ -f database/database.sqlite ] || touch database/database.sqlite
      chown -R www-data:www-data database storage bootstrap/cache public/storage
      find database storage bootstrap/cache -type d -exec chmod 775 {} \;
      find database storage bootstrap/cache -type f -exec chmod 664 {} \;
    '
  }

  ensure_public_storage_link() {
    compose exec -T php sh -lc '
      set -eu
      cd /var/www/backend
      php artisan storage:link >/dev/null || true
    '
  }

  artisan_in_php() {
    local command="$1"

    compose exec -T php sh -lc "
      set -eu
      cd /var/www/backend
      php artisan $command
    "
  }

  wait_for_php_exec_ready() {
    local timeout="${1:-60}"
    local started_at

    started_at="$(date +%s)"

    while true; do
      if compose exec -T php sh -lc 'cd /var/www/backend && pwd >/dev/null' >/dev/null 2>&1; then
        return 0
      fi

      if [ $(( $(date +%s) - started_at )) -ge "$timeout" ]; then
        echo "php container did not become ready within ${timeout}s" >&2
        return 1
      fi

      sleep 2
    done
  }

  clear_laravel_optimizations() {
    artisan_in_php "optimize:clear"
  }

  prepare_laravel_runtime_and_clear() {
    prepare_laravel_runtime
    ensure_public_storage_link
    clear_laravel_optimizations
  }

  check_sqlite_write_access() {
    artisan_in_php "tinker --execute=\"session(['deploy_runtime_check' => 'ok']); DB::table('sessions')->count(); cache()->put('deploy_runtime_check', 'ok', 60);\""
  }

  http_smoke_check() {
    local url="$1"
    local retries="${HTTP_SMOKE_RETRIES:-20}"
    local delay="${HTTP_SMOKE_DELAY_SEC:-2}"
    local attempt=1

    while [ "$attempt" -le "$retries" ]; do
      if curl -fsS -o /dev/null -L "$url"; then
        return 0
      fi

      if [ "$attempt" -lt "$retries" ]; then
        sleep "$delay"
      fi

      attempt=$((attempt + 1))
    done

    return 1
  }
fi
