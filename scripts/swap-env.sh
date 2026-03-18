#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -f "$script_dir/.env" ]]; then
  printf "[swap-env] Отсутствует scripts/.env или переменные AUTOTEKA_ROOT, INFRA_ROOT. Скопируйте scripts/example.env в scripts/.env и задайте пути.\n" >&2
  exit 3
fi
set -a
source "$script_dir/.env"
set +a
if [[ -z "${AUTOTEKA_ROOT:-}" ]]; then
  printf "[swap-env] Отсутствует scripts/.env или переменные AUTOTEKA_ROOT, INFRA_ROOT. Скопируйте scripts/example.env в scripts/.env и задайте пути.\n" >&2
  exit 3
fi
if [[ -z "${INFRA_ROOT:-}" ]]; then
  printf "[swap-env] Отсутствует scripts/.env или переменные AUTOTEKA_ROOT, INFRA_ROOT. Скопируйте scripts/example.env в scripts/.env и задайте пути.\n" >&2
  exit 3
fi
repo_root="$AUTOTEKA_ROOT"
infra_root="$INFRA_ROOT"

all_types=(
  "root-lock"
  "frontend-lock"
  "system-tests-env"
  "system-tests-lock"
  "infrastructure-tests-lock"
  "infrastructure-tests-env"
  "root-node-modules"
  "frontend-node-modules"
  "system-tests-node-modules"
  "infrastructure-tests-node-modules"
  "scripts-env"
  "lint-env"
  "shop-api-env"
  "shop-operator-env"
)

subcommand="validate"
dry_run=0
declare -a requested_types=()
declare -a summary_hint_actions=()
has_missing=0
has_mismatch=0
aggregate_hints=0

get_current_platform() {
  if [[ -n "${PWD:-}" && "$PWD" == /* ]]; then
    printf "nix"
    return
  fi
  if [[ -n "${OS:-}" && "$OS" == *[Ww][Ii][Nn][Dd][Oo][Ww][Ss]* ]]; then
    printf "win"
    return
  fi
  printf "[swap-env] Не удалось определить платформу: задайте переменную окружения OS (со значением, содержащим Windows) или PWD (начинается с /)\n" >&2
  exit 2
}

current_platform="$(get_current_platform)"

get_script_command_prefix() {
  printf "bash ./scripts/swap-env.sh"
}

status_max_len=17
label_max_len=11

color_reset=""
color_green=""
color_yellow=""
color_lilac=""

init_status_colors() {
  if [[ -n "${NO_COLOR:-}" ]]; then
    return
  fi
  if [[ "${FORCE_COLOR:-0}" == "0" && ! -t 1 && ! -t 2 ]]; then
    return
  fi
  color_reset=$'\e[0m'
  color_green=$'\e[38;2;76;175;80m'
  color_yellow=$'\e[38;2;255;193;7m'
  color_lilac=$'\e[38;2;192;132;252m'
}

get_status_color() {
  case "$1" in
    same) printf "%s" "$color_green" ;;
    missing-active|missing-current-env|different) printf "%s" "$color_yellow" ;;
    unreadable-active|unreadable-current-env) printf "%s" "$color_lilac" ;;
    *) printf "" ;;
  esac
}

format_status_line() {
  local status_active="$1"
  local status_current_env="$2"
  local type_name="$3"
  local pad_active pad_env
  pad_active=$(printf '%*s' $((status_max_len - ${#status_active})) "")
  pad_env=$(printf '%*s' $((status_max_len - ${#status_current_env})) "")
  local fg_active fg_env
  fg_active="$(get_status_color "$status_active")"
  fg_env="$(get_status_color "$status_current_env")"
  printf "  "
  if [[ -n "$fg_active" ]]; then
    printf "%b%s%b" "$fg_active" "$status_active" "$color_reset"
  else
    printf "%s" "$status_active"
  fi
  printf "%s " "$pad_active"
  if [[ -n "$fg_env" ]]; then
    printf "%b%s%b" "$fg_env" "$status_current_env" "$color_reset"
  else
    printf "%s" "$status_current_env"
  fi
  printf "%s %s\n" "$pad_env" "$type_name"
}

get_relative_path() {
  local path="$1"
  local base="${repo_root%/}"
  local infra="${infra_root%/}"
  if [[ "$path" == "$infra"/* ]]; then
    printf "infrastructure/%s" "${path#$infra/}"
  elif [[ "$path" == "$infra" ]]; then
    printf "infrastructure"
  elif [[ "$path" == "$base"/* ]]; then
    printf "%s" "${path#$base/}"
  else
    printf "%s" "$path"
  fi
}

get_type_kind() {
  case "$1" in
    root-lock|frontend-lock|system-tests-lock|infrastructure-tests-lock|scripts-env|lint-env|shop-api-env|shop-operator-env|system-tests-env|infrastructure-tests-env)
      printf "file"
      ;;
    root-node-modules|frontend-node-modules|system-tests-node-modules|infrastructure-tests-node-modules)
      printf "directory"
      ;;
    *)
      return 1
      ;;
  esac
}

get_type_active_path() {
  case "$1" in
    root-lock) printf "%s/package-lock.json" "$repo_root" ;;
    frontend-lock) printf "%s/frontend/package-lock.json" "$repo_root" ;;
    system-tests-env) printf "%s/system-tests/.env" "$repo_root" ;;
    system-tests-lock) printf "%s/system-tests/package-lock.json" "$repo_root" ;;
    infrastructure-tests-lock) printf "%s/tests/package-lock.json" "$infra_root" ;;
    infrastructure-tests-env) printf "%s/tests/.env" "$infra_root" ;;
    root-node-modules) printf "%s/node_modules" "$repo_root" ;;
    frontend-node-modules) printf "%s/frontend/node_modules" "$repo_root" ;;
    system-tests-node-modules) printf "%s/system-tests/node_modules" "$repo_root" ;;
    infrastructure-tests-node-modules) printf "%s/tests/node_modules" "$infra_root" ;;
    scripts-env) printf "%s/scripts/.env" "$repo_root" ;;
    lint-env) printf "%s/lint/.env" "$repo_root" ;;
    shop-api-env) printf "%s/backend/apps/ShopAPI/.env" "$repo_root" ;;
    shop-operator-env) printf "%s/backend/apps/ShopOperator/.env" "$repo_root" ;;
    *) return 1 ;;
  esac
}

get_type_variant_path() {
  local type_name="$1"
  local platform_name="$2"

  case "$type_name" in
    root-lock) printf "%s/package-lock.%s.json" "$repo_root" "$platform_name" ;;
    frontend-lock) printf "%s/frontend/package-lock.%s.json" "$repo_root" "$platform_name" ;;
    system-tests-env) printf "%s/system-tests/%s.env" "$repo_root" "$platform_name" ;;
    system-tests-lock) printf "%s/system-tests/package-lock.%s.json" "$repo_root" "$platform_name" ;;
    infrastructure-tests-lock) printf "%s/tests/package-lock.%s.json" "$infra_root" "$platform_name" ;;
    infrastructure-tests-env) printf "%s/tests/%s.env" "$infra_root" "$platform_name" ;;
    root-node-modules) printf "%s/node_modules.%s" "$repo_root" "$platform_name" ;;
    frontend-node-modules) printf "%s/frontend/node_modules.%s" "$repo_root" "$platform_name" ;;
    system-tests-node-modules) printf "%s/system-tests/node_modules.%s" "$repo_root" "$platform_name" ;;
    infrastructure-tests-node-modules) printf "%s/tests/node_modules.%s" "$infra_root" "$platform_name" ;;
    scripts-env) printf "%s/scripts/%s.env" "$repo_root" "$platform_name" ;;
    lint-env) printf "%s/lint/%s.env" "$repo_root" "$platform_name" ;;
    shop-api-env) printf "%s/backend/apps/ShopAPI/%s.env" "$repo_root" "$platform_name" ;;
    shop-operator-env) printf "%s/backend/apps/ShopOperator/%s.env" "$repo_root" "$platform_name" ;;
    *) return 1 ;;
  esac
}

get_type_group_label() {
  case "$1" in
    scripts-env) printf "scripts" ;;
    lint-env) printf "lint" ;;
    shop-api-env) printf "shop-api" ;;
    shop-operator-env) printf "shop-operator" ;;
    root-*) printf "root" ;;
    system-tests-env|system-tests-lock|system-tests-node-modules) printf "system-tests" ;;
    infrastructure-tests-*) printf "infrastructure-tests" ;;
    frontend-*) printf "frontend" ;;
    *) printf "other" ;;
  esac
}

get_type_group_order() {
  case "$1" in
    scripts-env) printf "1" ;;
    lint-env) printf "2" ;;
    shop-api-env) printf "3" ;;
    shop-operator-env) printf "4" ;;
    root-*) printf "5" ;;
    system-tests-env|system-tests-lock|system-tests-node-modules) printf "6" ;;
    infrastructure-tests-*) printf "7" ;;
    frontend-*) printf "8" ;;
    *) printf "999" ;;
  esac
}

print_help() {
  cat <<EOF
USAGE
  $(basename "$0") [validate] [--dry-run] [-t TYPE ...]
  $(basename "$0") save [--dry-run] [-t TYPE ...]
  $(basename "$0") load [--dry-run] [-t TYPE ...]
  $(basename "$0") status [-t TYPE ...]
  $(basename "$0") --help

Описание
  Скрипт работает только с артефактами текущей среды запуска.
  Если типы не указаны, любая команда работает как '-t *'.

Команды
  validate   Проверяет active против current-env.
  save       Копирует active -> current-env, если замена нужна.
  load       Копирует current-env -> active, если замена нужна.
  status     Показывает текущую среду, статусы и пути по группам.

Флаги
  -t, --type TYPE   Повторяемый тип для обработки. '*' означает все типы.
  --dry-run         Для validate/save/load: ничего не меняет, только показывает результат.
  -h, --help        Показать эту справку.

Подробные пути и статусы доступны через '$(get_script_command_prefix) status'.
EOF
}

get_help_hint() {
  printf "См. %s -h." "$(get_script_command_prefix)"
}

add_summary_hint_action() {
  local action_name="$1"
  local existing
  for existing in "${summary_hint_actions[@]}"; do
    [[ "$existing" == "$action_name" ]] && return
  done
  summary_hint_actions+=("$action_name")
}

format_type_args() {
  if [[ "$#" -eq 0 ]]; then
    return
  fi

  local type_name
  for type_name in "$@"; do
    printf " -t %s" "$type_name"
  done
}

get_command_template() {
  local action_name="$1"
  shift || true
  printf "%s %s%s" "$(get_script_command_prefix)" "$action_name" "$(format_type_args "$@")"
}

get_hint_text() {
  if [[ "$#" -eq 0 ]]; then
    return
  fi

  local -a actions=("$@")
  if [[ "${#actions[@]}" -eq 1 ]]; then
    printf " Команда: %s." "$(get_command_template "${actions[0]}" "$current_type_for_hint")"
    return
  fi

  local -a commands=()
  local action_name
  for action_name in "${actions[@]}"; do
    commands+=("$(get_command_template "$action_name" "$current_type_for_hint")")
  done
  printf " Команды: %s." "$(IFS='; '; echo "${commands[*]}")"
}

register_hint_actions() {
  local action_name
  for action_name in "$@"; do
    add_summary_hint_action "$action_name"
  done
}

write_summary_hints() {
  if [[ "$aggregate_hints" -ne 1 || "${#summary_hint_actions[@]}" -eq 0 ]]; then
    return
  fi

  local action_name
  for action_name in "${summary_hint_actions[@]}"; do
    printf "[swap-env] Для всего набора: %s.\n" "$(get_command_template "$action_name")" >&2
  done
}

is_known_type() {
  local type_name="$1"
  local known_type
  for known_type in "${all_types[@]}"; do
    [[ "$known_type" == "$type_name" ]] && return 0
  done
  return 1
}

unique_types() {
  local -a deduped=()
  local candidate
  local existing
  for candidate in "$@"; do
    local seen=0
    for existing in "${deduped[@]}"; do
      if [[ "$existing" == "$candidate" ]]; then
        seen=1
        break
      fi
    done
    [[ "$seen" -eq 0 ]] && deduped+=("$candidate")
  done

  printf "%s\n" "${deduped[@]}"
}

normalize_requested_types() {
  local -a normalized=()
  local candidate
  local type_name

  for candidate in "$@"; do
    if [[ "$candidate" == "*" ]]; then
      for type_name in "${all_types[@]}"; do
        normalized+=("$type_name")
      done
      continue
    fi

    if ! is_known_type "$candidate"; then
      printf "[swap-env] Неподдерживаемый тип: %s. %s\n" "$candidate" "$(get_help_hint)" >&2
      exit 2
    fi

    normalized+=("$candidate")
  done

  unique_types "${normalized[@]}"
}

file_read_state() {
  local path="$1"
  if [[ ! -e "$path" && ! -L "$path" ]]; then
    printf "missing"
    return
  fi
  if [[ ! -f "$path" || ! -r "$path" ]]; then
    printf "unreadable"
    return
  fi
  printf "ok"
}

directory_read_state() {
  local path="$1"
  if [[ ! -e "$path" && ! -L "$path" ]]; then
    printf "missing"
    return
  fi
  if [[ ! -d "$path" ]]; then
    printf "unreadable"
    return
  fi
  if ! find "$path" -type d -printf '%P\n' >/dev/null 2>&1; then
    printf "unreadable"
    return
  fi
  printf "ok"
}

get_directory_list() {
  local path="$1"
  find "$path" -type d -printf '%P\n' | LC_ALL=C sort
}

get_type_state() {
  local type_name="$1"
  local kind active_path current_env_path active_state env_state status_active status_current_env group_label group_order

  kind="$(get_type_kind "$type_name")"
  active_path="$(get_type_active_path "$type_name")"
  current_env_path="$(get_type_variant_path "$type_name" "$current_platform")"
  group_label="$(get_type_group_label "$type_name")"
  group_order="$(get_type_group_order "$type_name")"

  if [[ "$kind" == "file" ]]; then
    active_state="$(file_read_state "$active_path")"
    env_state="$(file_read_state "$current_env_path")"
  else
    active_state="$(directory_read_state "$active_path")"
    env_state="$(directory_read_state "$current_env_path")"
  fi

  status_active="same"
  status_current_env="same"
  if [[ "$active_state" != "ok" ]]; then
    if [[ "$active_state" == "missing" ]]; then
      status_active="missing-active"
    else
      status_active="unreadable-active"
    fi
  fi
  if [[ "$env_state" != "ok" ]]; then
    if [[ "$env_state" == "missing" ]]; then
      status_current_env="missing-current-env"
    else
      status_current_env="unreadable-current-env"
    fi
  fi
  if [[ "$active_state" == "ok" && "$env_state" == "ok" ]]; then
    local content_differs=0
    if [[ "$kind" == "file" ]]; then
      cmp -s "$active_path" "$current_env_path" || content_differs=1
    else
      local active_dirs env_dirs
      active_dirs="$(get_directory_list "$active_path")"
      env_dirs="$(get_directory_list "$current_env_path")"
      [[ "$active_dirs" != "$env_dirs" ]] && content_differs=1
    fi
    if [[ "$content_differs" -eq 1 ]]; then
      status_active="different"
      status_current_env="different"
    fi
  fi

  printf "%s|%s|%s|%s|%s|%s|%s|%s\n" "$type_name" "$kind" "$status_active" "$status_current_env" "$group_order" "$group_label" "$active_path" "$current_env_path"
}

get_validate_hint_actions() {
  local status_active="$1"
  local status_current_env="$2"
  local need_load=0 need_save=0
  case "$status_active" in
    missing-active|unreadable-active) need_load=1 ;;
    different) need_load=1 need_save=1 ;;
  esac
  case "$status_current_env" in
    missing-current-env|unreadable-current-env) need_save=1 ;;
    different) need_load=1 need_save=1 ;;
  esac
  [[ "$need_load" -eq 1 ]] && printf "load\n"
  [[ "$need_save" -eq 1 ]] && printf "save\n"
}

declare -a error_type_names=()
declare -a error_status_active=()
declare -a error_status_current_env=()
declare -a error_hints=()
declare -a error_custom_messages=()

add_operational_error() {
  local type_name="$1"
  local status_active="${2:-same}"
  local status_current_env="${3:-same}"
  local message="$4"
  local missing_flag="$5"
  local mismatch_flag="$6"
  shift 6
  local -a actions=("$@")
  local hint=""
  current_type_for_hint="$type_name"
  if [[ "$aggregate_hints" -eq 1 ]]; then
    register_hint_actions "${actions[@]}"
  else
    hint="$(get_hint_text "${actions[@]}")"
  fi

  [[ "$missing_flag" == "1" ]] && has_missing=1
  [[ "$mismatch_flag" == "1" ]] && has_mismatch=1
  error_type_names+=("$type_name")
  error_status_active+=("$status_active")
  error_status_current_env+=("$status_current_env")
  error_hints+=("$hint")
  error_custom_messages+=("$message")
}

validate_single_state() {
  local type_name="$1"
  local status_active="$2"
  local status_current_env="$3"
  if [[ "$status_active" == "same" && "$status_current_env" == "same" ]]; then
    return
  fi
  local is_missing=0 is_mismatch=0
  case "$status_active" in
    missing-active|unreadable-active) is_missing=1 ;;
  esac
  case "$status_current_env" in
    missing-current-env|unreadable-current-env) is_missing=1 ;;
  esac
  [[ "$status_active" == "different" || "$status_current_env" == "different" ]] && is_mismatch=1
  mapfile -t actions < <(get_validate_hint_actions "$status_active" "$status_current_env")
  add_operational_error "$type_name" "$status_active" "$status_current_env" "" "$is_missing" "$is_mismatch" "${actions[@]}"
}

remove_destination_path() {
  local destination_path="$1"
  if [[ -e "$destination_path" || -L "$destination_path" ]]; then
    rm -rf "$destination_path" || return 1
  fi
  return 0
}

copy_file_artifact() {
  local source_path="$1"
  local destination_path="$2"
  mkdir -p "$(dirname "$destination_path")"
  cp "$source_path" "$destination_path"
}

copy_directory_artifact() {
  local source_path="$1"
  local destination_path="$2"
  mkdir -p "$destination_path"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$source_path"/ "$destination_path"/
    return
  fi
  cp -a "$source_path"/. "$destination_path"/
}

save_or_load_from_state() {
  local action_name="$1"
  local type_name="$2"
  local kind="$3"
  local status_active="$4"
  local status_current_env="$5"
  local active_path="$6"
  local current_env_path="$7"

  current_type_for_hint="$type_name"
  if [[ "$aggregate_hints" -eq 1 ]]; then
    register_hint_actions "$action_name"
  fi

  if [[ "$action_name" == "save" ]]; then
    if [[ "$status_active" == "missing-active" || "$status_active" == "unreadable-active" ]]; then
      add_operational_error "$type_name" "$status_active" "$status_current_env" "" 1 0 "load"
      return
    fi
    if [[ "$status_active" == "same" && "$status_current_env" == "same" ]]; then
      return
    fi

    format_status_line "$status_active" "$status_current_env" "$type_name"
    if [[ "$dry_run" -eq 1 ]]; then
      printf "  active  -> current-env будет выполнено.\n"
      return
    fi

    printf "[swap-env] %s: копирование...\n" "$type_name"
    if ! remove_destination_path "$current_env_path"; then
      add_operational_error "$type_name" "same" "same" "не удалось заменить артефакт current-env." 0 1 "save"
      return
    fi

    if [[ "$kind" == "file" ]]; then
      if ! copy_file_artifact "$active_path" "$current_env_path"; then
        add_operational_error "$type_name" "same" "same" "не удалось заменить артефакт current-env." 0 1 "save"
        return
      fi
    else
      if ! copy_directory_artifact "$active_path" "$current_env_path"; then
        add_operational_error "$type_name" "same" "same" "не удалось заменить артефакт current-env." 0 1 "save"
        return
      fi
    fi

    printf "  active  -> current-env выполнено.\n"
    return
  fi

  if [[ "$status_current_env" == "missing-current-env" || "$status_current_env" == "unreadable-current-env" ]]; then
    add_operational_error "$type_name" "$status_active" "$status_current_env" "" 1 0 "save"
    return
  fi
  if [[ "$status_active" == "same" && "$status_current_env" == "same" ]]; then
    return
  fi

  format_status_line "$status_active" "$status_current_env" "$type_name"
  if [[ "$dry_run" -eq 1 ]]; then
    printf "  active <-  current-env будет выполнено.\n"
    return
  fi

  printf "[swap-env] %s: копирование...\n" "$type_name"
  if ! remove_destination_path "$active_path"; then
    add_operational_error "$type_name" "same" "same" "не удалось заменить active-артефакт." 0 1 "load"
    return
  fi

  if [[ "$kind" == "file" ]]; then
    if ! copy_file_artifact "$current_env_path" "$active_path"; then
      add_operational_error "$type_name" "same" "same" "не удалось заменить active-артефакт." 0 1 "load"
      return
    fi
  else
    if ! copy_directory_artifact "$current_env_path" "$active_path"; then
      add_operational_error "$type_name" "same" "same" "не удалось заменить active-артефакт." 0 1 "load"
      return
    fi
  fi

  printf "  active <-  current-env выполнено.\n"
}

print_status_report() {
  local states_file="$1"
  init_status_colors

  printf "[swap-env] status:   '%s'\n" "$current_platform"
  printf "[swap-env] validate: active <-> current-env\n"
  printf "[swap-env] save:     active  -> current-env\n"
  printf "[swap-env] load:     active <-  current-env\n"
  printf "[swap-env] AUTOTEKA_ROOT: %s\n" "$repo_root"
  printf "[swap-env] INFRA_ROOT:    %s\n" "$infra_root"

  local group_color
  group_color="$(get_status_color "different")"
  local current_group=""
  while IFS='|' read -r type_name kind status_active status_current_env group_order group_label active_path current_env_path; do
    if [[ "$group_label" != "$current_group" ]]; then
      current_group="$group_label"
      printf "\n"
      if [[ -n "$group_color" ]]; then
        printf "%b[swap-env] group: %s%b\n" "$group_color" "$group_label" "$color_reset"
      else
        printf "[swap-env] group: %s\n" "$group_label"
      fi
    fi

    local pad_active pad_env
    pad_active=$(printf '%*s' $((status_max_len - ${#status_active})) "")
    pad_env=$(printf '%*s' $((status_max_len - ${#status_current_env})) "")

    local active_rel env_rel active_label env_label
    active_rel="$(get_relative_path "$active_path")"
    env_rel="$(get_relative_path "$current_env_path")"
    active_label=$(printf "%-${label_max_len}s" "active")
    env_label=$(printf "%-${label_max_len}s" "current-env")

    local fg_active fg_env
    fg_active="$(get_status_color "$status_active")"
    fg_env="$(get_status_color "$status_current_env")"
    printf "\n"
    printf "  "
    if [[ -n "$fg_active" ]]; then
      printf "%b%s%b" "$fg_active" "$status_active" "$color_reset"
    else
      printf "%s" "$status_active"
    fi
    printf "%s " "$pad_active"
    if [[ -n "$fg_env" ]]; then
      printf "%b%s%b" "$fg_env" "$status_current_env" "$color_reset"
    else
      printf "%s" "$status_current_env"
    fi
    printf "%s %s\n" "$pad_env" "$type_name"
    printf "    %s: %s\n" "${active_label}" "$active_rel"
    printf "    %s: %s\n" "${env_label}" "$env_rel"
  done <"$states_file"
}

if [[ "${1:-}" == "validate" || "${1:-}" == "save" || "${1:-}" == "load" || "${1:-}" == "status" ]]; then
  subcommand="$1"
  shift
fi

while (($# > 0)); do
  case "$1" in
    --help|-h)
      print_help
      exit 0
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    --type|-t)
      if (($# < 2)); then
        printf "[swap-env] После %s ожидается значение. %s\n" "$1" "$(get_help_hint)" >&2
        exit 2
      fi
      requested_types+=("$2")
      shift 2
      ;;
    --type=*|-t=*)
      requested_types+=("${1#*=}")
      shift
      ;;
    *)
      printf "[swap-env] Неподдерживаемый аргумент: %s. %s\n" "$1" "$(get_help_hint)" >&2
      exit 2
      ;;
  esac
done

if [[ "${#requested_types[@]}" -eq 0 ]]; then
  requested_types=("*")
fi

mapfile -t requested_types < <(normalize_requested_types "${requested_types[@]}")
if [[ "${#requested_types[@]}" -eq "${#all_types[@]}" ]]; then
  aggregate_hints=1
fi

states_file="$(mktemp)"
trap 'rm -f "$states_file"' EXIT

for type_name in "${requested_types[@]}"; do
  get_type_state "$type_name" >>"$states_file"
done

sort -t'|' -k5,5n -k1,1 "$states_file" -o "$states_file"

if [[ "$subcommand" == "status" ]]; then
  print_status_report "$states_file"
  exit 0
fi

if [[ "$subcommand" == "validate" ]]; then
  while IFS='|' read -r type_name kind status_active status_current_env group_order group_label active_path current_env_path; do
    validate_single_state "$type_name" "$status_active" "$status_current_env"
  done <"$states_file"
elif [[ "$subcommand" == "save" || "$subcommand" == "load" ]]; then
  performed_any=0
  performed_groups=""
  while IFS='|' read -r type_name kind status_active status_current_env group_order group_label active_path current_env_path; do
    if [[ "$status_active" != "same" || "$status_current_env" != "same" ]]; then
      performed_any=1
      if [[ " $performed_groups " != *" $group_label "* ]]; then
        performed_groups="${performed_groups} ${group_label}"
      fi
    fi
  done <"$states_file"

  if [[ "$performed_any" -eq 0 ]]; then
    if [[ "$subcommand" == "save" ]]; then
      printf "[swap-env] Совпадение полное, запись active  -> current-env не требуется.\n"
    else
      printf "[swap-env] Совпадение полное, запись active <-  current-env не требуется.\n"
    fi
  else
    init_status_colors
    group_color="$(get_status_color "different")"
    current_group=""
    while IFS='|' read -r type_name kind status_active status_current_env group_order group_label active_path current_env_path; do
      if [[ " $performed_groups " == *" $group_label "* ]]; then
        if [[ "$group_label" != "$current_group" ]]; then
          current_group="$group_label"
          printf "\n"
          if [[ -n "$group_color" ]]; then
            printf "%b[swap-env] group: %s%b\n" "$group_color" "$group_label" "$color_reset"
          else
            printf "[swap-env] group: %s\n" "$group_label"
          fi
        fi
        save_or_load_from_state "$subcommand" "$type_name" "$kind" "$status_active" "$status_current_env" "$active_path" "$current_env_path"
      fi
    done <"$states_file"
  fi
fi

if [[ "$subcommand" == "validate" ]]; then
  printf "[swap-env] среда: '%s'\n" "$current_platform"
fi

if [[ "${#error_type_names[@]}" -gt 0 ]]; then
  init_status_colors
  printf "[swap-env] Ниже список различий. Для полной информации: %s status\n" "$(get_script_command_prefix)" >&2
  max_type_len=0
  for tn in "${error_type_names[@]}"; do
    [[ ${#tn} -gt max_type_len ]] && max_type_len=${#tn}
  done
  for i in "${!error_type_names[@]}"; do
    tn="${error_type_names[$i]}"
    st_active="${error_status_active[$i]}"
    st_env="${error_status_current_env[$i]}"
    hi="${error_hints[$i]}"
    msg="${error_custom_messages[$i]}"
    padded=$(printf "%-${max_type_len}s" "$tn")
    if [[ -n "$msg" ]]; then
      printf "[swap-env] %s: %s%s\n" "$padded" "$msg" "$hi" >&2
    else
      pad_active=$(printf '%*s' $((status_max_len - ${#st_active})) "")
      pad_env=$(printf '%*s' $((status_max_len - ${#st_env})) "")
      fg_active=$(get_status_color "$st_active")
      fg_env=$(get_status_color "$st_env")
      printf "[swap-env] %s: " "$padded" >&2
      if [[ -n "$fg_active" ]]; then
        printf "%b%s%b" "$fg_active" "$st_active" "$color_reset" >&2
      else
        printf "%s" "$st_active" >&2
      fi
      printf "%s " "$pad_active" >&2
      if [[ -n "$fg_env" ]]; then
        printf "%b%s%b" "$fg_env" "$st_env" "$color_reset" >&2
      else
        printf "%s" "$st_env" >&2
      fi
      printf "%s%s\n" "$pad_env" "$hi" >&2
    fi
  done
fi

write_summary_hints

if [[ "$has_missing" -eq 1 ]]; then
  exit 3
fi
if [[ "$has_mismatch" -eq 1 ]]; then
  exit 1
fi

case "$subcommand" in
  validate)
    if [[ "$dry_run" -eq 1 ]]; then
      printf "[swap-env] dry-run: различий нет.\n"
    else
      printf "[swap-env] validate: различий нет.\n"
    fi
    ;;
  save)
    if [[ "$dry_run" -eq 1 ]]; then
      printf "[swap-env] dry-run: обработка save завершена для среды '%s'.\n" "$current_platform"
    fi
    ;;
  load)
    if [[ "$dry_run" -eq 1 ]]; then
      printf "[swap-env] dry-run: обработка load завершена для среды '%s'.\n" "$current_platform"
    fi
    ;;
esac
