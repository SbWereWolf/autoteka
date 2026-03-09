# syntax=docker/dockerfile:1.7

FROM php:8.2-fpm-alpine AS php-base
RUN apk add --no-cache     bash     fcgi     gettext     git     icu-dev     libxml2-dev     linux-headers     oniguruma-dev     sqlite     sqlite-dev     unzip  && docker-php-ext-install pdo pdo_sqlite intl mbstring xml opcache  && rm -rf /var/cache/apk/*
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/backend

FROM composer:2.8 AS composer-deps
WORKDIR /app/backend
COPY backend/composer.json backend/composer.lock ./
RUN --mount=type=cache,target=/tmp/composer-cache     composer install       --no-dev       --prefer-dist       --no-interaction       --no-scripts       --optimize-autoloader       --apcu-autoloader       --cache-dir=/tmp/composer-cache

FROM php-base AS prod
COPY --from=composer-deps /app/backend/vendor ./vendor
COPY backend .
COPY deploy/runtime/docker/docker/php/php.ini.prod.template /usr/local/share/php/zz-app.ini.template
COPY deploy/runtime/docker/docker/php/php-fpm-www.prod.template /usr/local/share/php-fpm/zz-www.conf.template
COPY deploy/runtime/docker/docker/php/prod-entrypoint.sh /usr/local/bin/backend-entrypoint
RUN chmod +x /usr/local/bin/backend-entrypoint  && mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache public/storage  && chown -R www-data:www-data /var/www/backend
EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/backend-entrypoint"]
CMD ["php-fpm", "-F"]

FROM php-base AS dev
RUN apk add --no-cache autoconf gcc g++ make     && pecl install xdebug     && docker-php-ext-enable xdebug     && rm -rf /tmp/pear     && apk del autoconf gcc g++ make
COPY deploy/runtime/docker/docker/php/php.ini.dev /usr/local/etc/php/conf.d/zz-app.ini
COPY deploy/runtime/docker/docker/php/xdebug.ini.template /usr/local/share/php/zz-xdebug.ini.template
COPY deploy/runtime/docker/docker/php/php-fpm-www.dev.conf /usr/local/etc/php-fpm.d/zz-www.conf
COPY deploy/runtime/docker/docker/php/dev-entrypoint.sh /usr/local/bin/backend-entrypoint
RUN chmod +x /usr/local/bin/backend-entrypoint
WORKDIR /workspace/backend
EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/backend-entrypoint"]
CMD ["php-fpm", "-F"]
