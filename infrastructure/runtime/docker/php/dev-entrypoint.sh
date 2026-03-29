#!/usr/bin/env sh
set -eu
cd /workspace/backend
envsubst '${XDEBUG_MODE} ${XDEBUG_START} ${XDEBUG_CLIENT} ${XDEBUG_PORT} ${XDEBUG_IDEKEY}' < /usr/local/share/php/zz-xdebug.ini.template > /usr/local/etc/php/conf.d/zz-xdebug.ini

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

if [ "${APP_KEY:-}" = "" ]; then
  unset APP_KEY
fi

rm -rf apps/ShopAPI/public/storage apps/ShopOperator/public/storage
ln -sfn ../../../storage/app/public apps/ShopAPI/public/storage
ln -sfn ../../../storage/app/public apps/ShopOperator/public/storage

(cd apps/ShopAPI && php artisan package:discover --ansi >/dev/null 2>&1 || true)
(cd apps/ShopAPI && php artisan optimize:clear --ansi >/dev/null 2>&1 || true)

(cd apps/ShopOperator && php artisan package:discover --ansi >/dev/null 2>&1 || true)
(cd apps/ShopOperator && php artisan optimize:clear --ansi >/dev/null 2>&1 || true)

exec "$@"
