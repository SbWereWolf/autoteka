#!/usr/bin/env sh
set -eu
cd /var/www/backend
mkdir -p /usr/local/etc/php/conf.d /usr/local/etc/php-fpm.d
envsubst '${PHP_OPCACHE_VALIDATE_TIMESTAMPS} ${PHP_OPCACHE_REVALIDATE_FREQ}' < /usr/local/share/php/zz-app.ini.template > /usr/local/etc/php/conf.d/zz-app.ini
envsubst '${PHP_FPM_PM_MAX_CHILDREN} ${PHP_FPM_PM_START_SERVERS} ${PHP_FPM_PM_MIN_SPARE_SERVERS} ${PHP_FPM_PM_MAX_SPARE_SERVERS}' < /usr/local/share/php-fpm/zz-www.conf.template > /usr/local/etc/php-fpm.d/zz-www.conf
[ -f .env ] || cp example.env .env
if [ -n "${APP_KEY:-}" ]; then
  if grep -q '^APP_KEY=' .env; then sed -i "s#^APP_KEY=.*#APP_KEY=${APP_KEY}#" .env; else printf '
APP_KEY=%s
' "$APP_KEY" >> .env; fi
fi
mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
mkdir -p storage/app/public
if [ ! -d public ] || [ -L public ]; then
  rm -rf public
fi
mkdir -p public
if [ -L public/storage ] || [ ! -d public/storage ] || [ -f public/storage ]; then
  rm -rf public/storage
fi
if [ -d storage/app/public ]; then
  ln -sfn ../storage/app/public public/storage
else
  mkdir -p public/storage
fi
[ -f database/database.sqlite ] || touch database/database.sqlite
chown -R www-data:www-data /var/www/backend
php artisan package:discover --ansi >/dev/null 2>&1 || true
if ! grep -qE '^APP_KEY=base64:' .env; then php artisan key:generate --force --ansi || true; fi
php artisan config:clear --ansi >/dev/null 2>&1 || true
php artisan route:clear --ansi >/dev/null 2>&1 || true
php artisan view:clear --ansi >/dev/null 2>&1 || true
if [ "${RUN_LARAVEL_OPTIMIZE:-true}" = "true" ]; then
  php artisan config:cache --ansi || true
  php artisan route:cache --ansi || true
  php artisan view:cache --ansi || true
fi
exec "$@"
