#!/usr/bin/env sh
set -eu
API_CACHE_TTL="${API_CACHE_TTL}"
case "$API_CACHE_TTL" in ''|*[!0-9]*) echo "API_CACHE_TTL must be integer seconds, got: $API_CACHE_TTL" >&2; exit 1;; esac
export API_CACHE_CONTROL_GET="public, max-age=${API_CACHE_TTL}"
export API_CACHE_CONTROL_MUTATION="no-store, no-cache, must-revalidate, max-age=0"
envsubst '${API_CACHE_CONTROL_GET} ${API_CACHE_CONTROL_MUTATION}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
