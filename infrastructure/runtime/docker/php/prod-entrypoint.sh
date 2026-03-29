#!/usr/bin/env sh
set -eu
cd /var/www/backend
mkdir -p /usr/local/etc/php/conf.d /usr/local/etc/php-fpm.d
envsubst '${PHP_OPCACHE_VALIDATE_TIMESTAMPS} ${PHP_OPCACHE_REVALIDATE_FREQ}' < /usr/local/share/php/zz-app.ini.template > /usr/local/etc/php/conf.d/zz-app.ini
envsubst '${PHP_FPM_PM_MAX_CHILDREN} ${PHP_FPM_PM_START_SERVERS} ${PHP_FPM_PM_MIN_SPARE_SERVERS} ${PHP_FPM_PM_MAX_SPARE_SERVERS}' < /usr/local/share/php-fpm/zz-www.conf.template > /usr/local/etc/php-fpm.d/zz-www.conf

[ -f apps/ShopAPI/.env ] || cp apps/ShopAPI/example.env apps/ShopAPI/.env

[ -f apps/ShopOperator/.env ] || cp apps/ShopOperator/example.env apps/ShopOperator/.env

mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache storage/app/public storage/app/private \
  apps/ShopAPI/storage/framework/cache apps/ShopAPI/storage/framework/cache/data apps/ShopAPI/storage/framework/sessions apps/ShopAPI/storage/framework/views apps/ShopAPI/storage/framework/testing apps/ShopAPI/storage/logs apps/ShopAPI/bootstrap/cache \
  apps/ShopOperator/storage/framework/cache apps/ShopOperator/storage/framework/cache/data apps/ShopOperator/storage/framework/sessions apps/ShopOperator/storage/framework/views apps/ShopOperator/storage/framework/testing apps/ShopOperator/storage/logs apps/ShopOperator/bootstrap/cache

[ -f database/database.sqlite ] || touch database/database.sqlite

if [ "${APP_KEY:-}" = "" ]; then
  unset APP_KEY
fi

rm -rf apps/ShopAPI/public/storage apps/ShopOperator/public/storage
ln -sfn ../../../storage/app/public apps/ShopAPI/public/storage
ln -sfn ../../../storage/app/public apps/ShopOperator/public/storage

chown -R www-data:www-data \
  /var/www/backend/database \
  /var/www/backend/storage \
  /var/www/backend/bootstrap/cache \
  /var/www/backend/apps/ShopAPI/storage \
  /var/www/backend/apps/ShopAPI/bootstrap/cache \
  /var/www/backend/apps/ShopOperator/storage \
  /var/www/backend/apps/ShopOperator/bootstrap/cache

(cd apps/ShopOperator && php artisan package:discover --ansi >/dev/null 2>&1 || true)
(cd apps/ShopOperator && php artisan optimize:clear --ansi >/dev/null 2>&1 || true)

(cd apps/ShopAPI && php artisan package:discover --ansi >/dev/null 2>&1 || true)
(cd apps/ShopAPI && php artisan optimize:clear --ansi >/dev/null 2>&1 || true)


if [ "${LARAVEL_OPTIMIZE}" = "true" ]; then
  (cd apps/ShopAPI && php artisan config:cache --ansi || true)
  (cd apps/ShopAPI && php artisan route:cache --ansi || true)
  (cd apps/ShopAPI && php artisan event:cache --ansi || true)
  (cd apps/ShopAPI && php artisan view:cache --ansi || true)

  (cd apps/ShopOperator && php artisan config:cache --ansi || true)
  (cd apps/ShopOperator && php artisan route:cache --ansi || true)
  (cd apps/ShopOperator && php artisan event:cache --ansi || true)
  (cd apps/ShopOperator && php artisan view:cache --ansi || true)
  (cd apps/ShopOperator && php artisan vendor:publish --tag=laravel-assets --ansi --force || true)
fi
exec "$@"
