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
if [ -f apps/ShopAPI/composer.json ] && [ ! -f apps/ShopAPI/vendor/autoload.php ]; then
  (cd apps/ShopAPI && composer install --prefer-dist --no-interaction)
fi
if [ -f apps/ShopOperator/composer.json ] && [ ! -f apps/ShopOperator/vendor/autoload.php ]; then
  (cd apps/ShopOperator && composer install --prefer-dist --no-interaction)
fi
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
  (cd apps/ShopOperator && php artisan migrate --force --ansi)
  (cd apps/ShopOperator && php artisan db:seed --class=AdminUserSeeder --force --ansi)
fi
exec "$@"
