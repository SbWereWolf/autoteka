#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_LARAVEL_RUNTIME_SH:-}" ]; then
  AUTOTEKA_LIB_LARAVEL_RUNTIME_SH=1

  # INFRA_ROOT должен быть задан вызывающим скриптом (env или args)
  # shellcheck disable=SC1090
  source "$INFRA_ROOT/lib/bootstrap.sh"

  compose() {
    /usr/bin/docker compose -f "$INFRA_ROOT/runtime/docker-compose.yml" "$@"
  }

  sync_shared_envs() {
    compose exec -T php sh -lc '
      set -eu
      cd /var/www/backend
      [ -f .env ] || cp example.env .env
      [ -f apps/ShopAPI/.env ] || cp apps/ShopAPI/example.env apps/ShopAPI/.env
      [ -f apps/ShopOperator/.env ] || cp apps/ShopOperator/example.env apps/ShopOperator/.env
      cp .env apps/ShopAPI/.env
      cp .env apps/ShopOperator/.env
    '
  }

  ensure_module_dependencies() {
    compose exec -T php sh -lc '
      set -eu
      cd /var/www/backend
      for module_dir in apps/ShopAPI apps/ShopOperator; do
        case "$module_dir" in
          */packages/SchemaDefinition|packages/SchemaDefinition)
            continue
            ;;
        esac
        if [ -f "$module_dir/composer.json" ] && [ ! -f "$module_dir/vendor/autoload.php" ]; then
          (
            cd "$module_dir"
            composer install --prefer-dist --no-interaction --optimize-autoloader
          )
        fi
      done
    '
  }

  ensure_app_key() {
    compose exec -T php sh -lc '
      set -eu
      cd /var/www/backend
      if ! grep -qE "^APP_KEY=base64:" .env; then
        if [ -f apps/ShopAPI/.env ]; then
          (cd apps/ShopAPI && php artisan key:generate --force --ansi)
        elif [ -f apps/ShopOperator/.env ]; then
          (cd apps/ShopOperator && php artisan key:generate --force --ansi)
        fi
        if [ -f apps/ShopAPI/.env ]; then
          cp apps/ShopAPI/.env .env
          cp .env apps/ShopOperator/.env
        fi
      fi
    '
  }

  prepare_laravel_runtime() {
    compose exec -T php sh -lc '
      set -eu
      cd /var/www/backend
      [ -f .env ] || cp example.env .env
      [ -f apps/ShopAPI/.env ] || cp apps/ShopAPI/example.env apps/ShopAPI/.env
      [ -f apps/ShopOperator/.env ] || cp apps/ShopOperator/example.env apps/ShopOperator/.env
      mkdir -p         database         storage/app/public         storage/app/private         storage/framework/cache         storage/framework/cache/data         storage/framework/sessions         storage/framework/views         storage/framework/testing         storage/logs         bootstrap/cache
      [ -f database/database.sqlite ] || touch database/database.sqlite
      mkdir -p         apps/ShopAPI/storage/framework/cache         apps/ShopAPI/storage/framework/cache/data         apps/ShopAPI/storage/framework/sessions         apps/ShopAPI/storage/framework/views         apps/ShopAPI/storage/framework/testing         apps/ShopAPI/storage/logs         apps/ShopAPI/bootstrap/cache
      mkdir -p         apps/ShopOperator/storage/framework/cache         apps/ShopOperator/storage/framework/cache/data         apps/ShopOperator/storage/framework/sessions         apps/ShopOperator/storage/framework/views         apps/ShopOperator/storage/framework/testing         apps/ShopOperator/storage/logs         apps/ShopOperator/bootstrap/cache
      for module_dir in apps/ShopAPI apps/ShopOperator; do
        case "$module_dir" in
          */packages/SchemaDefinition|packages/SchemaDefinition)
            continue
            ;;
        esac
        if [ -f "$module_dir/composer.json" ] && [ ! -f "$module_dir/vendor/autoload.php" ]; then
          (
            cd "$module_dir"
            composer install --prefer-dist --no-interaction --optimize-autoloader
          )
        fi
      done
      cp .env apps/ShopAPI/.env
      cp .env apps/ShopOperator/.env
      mkdir -p apps/ShopAPI/public apps/ShopOperator/public
      rm -rf apps/ShopAPI/public/storage apps/ShopOperator/public/storage
      ln -sfn ../../../storage/app/public apps/ShopAPI/public/storage
      ln -sfn ../../../storage/app/public apps/ShopOperator/public/storage
      if ! grep -qE "^APP_KEY=base64:" .env; then
        if [ -f apps/ShopAPI/artisan ]; then
          (cd apps/ShopAPI && php artisan key:generate --force --ansi)
        elif [ -f apps/ShopOperator/artisan ]; then
          (cd apps/ShopOperator && php artisan key:generate --force --ansi)
        fi
        cp apps/ShopAPI/.env .env
        cp .env apps/ShopOperator/.env
      fi
      chown -R www-data:www-data database storage bootstrap/cache apps/ShopAPI/storage apps/ShopAPI/bootstrap/cache apps/ShopOperator/storage apps/ShopOperator/bootstrap/cache
      find database storage bootstrap/cache apps/ShopAPI/storage apps/ShopAPI/bootstrap/cache apps/ShopOperator/storage apps/ShopOperator/bootstrap/cache -type d -exec chmod 775 {} \;
      find database storage bootstrap/cache apps/ShopAPI/storage apps/ShopAPI/bootstrap/cache apps/ShopOperator/storage apps/ShopOperator/bootstrap/cache -type f -exec chmod 664 {} \;
    '
  }

  ensure_package_lock_for_deploy() {
    local root="${AUTOTEKA_ROOT:?}"
    local pair src dest
    for pair in \
      "package-lock.wsl.json:package-lock.json" \
      "frontend/package-lock.wsl.json:frontend/package-lock.json" \
      "system-tests/package-lock.wsl.json:system-tests/package-lock.json" \
      "infrastructure/tests/package-lock.wsl.json:infrastructure/tests/package-lock.json"; do
      src="${pair%%:*}"
      dest="${pair##*:}"
      if [ -f "$root/$src" ] && [ ! -f "$root/$dest" ]; then
        cp "$root/$src" "$root/$dest"
      fi
    done
  }

  api_artisan_in_php() {
    local command="$1"

    compose exec -T php sh -lc "
      set -eu
      cd /var/www/backend/apps/ShopAPI
      php artisan $command
    "
  }

  admin_artisan_in_php() {
    local command="$1"

    compose exec -T php sh -lc "
      set -eu
      cd /var/www/backend/apps/ShopOperator
      php artisan $command
    "
  }

  artisan_in_php() {
    api_artisan_in_php "$1"
  }

  wait_for_php_exec_ready() {
    local timeout="${1:-60}"
    local started_at

    started_at="$(date +%s)"

    while true; do
      if compose exec -T php sh -lc 'cd /var/www/backend/apps/ShopAPI && pwd >/dev/null && cd /var/www/backend/apps/ShopOperator && pwd >/dev/null' >/dev/null 2>&1; then
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
    api_artisan_in_php "optimize:clear"
    admin_artisan_in_php "optimize:clear"
  }

  prepare_laravel_runtime_and_clear() {
    prepare_laravel_runtime
    clear_laravel_optimizations
  }

  check_sqlite_write_access() {
    api_artisan_in_php "tinker --execute='session([\"deploy_runtime_check\" => \"ok\"]); DB::table(\"sessions\")->count(); cache()->put(\"deploy_runtime_check\", \"ok\", 60);'"
  }

  http_smoke_check() {
    local url="$1"
    local retries="${HTTP_SMOKE_RETRIES}"
    local delay="${HTTP_SMOKE_DELAY_SEC}"
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
