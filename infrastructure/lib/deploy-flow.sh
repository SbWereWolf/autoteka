#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_DEPLOY_FLOW_SH:-}" ]; then
  AUTOTEKA_LIB_DEPLOY_FLOW_SH=1

  source "$INFRA_ROOT/lib/runtime-compose.sh"
  source "$INFRA_ROOT/lib/laravel-runtime.sh"

  autoteka_deploy_flow_set_stage() {
    local stage="$1"
    DEPLOY_STAGE="$stage"
    export DEPLOY_STAGE
  }

  autoteka_run_deploy_flow() {
    local mode=""

    while [ $# -gt 0 ]; do
      case "$1" in
        --mode=*)
          mode="${1#--mode=}"
          shift
          ;;
        --mode)
          shift
          if [ $# -eq 0 ]; then
            echo "autoteka_run_deploy_flow: missing value for --mode" >&2
            return 2
          fi
          mode="$1"
          shift
          ;;
        *)
          echo "autoteka_run_deploy_flow: unknown argument: $1" >&2
          return 2
          ;;
      esac
    done

    if [ -z "$mode" ]; then
      echo "autoteka_run_deploy_flow: --mode is required" >&2
      return 2
    fi

    case "$mode" in
      install|deploy)
        ;;
      *)
        echo "autoteka_run_deploy_flow: unsupported mode '$mode'" >&2
        return 2
        ;;
    esac

    autoteka_deploy_flow_set_stage "compose_up_php"
    autoteka_runtime_compose up -d --build --remove-orphans php

    autoteka_deploy_flow_set_stage "wait_for_php"
    wait_for_php_exec_ready

    autoteka_deploy_flow_set_stage "laravel_prepare"
    prepare_laravel_runtime

    if [ "$mode" = "deploy" ]; then
      autoteka_deploy_flow_set_stage "artisan_check"
      api_artisan_in_php '--version >/dev/null'
      admin_artisan_in_php '--version >/dev/null'

      autoteka_deploy_flow_set_stage "artisan_keygen"
      ensure_app_key
    fi

    autoteka_deploy_flow_set_stage "artisan_migrate"
    admin_artisan_in_php 'migrate --force'

    autoteka_deploy_flow_set_stage "artisan_seed"
    seed_admin_user_if_missing_in_php "${MOONSHINE_ADMIN_EMAIL}"

    if [ "$mode" = "deploy" ]; then
      autoteka_deploy_flow_set_stage "sqlite_write_check"
      check_sqlite_write_access
    fi

    autoteka_deploy_flow_set_stage "compose_up_web"
    ensure_package_lock_for_deploy
    autoteka_runtime_compose up -d --build --remove-orphans web

    if [ "$mode" = "deploy" ]; then
      autoteka_deploy_flow_set_stage "admin_smoke_check"
      http_smoke_check "$ADMIN_SMOKE_URL"
    fi
  }
fi
