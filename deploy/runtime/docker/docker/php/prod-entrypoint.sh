#!/usr/bin/env sh
set -eu
cd /var/www/backend
mkdir -p /usr/local/etc/php/conf.d /usr/local/etc/php-fpm.d
envsubst '${PHP_OPCACHE_VALIDATE_TIMESTAMPS} ${PHP_OPCACHE_REVALIDATE_FREQ}' < /usr/local/share/php/zz-app.ini.template > /usr/local/etc/php/conf.d/zz-app.ini
envsubst '${PHP_FPM_PM_MAX_CHILDREN} ${PHP_FPM_PM_START_SERVERS} ${PHP_FPM_PM_MIN_SPARE_SERVERS} ${PHP_FPM_PM_MAX_SPARE_SERVERS}' < /usr/local/share/php-fpm/zz-www.conf.template > /usr/local/etc/php-fpm.d/zz-www.conf
[ -f .env ] || cp example.env .env
[ -f apps/API/.env ] || cp apps/API/example.env apps/API/.env
[ -f apps/DatabaseOperator/.env ] || cp apps/DatabaseOperator/example.env apps/DatabaseOperator/.env
mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache storage/app/public storage/app/private apps/API/bootstrap/cache apps/DatabaseOperator/bootstrap/cache
[ -f database/database.sqlite ] || touch database/database.sqlite
cp .env apps/API/.env
cp .env apps/DatabaseOperator/.env
rm -rf apps/API/public/storage apps/DatabaseOperator/public/storage
ln -sfn ../../../storage/app/public apps/API/public/storage
ln -sfn ../../../storage/app/public apps/DatabaseOperator/public/storage
chown -R www-data:www-data /var/www/backend
(cd apps/API && php artisan package:discover --ansi >/dev/null 2>&1 || true)
(cd apps/DatabaseOperator && php artisan package:discover --ansi >/dev/null 2>&1 || true)
if ! grep -qE '^APP_KEY=base64:' .env; then
  (cd apps/API && php artisan key:generate --force --ansi || true)
  cp apps/API/.env .env
  cp .env apps/DatabaseOperator/.env
fi
(cd apps/API && php artisan optimize:clear --ansi >/dev/null 2>&1 || true)
(cd apps/DatabaseOperator && php artisan optimize:clear --ansi >/dev/null 2>&1 || true)
if [ "${RUN_LARAVEL_OPTIMIZE:-true}" = "true" ]; then
  (cd apps/API && php artisan config:cache --ansi || true)
  (cd apps/API && php artisan route:cache --ansi || true)
  (cd apps/API && php artisan view:cache --ansi || true)
  (cd apps/DatabaseOperator && php artisan config:cache --ansi || true)
  (cd apps/DatabaseOperator && php artisan route:cache --ansi || true)
  (cd apps/DatabaseOperator && php artisan view:cache --ansi || true)
  (cd apps/DatabaseOperator && php artisan vendor:publish --tag=laravel-assets --ansi --force || true)
fi
exec "$@"
