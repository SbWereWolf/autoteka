#!/usr/bin/env sh
set -eu
cd /workspace/backend
envsubst '${XDEBUG_MODE} ${XDEBUG_START_WITH_REQUEST} ${XDEBUG_CLIENT_HOST} ${XDEBUG_CLIENT_PORT} ${XDEBUG_IDEKEY}' < /usr/local/share/php/zz-xdebug.ini.template > /usr/local/etc/php/conf.d/zz-xdebug.ini
[ -f .env ] || cp example.env .env
[ -f apps/API/.env ] || cp apps/API/example.env apps/API/.env
[ -f apps/DatabaseOperator/.env ] || cp apps/DatabaseOperator/example.env apps/DatabaseOperator/.env
mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache storage/app/public storage/app/private apps/API/bootstrap/cache apps/DatabaseOperator/bootstrap/cache
[ -f database/database.sqlite ] || touch database/database.sqlite
cp .env apps/API/.env
cp .env apps/DatabaseOperator/.env
if [ "${APP_KEY:-}" = "" ]; then
  unset APP_KEY
fi
if [ -f apps/API/composer.json ] && [ ! -f apps/API/vendor/autoload.php ]; then
  (cd apps/API && composer install --prefer-dist --no-interaction)
fi
if [ -f apps/DatabaseOperator/composer.json ] && [ ! -f apps/DatabaseOperator/vendor/autoload.php ]; then
  (cd apps/DatabaseOperator && composer install --prefer-dist --no-interaction)
fi
rm -rf apps/API/public/storage apps/DatabaseOperator/public/storage
ln -sfn ../../../storage/app/public apps/API/public/storage
ln -sfn ../../../storage/app/public apps/DatabaseOperator/public/storage
(cd apps/API && php artisan package:discover --ansi >/dev/null 2>&1 || true)
(cd apps/DatabaseOperator && php artisan package:discover --ansi >/dev/null 2>&1 || true)
if ! grep -qE '^APP_KEY=base64:' .env; then
  (cd apps/API && php artisan key:generate --force --ansi || true)
  cp apps/API/.env .env
  cp .env apps/DatabaseOperator/.env
fi
(cd apps/API && php artisan optimize:clear --ansi >/dev/null 2>&1 || true)
(cd apps/DatabaseOperator && php artisan optimize:clear --ansi >/dev/null 2>&1 || true)
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  (cd apps/DatabaseOperator && php artisan migrate --force --ansi)
  (cd apps/DatabaseOperator && php artisan db:seed --class=AdminUserSeeder --force --ansi)
fi
exec "$@"
