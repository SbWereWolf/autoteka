#!/usr/bin/env sh
set -eu

cd /var/www/backend

ensure_runtime_permissions() {
  mkdir -p \
    bootstrap/cache \
    database \
    storage \
    storage/framework \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

  touch database/database.sqlite

  chown -R www-data:www-data \
    bootstrap/cache \
    database \
    storage

  chmod -R ug+rwX \
    bootstrap/cache \
    database \
    storage
}

if [ ! -f .env ]; then
  cp example.env .env
fi

ensure_runtime_permissions

exec php-fpm -F
