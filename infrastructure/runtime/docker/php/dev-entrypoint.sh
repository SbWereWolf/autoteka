#!/usr/bin/env sh
set -eu
cd /workspace/backend
envsubst '${XDEBUG_MODE} ${XDEBUG_START_WITH_REQUEST} ${XDEBUG_CLIENT_HOST} ${XDEBUG_CLIENT_PORT} ${XDEBUG_IDEKEY}' < /usr/local/share/php/zz-xdebug.ini.template > /usr/local/etc/php/conf.d/zz-xdebug.ini
[ -f .env ] || cp example.env .env
[ -f apps/ShopAPI/.env ] || cp apps/ShopAPI/example.env apps/ShopAPI/.env
[ -f apps/ShopOperator/.env ] || cp apps/ShopOperator/example.env apps/ShopOperator/.env
mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache storage/app/public storage/app/private \
  apps/ShopAPI/storage/framework/cache apps/ShopAPI/storage/framework/cache/data apps/ShopAPI/storage/framework/sessions apps/ShopAPI/storage/framework/views apps/ShopAPI/storage/framework/testing apps/ShopAPI/storage/logs apps/ShopAPI/bootstrap/cache \
  apps/ShopOperator/storage/framework/cache apps/ShopOperator/storage/framework/cache/data apps/ShopOperator/storage/framework/sessions apps/ShopOperator/storage/framework/views apps/ShopOperator/storage/framework/testing apps/ShopOperator/storage/logs apps/ShopOperator/bootstrap/cache
# Ensure Laravel cache/view dirs are writable from php-fpm.
chown -R www-data:www-data \
  apps/ShopAPI/bootstrap/cache apps/ShopOperator/bootstrap/cache \
  apps/ShopAPI/storage/framework apps/ShopOperator/storage/framework || true
chmod -R ug+rwX \
  apps/ShopAPI/bootstrap/cache apps/ShopOperator/bootstrap/cache \
  apps/ShopAPI/storage/framework apps/ShopOperator/storage/framework || true
[ -f database/database.sqlite ] || touch database/database.sqlite
cp .env apps/ShopAPI/.env
cp .env apps/ShopOperator/.env
if [ "${APP_KEY:-}" = "" ]; then
  unset APP_KEY
fi
module_requires_path_package() {
  module_dir="$1"
  package_name="$2"
  grep -q "\"$package_name\"" "$module_dir/composer.json"
}

module_needs_composer_sync() {
  module_dir="$1"

  if [ ! -f "$module_dir/vendor/autoload.php" ]; then
    return 0
  fi

  if module_requires_path_package "$module_dir" "autoteka/laravel-session-prune" \
    && [ ! -e "$module_dir/vendor/autoteka/laravel-session-prune" ]; then
    return 0
  fi

  if ! module_requires_path_package "$module_dir" "autoteka/laravel-runtime" \
    && [ -e "$module_dir/vendor/autoteka/laravel-runtime" ]; then
    return 0
  fi

  if module_requires_path_package "$module_dir" "autoteka/is-there-an-admin" \
    && [ ! -e "$module_dir/vendor/autoteka/is-there-an-admin" ]; then
    return 0
  fi

  return 1
}

for module_dir in apps/ShopAPI apps/ShopOperator; do
  if [ -f "$module_dir/composer.json" ] && module_needs_composer_sync "$module_dir"; then
    (cd "$module_dir" && composer install --prefer-dist --no-interaction)
  fi
done
rm -rf apps/ShopAPI/public/storage apps/ShopOperator/public/storage
ln -sfn ../../../storage/app/public apps/ShopAPI/public/storage
ln -sfn ../../../storage/app/public apps/ShopOperator/public/storage
(cd apps/ShopAPI && php artisan package:discover --ansi >/dev/null 2>&1 || true)
(cd apps/ShopOperator && php artisan package:discover --ansi >/dev/null 2>&1 || true)
if ! grep -qE '^APP_KEY=base64:' .env; then
  (cd apps/ShopAPI && php artisan key:generate --force --ansi || true)
  cp apps/ShopAPI/.env .env
  cp .env apps/ShopOperator/.env
fi
(cd apps/ShopAPI && php artisan optimize:clear --ansi >/dev/null 2>&1 || true)
(cd apps/ShopOperator && php artisan optimize:clear --ansi >/dev/null 2>&1 || true)
if [ "${RUN_MIGRATIONS}" = "true" ]; then
  admin_email="${MOONSHINE_ADMIN_EMAIL:-admin@example.com}"
  (cd apps/ShopOperator && php artisan migrate --force --ansi)
  set +e
  (cd apps/ShopOperator && php artisan autoteka:is-there-an-admin "$admin_email" --ansi)
  admin_check_status=$?
  set -e
  case "$admin_check_status" in
    0)
      (cd apps/ShopOperator && php artisan db:seed --class=AdminUserSeeder --force --ansi)
      ;;
    4)
      :
      ;;
    *)
      exit "$admin_check_status"
      ;;
  esac
fi
exec "$@"
