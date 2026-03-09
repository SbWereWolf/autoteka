#!/usr/bin/env sh
set -eu
cd /workspace/backend
envsubst '${XDEBUG_MODE} ${XDEBUG_START_WITH_REQUEST} ${XDEBUG_CLIENT_HOST} ${XDEBUG_CLIENT_PORT} ${XDEBUG_IDEKEY}' < /usr/local/share/php/zz-xdebug.ini.template > /usr/local/etc/php/conf.d/zz-xdebug.ini
[ -f .env ] || cp example.env .env
if [ -n "${APP_KEY:-}" ]; then
  if grep -q '^APP_KEY=' .env; then sed -i "s#^APP_KEY=.*#APP_KEY=${APP_KEY}#" .env; else printf '
APP_KEY=%s
' "$APP_KEY" >> .env; fi
fi
mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache public/storage
[ -f database/database.sqlite ] || touch database/database.sqlite
if [ ! -f vendor/autoload.php ]; then composer install --prefer-dist --no-interaction; fi
php artisan package:discover --ansi >/dev/null 2>&1 || true
if ! grep -qE '^APP_KEY=base64:' .env; then php artisan key:generate --force --ansi || true; fi
php artisan config:clear --ansi >/dev/null 2>&1 || true
php artisan route:clear --ansi >/dev/null 2>&1 || true
php artisan view:clear --ansi >/dev/null 2>&1 || true
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then php artisan migrate --force --ansi; fi
exec "$@"
