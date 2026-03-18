#!/usr/bin/env bash
set -euo pipefail

if [ -n "${AUTOTEKA_INIT_ROOTS_SH:-}" ]; then
  return 0 2>/dev/null || exit 0
fi
AUTOTEKA_INIT_ROOTS_SH=1

_init_roots_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$_init_roots_dir/lib/operational_system.sh"

AUTOTEKA_OPTIONS_ENV_DEFAULT="${AUTOTEKA_OPTIONS_ENV_DEFAULT:-/etc/autoteka/options.env}"
AUTOTEKA_ARGS=()

_autoteka_print_roots_usage() {
  echo "Пример через переменные окружения:" >&2
  echo "  export INFRA_ROOT=/opt/vue-app/infrastructure" >&2
  echo "  export AUTOTEKA_ROOT=/opt/vue-app" >&2
  echo "  sudo $0" >&2
  echo "" >&2
  echo "Пример (Windows): export INFRA_ROOT=C:/path/to/infrastructure" >&2
  echo "" >&2
  echo "Пример через аргументы:" >&2
  echo "  sudo $0 --infra-root=/opt/vue-app/infrastructure --autoteka-root=/opt/vue-app" >&2
}

autoteka_load_options_env() {
  local env_file="${1:-$AUTOTEKA_OPTIONS_ENV_DEFAULT}"

  if [ ! -e "$env_file" ]; then
    return 0
  fi

  if [ ! -r "$env_file" ]; then
    echo "WARN: не удалось прочитать переменные из $env_file: файл недоступен для чтения." >&2
    return 0
  fi

  set +e
  set -a
    source "$env_file"
  local source_status=$?
  set +a
  set -e

  if [ "$source_status" -ne 0 ]; then
    echo "WARN: при загрузке переменных из $env_file произошла ошибка (код $source_status). Продолжаю с уже доступными значениями окружения." >&2
  fi

  return 0
}

autoteka_parse_root_args() {
  AUTOTEKA_ARGS=()

  while [ $# -gt 0 ]; do
    case "$1" in
      --infra-root=*)
        INFRA_ROOT="${1#--infra-root=}"
        shift
        ;;
      --autoteka-root=*)
        AUTOTEKA_ROOT="${1#--autoteka-root=}"
        shift
        ;;
      *)
        AUTOTEKA_ARGS+=("$1")
        shift
        ;;
    esac
  done

  export INFRA_ROOT="${INFRA_ROOT:-}"
  export AUTOTEKA_ROOT="${AUTOTEKA_ROOT:-}"
}

autoteka_validate_roots() {
  local invalid=0
  local path_infra path_autoteka

  if [ -z "${INFRA_ROOT}" ]; then
    echo "INFRA_ROOT не задан. Задайте абсолютный путь." >&2
    invalid=1
  elif ! autoteka_is_absolute_path "${INFRA_ROOT}"; then
    echo "INFRA_ROOT задан относительным путём. Требуется абсолютный путь." >&2
    invalid=1
  else
    path_infra="$(autoteka_path_for_test "${INFRA_ROOT}")"
    if [ ! -d "$path_infra" ]; then
      echo "INFRA_ROOT=${INFRA_ROOT} не существует или не является каталогом." >&2
      invalid=1
    fi
  fi

  if [ -z "${AUTOTEKA_ROOT}" ]; then
    echo "AUTOTEKA_ROOT не задан. Задайте абсолютный путь." >&2
    invalid=1
  elif ! autoteka_is_absolute_path "${AUTOTEKA_ROOT}"; then
    echo "AUTOTEKA_ROOT задан относительным путём. Требуется абсолютный путь." >&2
    invalid=1
  else
    path_autoteka="$(autoteka_path_for_test "${AUTOTEKA_ROOT}")"
    if [ ! -d "$path_autoteka" ]; then
      echo "AUTOTEKA_ROOT=${AUTOTEKA_ROOT} не существует или не является каталогом." >&2
      invalid=1
    fi
  fi

  if [ "$invalid" -ne 0 ]; then
    _autoteka_print_roots_usage
    return 2
  fi
}

autoteka_init_roots() {
  autoteka_load_options_env
  autoteka_parse_root_args "$@"
  autoteka_validate_roots
}
