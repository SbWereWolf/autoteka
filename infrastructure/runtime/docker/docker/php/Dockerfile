# syntax=docker/dockerfile:1.7

FROM php:8.2-fpm-alpine AS php-base
RUN apk add --no-cache     bash     fcgi     gettext     git     icu-dev     libxml2-dev     linux-headers     oniguruma-dev     sqlite     sqlite-dev     unzip  && docker-php-ext-install pdo pdo_sqlite intl mbstring xml opcache  && rm -rf /var/cache/apk/*
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/backend

FROM php-base AS prod
COPY backend /var/www/backend
COPY --from=infra runtime/docker/docker/php/php.ini.prod.template /usr/local/share/php/zz-app.ini.template
COPY --from=infra runtime/docker/docker/php/php-fpm-www.prod.template /usr/local/share/php-fpm/zz-www.conf.template
COPY --from=infra runtime/docker/docker/php/prod-entrypoint.sh /usr/local/bin/backend-entrypoint
RUN chmod +x /usr/local/bin/backend-entrypoint && \
  mkdir -p /workspace && ln -snf /var/www/backend /workspace/backend && \
  mkdir -p /var/www/backend/database /var/www/backend/storage/framework/cache /var/www/backend/storage/framework/sessions /var/www/backend/storage/framework/views /var/www/backend/storage/logs /var/www/backend/bootstrap/cache \
    /var/www/backend/apps/ShopAPI/storage/framework/cache /var/www/backend/apps/ShopAPI/storage/framework/cache/data /var/www/backend/apps/ShopAPI/storage/framework/sessions /var/www/backend/apps/ShopAPI/storage/framework/views /var/www/backend/apps/ShopAPI/storage/framework/testing /var/www/backend/apps/ShopAPI/storage/logs /var/www/backend/apps/ShopAPI/bootstrap/cache \
    /var/www/backend/apps/ShopOperator/storage/framework/cache /var/www/backend/apps/ShopOperator/storage/framework/cache/data /var/www/backend/apps/ShopOperator/storage/framework/sessions /var/www/backend/apps/ShopOperator/storage/framework/views /var/www/backend/apps/ShopOperator/storage/framework/testing /var/www/backend/apps/ShopOperator/storage/logs /var/www/backend/apps/ShopOperator/bootstrap/cache && \
  touch /workspace/backend/database/database.sqlite && \
  for module in ShopAPI ShopOperator; do \
    if [ -f /var/www/backend/apps/"$module"/composer.json ]; then \
      cd /var/www/backend/apps/"$module" && composer install --prefer-dist --no-interaction --optimize-autoloader; \
    fi; \
  done && \
  chown -R www-data:www-data /var/www/backend
EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/backend-entrypoint"]
CMD ["php-fpm", "-F"]

FROM php-base AS dev
RUN apk add --no-cache autoconf gcc g++ make     && pecl install xdebug     && docker-php-ext-enable xdebug     && rm -rf /tmp/pear     && apk del autoconf gcc g++ make
COPY --from=infra runtime/docker/docker/php/php.ini.dev /usr/local/etc/php/conf.d/zz-app.ini
COPY --from=infra runtime/docker/docker/php/xdebug.ini.template /usr/local/share/php/zz-xdebug.ini.template
COPY --from=infra runtime/docker/docker/php/php-fpm-www.dev.conf /usr/local/etc/php-fpm.d/zz-www.conf
COPY --from=infra runtime/docker/docker/php/dev-entrypoint.sh /usr/local/bin/backend-entrypoint
RUN chmod +x /usr/local/bin/backend-entrypoint
WORKDIR /workspace/backend
EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/backend-entrypoint"]
CMD ["php-fpm", "-F"]
