#!/usr/bin/env sh
set -eu

cd /var/www/backend

if [ ! -f .env ]; then
  cp example.env .env
fi

composer install --no-interaction --prefer-dist --optimize-autoloader

if ! grep -q "^APP_KEY=base64:" .env; then
  php artisan key:generate --force
fi

mkdir -p database
touch database/database.sqlite

php artisan migrate --force
php artisan db:seed --class=AdminUserSeeder --force

exec php-fpm -F
