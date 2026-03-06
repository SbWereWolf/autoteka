#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/_common.sh"
load_autoteka_env

PHP_READY_TIMEOUT="${PHP_READY_TIMEOUT:-60}"
ADMIN_SMOKE_URL="${ADMIN_SMOKE_URL:-http://127.0.0.1/admin/login}"

compose up -d --build --remove-orphans php
wait_for_php_exec_ready "$PHP_READY_TIMEOUT"
prepare_laravel_runtime
ensure_public_storage_link
clear_laravel_optimizations
check_sqlite_write_access
compose up -d --build --remove-orphans web
http_smoke_check "$ADMIN_SMOKE_URL"

echo "Laravel runtime repaired and smoke-check passed: $ADMIN_SMOKE_URL"
