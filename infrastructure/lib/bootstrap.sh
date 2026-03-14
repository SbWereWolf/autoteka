#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_BOOTSTRAP_SH:-}" ]; then
  AUTOTEKA_LIB_BOOTSTRAP_SH=1

  ENV_FILE_DEFAULT="/etc/autoteka/options.env"

  validate_required_paths() {
    local missing=""
    if [ -z "${AUTOTEKA_ROOT:-}" ]; then
      missing="AUTOTEKA_ROOT"
    elif [[ "${AUTOTEKA_ROOT}" != /* ]]; then
      missing="AUTOTEKA_ROOT (относительный путь не допускается)"
    fi
    if [ -z "${INFRA_ROOT:-}" ]; then
      [ -n "$missing" ] && missing="$missing, "
      missing="${missing}INFRA_ROOT"
    elif [[ "${INFRA_ROOT}" != /* ]]; then
      [ -n "$missing" ] && missing="$missing, "
      missing="${missing}INFRA_ROOT (относительный путь не допускается)"
    fi
    if [ -n "$missing" ]; then
      echo "$missing не задан или задан относительным путём." >&2
      echo "Задайте абсолютные пути одним из способов:" >&2
      echo "" >&2
      echo "Через переменные окружения:" >&2
      echo "  export AUTOTEKA_ROOT=/opt/vue-app" >&2
      echo "  export INFRA_ROOT=/opt/vue-app/infrastructure" >&2
      echo "  autoteka deploy" >&2
      echo "" >&2
      echo "Через аргументы (если поддерживаются):" >&2
      echo "  autoteka deploy --autoteka-root=/opt/vue-app --infra-root=/opt/vue-app/infrastructure" >&2
      exit 2
    fi
    if [ ! -d "$AUTOTEKA_ROOT" ]; then
      echo "AUTOTEKA_ROOT=$AUTOTEKA_ROOT не существует или не является каталогом." >&2
      exit 1
    fi
    if [ ! -d "$INFRA_ROOT" ]; then
      echo "INFRA_ROOT=$INFRA_ROOT не существует или не является каталогом." >&2
      exit 1
    fi
  }

  load_autoteka_env() {
    local env_file="${1:-$ENV_FILE_DEFAULT}"

    if [ -f "$env_file" ]; then
      # shellcheck disable=SC1090
      set -a
      source "$env_file" || true
      set +a
    fi

    validate_required_paths
  }
fi
