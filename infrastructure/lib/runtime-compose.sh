#!/usr/bin/env bash
set -euo pipefail

# Однократная загрузка: повторный source не переопределяет функции.
if [ -z "${AUTOTEKA_LIB_RUNTIME_COMPOSE_SH:-}" ]; then
  AUTOTEKA_LIB_RUNTIME_COMPOSE_SH=1

  # Требуется INFRA_ROOT (абсолютный путь), задаётся вызывающим скриптом.
  autoteka_runtime_compose() {
    if [ -z "${INFRA_ROOT:-}" ]; then
      echo "autoteka_runtime_compose: INFRA_ROOT не задан." >&2
      exit 3
    fi

    local base="$INFRA_ROOT/runtime/docker-compose.yml"
    local prod_overlay="$INFRA_ROOT/runtime/docker-compose.prod.yml"

    if [ "${DEPLOY_ENV:-}" = "prod" ]; then
      /usr/bin/docker compose -f "$base" -f "$prod_overlay" "$@"
    else
      /usr/bin/docker compose -f "$base" "$@"
    fi
  }

  # Одна строка для dry-run логов (тот же набор -f, что у autoteka_runtime_compose).
  autoteka_runtime_compose_describe() {
    if [ -z "${INFRA_ROOT:-}" ]; then
      printf '%s' '/usr/bin/docker compose (INFRA_ROOT не задан)'
      return
    fi

    local base="$INFRA_ROOT/runtime/docker-compose.yml"
    local prod_overlay="$INFRA_ROOT/runtime/docker-compose.prod.yml"

    if [ "${DEPLOY_ENV:-}" = "prod" ]; then
      printf '/usr/bin/docker compose -f %s -f %s' "$base" "$prod_overlay"
    else
      printf '/usr/bin/docker compose -f %s' "$base"
    fi
  }
fi
