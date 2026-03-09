#!/usr/bin/env sh
set -eu
API_CACHE_TTL="${API_CACHE_TTL:-3600}"
case "$API_CACHE_TTL" in ''|*[!0-9]*) echo "API_CACHE_TTL must be integer seconds, got: $API_CACHE_TTL" >&2; exit 1;; esac
export API_CACHE_CONTROL_GET="public, max-age=${API_CACHE_TTL}"
export API_CACHE_CONTROL_MUTATION="no-store, no-cache, must-revalidate, max-age=0"
TEMPLATE=/etc/nginx/templates/source.conf.template
if [ "${FRONTEND_MODE:-source}" = "bundle-watch" ]; then TEMPLATE=/etc/nginx/templates/bundle-watch.conf.template; fi
envsubst '${FRONTEND_PORT} ${CORS_ALLOW_ORIGIN} ${CORS_ALLOW_METHODS} ${CORS_ALLOW_HEADERS} ${CORS_EXPOSE_HEADERS} ${CORS_ALLOW_CREDENTIALS} ${CORS_MAX_AGE} ${API_CACHE_CONTROL_GET} ${API_CACHE_CONTROL_MUTATION}' < "$TEMPLATE" > /etc/nginx/conf.d/default.conf
