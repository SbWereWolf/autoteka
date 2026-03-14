#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

all_types=(
  "root-lock"
  "frontend-lock"
  "system-tests-lock"
  "infrastructure-tests-lock"
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
declare -a error_messages=()
declare -a summary_hint_actions=()
has_missing=0
has_mismatch=0
aggregate_hints=0

get_current_platform() {
  if [[ -n "${WSL_DISTRO_NAME:-}" || -n "${WSL_INTEROP:-}" ]]; then
    printf "wsl"
    return
  fi

  printf "win"
}

current_platform="$(get_current_platform)"

get_script_command_prefix() {
  printf "bash ./scripts/swap-env.sh"
}

get_type_kind() {
  case "$1" in
    root-lock|frontend-lock|system-tests-lock|infrastructure-tests-lock|scripts-env|lint-env|shop-api-env|shop-operator-env)
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
    system-tests-lock) printf "%s/system-tests/package-lock.json" "$repo_root" ;;
    infrastructure-tests-lock) printf "%s/infrastructure/tests/package-lock.json" "$repo_root" ;;
    root-node-modules) printf "%s/node_modules" "$repo_root" ;;
    frontend-node-modules) printf "%s/frontend/node_modules" "$repo_root" ;;
    system-tests-node-modules) printf "%s/system-tests/node_modules" "$repo_root" ;;
    infrastructure-tests-node-modules) printf "%s/infrastructure/tests/node_modules" "$repo_root" ;;
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
    system-tests-lock) printf "%s/system-tests/package-lock.%s.json" "$repo_root" "$platform_name" ;;
    infrastructure-tests-lock) printf "%s/infrastructure/tests/package-lock.%s.json" "$repo_root" "$platform_name" ;;
    root-node-modules) printf "%s/node_modules.%s" "$repo_root" "$platform_name" ;;
    frontend-node-modules) printf "%s/frontend/node_modules.%s" "$repo_root" "$platform_name" ;;
    system-tests-node-modules) printf "%s/system-tests/node_modules.%s" "$repo_root" "$platform_name" ;;
    infrastructure-tests-node-modules) printf "%s/infrastructure/tests/node_modules.%s" "$repo_root" "$platform_name" ;;
    scripts-env) printf "%s/scripts/%s.env" "$repo_root" "$platform_name" ;;
    lint-env) printf "%s/lint/%s.env" "$repo_root" "$platform_name" ;;
    shop-api-env) printf "%s/backend/apps/ShopAPI/%s.env" "$repo_root" "$platform_name" ;;
    shop-operator-env) printf "%s/backend/apps/ShopOperator/%s.env" "$repo_root" "$platform_name" ;;
    *) return 1 ;;
  esac
}

get_type_group_label() {
  case "$1" in
    root-*) printf "repo root" ;;
    frontend-*) printf "frontend" ;;
    system-tests-*) printf "system-tests" ;;
    infrastructure-tests-*) printf "infrastructure/tests" ;;
    scripts-env) printf "scripts" ;;
    lint-env) printf "lint" ;;
    shop-api-env) printf "backend/apps/ShopAPI" ;;
    shop-operator-env) printf "backend/apps/ShopOperator" ;;
    *) printf "other" ;;
  esac
}

get_type_group_order() {
  case "$1" in
    root-*) printf "1" ;;
    frontend-*) printf "2" ;;
    system-tests-*) printf "3" ;;
    infrastructure-tests-*) printf "4" ;;
    scripts-env) printf "5" ;;
    lint-env) printf "6" ;;
    shop-api-env) printf "7" ;;
    shop-operator-env) printf "8" ;;
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

add_error_message() {
  error_messages+=("$1")
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
  local kind active_path current_env_path active_state env_state status group_label group_order

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

  if [[ "$active_state" != "ok" ]]; then
    if [[ "$active_state" == "missing" ]]; then
      status="missing-active"
    else
      status="unreadable-active"
    fi
  elif [[ "$env_state" != "ok" ]]; then
    if [[ "$env_state" == "missing" ]]; then
      status="missing-env"
    else
      status="unreadable-env"
    fi
  elif [[ "$kind" == "file" ]]; then
    if cmp -s "$active_path" "$current_env_path"; then
      status="same"
    else
      status="different"
    fi
  else
    local active_dirs env_dirs
    active_dirs="$(get_directory_list "$active_path")"
    env_dirs="$(get_directory_list "$current_env_path")"
    if [[ "$active_dirs" == "$env_dirs" ]]; then
      status="same"
    else
      status="different"
    fi
  fi

  printf "%s|%s|%s|%s|%s|%s|%s\n" "$type_name" "$kind" "$status" "$group_order" "$group_label" "$active_path" "$current_env_path"
}

get_validate_hint_actions() {
  case "$1" in
    missing-active|unreadable-active) printf "load\n" ;;
    missing-env|unreadable-env) printf "save\n" ;;
    different) printf "load\nsave\n" ;;
  esac
}

add_operational_error() {
  local type_name="$1"
  local message="$2"
  local missing_flag="$3"
  local mismatch_flag="$4"
  shift 4
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
  add_error_message "[swap-env] ${type_name}: ${message}${hint}"
}

validate_single_state() {
  local type_name="$1"
  local status="$2"
  case "$status" in
    same) return ;;
    missing-active)
      mapfile -t actions < <(get_validate_hint_actions "$status")
      add_operational_error "$type_name" "active-артефакт отсутствует." 1 0 "${actions[@]}"
      ;;
    unreadable-active)
      mapfile -t actions < <(get_validate_hint_actions "$status")
      add_operational_error "$type_name" "active-артефакт не читается." 1 0 "${actions[@]}"
      ;;
    missing-env)
      mapfile -t actions < <(get_validate_hint_actions "$status")
      add_operational_error "$type_name" "артефакт текущей среды отсутствует." 1 0 "${actions[@]}"
      ;;
    unreadable-env)
      mapfile -t actions < <(get_validate_hint_actions "$status")
      add_operational_error "$type_name" "артефакт текущей среды не читается." 1 0 "${actions[@]}"
      ;;
    different)
      mapfile -t actions < <(get_validate_hint_actions "$status")
      add_operational_error "$type_name" "active и current-env различаются." 0 1 "${actions[@]}"
      ;;
  esac
}

remove_destination_path() {
  local destination_path="$1"
  if [[ -e "$destination_path" || -L "$destination_path" ]]; then
    if rm -rf "$destination_path"; then
      return 0
    fi

    if [[ "$current_platform" == "wsl" && "$destination_path" =~ ^/mnt/[a-zA-Z]/ ]] && command -v wslpath >/dev/null 2>&1 && command -v cmd.exe >/dev/null 2>&1; then
      local windows_path
      windows_path="$(wslpath -w "$destination_path")"
      if [[ -d "$destination_path" ]]; then
        cmd.exe /d /c rd /s /q "$windows_path" >/dev/null 2>&1 && return 0
      else
        cmd.exe /d /c del /f /q "$windows_path" >/dev/null 2>&1 && return 0
      fi
    fi

    return 1
  fi
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
  local status="$4"
  local active_path="$5"
  local current_env_path="$6"

  current_type_for_hint="$type_name"
  local no_op_hint
  if [[ "$aggregate_hints" -eq 1 ]]; then
    register_hint_actions "$action_name"
    no_op_hint=""
  else
    no_op_hint="$(get_hint_text "$action_name")"
  fi

  if [[ "$action_name" == "save" ]]; then
    case "$status" in
      missing-active)
        add_operational_error "$type_name" "active-артефакт отсутствует." 1 0 "load"
        return
        ;;
      unreadable-active)
        add_operational_error "$type_name" "active-артефакт не читается." 1 0 "load"
        return
        ;;
      same)
        printf "[swap-env] %s: active и current-env уже совпадают, замена не нужна.%s\n" "$type_name" "$no_op_hint"
        return
        ;;
    esac

    if [[ "$dry_run" -eq 1 ]]; then
      printf "[swap-env] dry-run: %s: будет выполнено active -> current-env.\n" "$type_name"
      return
    fi

    if ! remove_destination_path "$current_env_path"; then
      add_operational_error "$type_name" "не удалось заменить артефакт current-env." 0 1 "save"
      return
    fi

    if [[ "$kind" == "file" ]]; then
      if ! copy_file_artifact "$active_path" "$current_env_path"; then
        add_operational_error "$type_name" "не удалось заменить артефакт current-env." 0 1 "save"
        return
      fi
    else
      if ! copy_directory_artifact "$active_path" "$current_env_path"; then
        add_operational_error "$type_name" "не удалось заменить артефакт current-env." 0 1 "save"
        return
      fi
    fi

    printf "[swap-env] %s: active -> current-env выполнено.\n" "$type_name"
    return
  fi

  case "$status" in
    missing-env)
      add_operational_error "$type_name" "артефакт текущей среды отсутствует." 1 0 "save"
      return
      ;;
    unreadable-env)
      add_operational_error "$type_name" "артефакт текущей среды не читается." 1 0 "save"
      return
      ;;
    same)
      printf "[swap-env] %s: active и current-env уже совпадают, замена не нужна.%s\n" "$type_name" "$no_op_hint"
      return
      ;;
  esac

  if [[ "$dry_run" -eq 1 ]]; then
    printf "[swap-env] dry-run: %s: будет выполнено active <- current-env.\n" "$type_name"
    return
  fi

  if ! remove_destination_path "$active_path"; then
    add_operational_error "$type_name" "не удалось заменить active-артефакт." 0 1 "load"
    return
  fi

  if [[ "$kind" == "file" ]]; then
    if ! copy_file_artifact "$current_env_path" "$active_path"; then
      add_operational_error "$type_name" "не удалось заменить active-артефакт." 0 1 "load"
      return
    fi
  else
    if ! copy_directory_artifact "$current_env_path" "$active_path"; then
      add_operational_error "$type_name" "не удалось заменить active-артефакт." 0 1 "load"
      return
    fi
  fi

  printf "[swap-env] %s: active <- current-env выполнено.\n" "$type_name"
}

print_status_report() {
  local states_file="$1"
  printf "[swap-env] status: среда '%s'\n" "$current_platform"
  printf "[swap-env] validate: active <-> current-env\n"
  printf "[swap-env] save: active -> current-env\n"
  printf "[swap-env] load: active <- current-env\n"

  local current_group=""
  while IFS='|' read -r type_name kind status group_order group_label active_path current_env_path; do
    if [[ "$group_label" != "$current_group" ]]; then
      current_group="$group_label"
      printf "[swap-env] group: %s\n" "$group_label"
    fi
    printf "  %s [%s]\n" "$type_name" "$status"
    printf "    active: %s\n" "$active_path"
    printf "    current-env: %s\n" "$current_env_path"
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

sort -t'|' -k4,4n -k1,1 "$states_file" -o "$states_file"

if [[ "$subcommand" == "status" ]]; then
  print_status_report "$states_file"
  exit 0
fi

while IFS='|' read -r type_name kind status group_order group_label active_path current_env_path; do
  case "$subcommand" in
    validate)
      validate_single_state "$type_name" "$status"
      ;;
    save)
      save_or_load_from_state "save" "$type_name" "$kind" "$status" "$active_path" "$current_env_path"
      ;;
    load)
      save_or_load_from_state "load" "$type_name" "$kind" "$status" "$active_path" "$current_env_path"
      ;;
  esac
done <"$states_file"

if [[ "${#error_messages[@]}" -gt 0 ]]; then
  printf "%s\n" "${error_messages[@]}" >&2
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
      printf "[swap-env] dry-run: все запрошенные типы синхронизированы для среды '%s'.\n" "$current_platform"
    else
      printf "[swap-env] validate: все запрошенные типы синхронизированы для среды '%s'.\n" "$current_platform"
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
