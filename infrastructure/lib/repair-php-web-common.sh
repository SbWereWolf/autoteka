#!/usr/bin/env bash
set -euo pipefail

# Общий сценарий: поднять php, подготовить Laravel, поднять web.
# Перед source: init-roots, runtime-compose.sh, laravel-runtime.sh, dry-run.sh
# (для repair-runtime допустимо подключить health-state.sh раньше — он тянет dry-run).

if [ -z "${AUTOTEKA_LIB_REPAIR_PHP_WEB_COMMON_SH:-}" ]; then
  AUTOTEKA_LIB_REPAIR_PHP_WEB_COMMON_SH=1

  # Опционально: --with-package-lock — вызвать ensure_package_lock_for_deploy перед web.
  autoteka_repair_php_and_web_stack() {
    local with_package_lock=0
    while [ $# -gt 0 ]; do
      case "$1" in
        --with-package-lock)
          with_package_lock=1
          shift
          ;;
        *)
          echo "autoteka_repair_php_and_web_stack: неизвестный аргумент: $1" >&2
          return 2
          ;;
      esac
    done

    if is_dry_run; then
      dry_run_log "$(autoteka_runtime_compose_describe) up -d --build --remove-orphans php"
    else
      autoteka_runtime_compose up -d --build --remove-orphans php
    fi

    if ! is_dry_run; then
      wait_for_php_exec_ready
      prepare_laravel_runtime
      ensure_public_storage_link
      clear_laravel_optimizations
      check_sqlite_write_access
      if [ "$with_package_lock" = "1" ]; then
        ensure_package_lock_for_deploy
      fi
      autoteka_runtime_compose up -d --build --remove-orphans web
    else
      dry_run_log "wait_for_php_exec_ready"
      dry_run_log "prepare_laravel_runtime"
      dry_run_log "ensure_public_storage_link"
      dry_run_log "clear_laravel_optimizations"
      dry_run_log "check_sqlite_write_access"
      if [ "$with_package_lock" = "1" ]; then
        dry_run_log "ensure_package_lock_for_deploy"
      fi
      dry_run_log "$(autoteka_runtime_compose_describe) up -d --build --remove-orphans web"
    fi
  }
fi
