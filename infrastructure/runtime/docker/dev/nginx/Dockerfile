FROM nginx:1.27-alpine
RUN apk add --no-cache bash gettext
COPY --from=infra runtime/docker/dev/nginx/entrypoint.sh /docker-entrypoint.d/40-render-dev-config.sh
COPY --from=infra runtime/docker/dev/nginx/sourc.templatee.conf /etc/nginx/templates/sourc.templatee.conf
COPY --from=infra runtime/docker/dev/nginx/bundle-watch.template.conf /etc/nginx/templates/bundle-watch.template.conf
RUN chmod +x /docker-entrypoint.d/40-render-dev-config.sh
EXPOSE 80
