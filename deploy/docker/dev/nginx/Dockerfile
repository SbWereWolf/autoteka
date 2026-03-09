FROM nginx:1.27-alpine
RUN apk add --no-cache bash gettext
COPY deploy/docker/dev/nginx/entrypoint.sh /docker-entrypoint.d/40-render-dev-config.sh
COPY deploy/docker/dev/nginx/source.conf.template /etc/nginx/templates/source.conf.template
COPY deploy/docker/dev/nginx/bundle-watch.conf.template /etc/nginx/templates/bundle-watch.conf.template
RUN chmod +x /docker-entrypoint.d/40-render-dev-config.sh
EXPOSE 80
