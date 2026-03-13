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
show_help=0
declare -a requested_types=()
declare -a missing_messages=()
declare -a mismatch_messages=()

get_current_platform() {
  if [[ -n "${WSL_DISTRO_NAME:-}" || -n "${WSL_INTEROP:-}" ]]; then
    printf "wsl"
    return
  fi

  printf "win"
}

current_platform="$(get_current_platform)"

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
    root-lock)
      printf "%s/package-lock.json" "$repo_root"
      ;;
    frontend-lock)
      printf "%s/frontend/package-lock.json" "$repo_root"
      ;;
    system-tests-lock)
      printf "%s/system-tests/package-lock.json" "$repo_root"
      ;;
    infrastructure-tests-lock)
      printf "%s/infrastructure/tests/package-lock.json" "$repo_root"
      ;;
    root-node-modules)
      printf "%s/node_modules" "$repo_root"
      ;;
    frontend-node-modules)
      printf "%s/frontend/node_modules" "$repo_root"
      ;;
    system-tests-node-modules)
      printf "%s/system-tests/node_modules" "$repo_root"
      ;;
    infrastructure-tests-node-modules)
      printf "%s/infrastructure/tests/node_modules" "$repo_root"
      ;;
    scripts-env)
      printf "%s/scripts/.env" "$repo_root"
      ;;
    lint-env)
      printf "%s/lint/.env" "$repo_root"
      ;;
    shop-api-env)
      printf "%s/backend/apps/ShopAPI/.env" "$repo_root"
      ;;
    shop-operator-env)
      printf "%s/backend/apps/ShopOperator/.env" "$repo_root"
      ;;
    *)
      return 1
      ;;
  esac
}

get_type_variant_path() {
  local type_name="$1"
  local platform_name="$2"

  case "$type_name" in
    root-lock)
      printf "%s/package-lock.%s.json" "$repo_root" "$platform_name"
      ;;
    frontend-lock)
      printf "%s/frontend/package-lock.%s.json" "$repo_root" "$platform_name"
      ;;
    system-tests-lock)
      printf "%s/system-tests/package-lock.%s.json" "$repo_root" "$platform_name"
      ;;
    infrastructure-tests-lock)
      printf "%s/infrastructure/tests/package-lock.%s.json" "$repo_root" "$platform_name"
      ;;
    root-node-modules)
      printf "%s/node_modules.%s" "$repo_root" "$platform_name"
      ;;
    frontend-node-modules)
      printf "%s/frontend/node_modules.%s" "$repo_root" "$platform_name"
      ;;
    system-tests-node-modules)
      printf "%s/system-tests/node_modules.%s" "$repo_root" "$platform_name"
      ;;
    infrastructure-tests-node-modules)
      printf "%s/infrastructure/tests/node_modules.%s" "$repo_root" "$platform_name"
      ;;
    scripts-env)
      printf "%s/scripts/%s.env" "$repo_root" "$platform_name"
      ;;
    lint-env)
      printf "%s/lint/%s.env" "$repo_root" "$platform_name"
      ;;
    shop-api-env)
      printf "%s/backend/apps/ShopAPI/%s.env" "$repo_root" "$platform_name"
      ;;
    shop-operator-env)
      printf "%s/backend/apps/ShopOperator/%s.env" "$repo_root" "$platform_name"
      ;;
    *)
      return 1
      ;;
  esac
}

print_help() {
  cat <<EOF
USAGE
  $(basename "$0") [validate] [--dry-run] [--type TYPE ...]
  $(basename "$0") save --type TYPE [--type TYPE ...]
  $(basename "$0") load --type TYPE [--type TYPE ...]
  $(basename "$0") --help

Описание
  Скрипт определяет текущее окружение запуска и работает только с
  артефактами этой среды. Автоматического переключения между win и wsl нет.

Команды
  validate   Проверяет, что active-артефакты совпадают с артефактами
             текущей среды. Это команда по умолчанию.
  save       Перезаписывает env-specific артефакты текущей среды из
             active-артефактов.
  load       Перезаписывает active-артефакты из env-specific
             артефактов текущей среды.

Флаги
  --type TYPE   Повторяемый тип для обработки.
  --dry-run     Разрешён только для validate и показывает, где была бы ошибка.
  --help        Показать эту справку.

Текущее окружение
  $current_platform

Типы и пути
$(for type_name in "${all_types[@]}"; do
  active_path="$(get_type_active_path "$type_name")"
  win_path="$(get_type_variant_path "$type_name" "win")"
  wsl_path="$(get_type_variant_path "$type_name" "wsl")"
  printf "  %s\n    active: %s\n    win:    %s\n    wsl:    %s\n" "$type_name" "$active_path" "$win_path" "$wsl_path"
done)
EOF
}

append_missing_message() {
  missing_messages+=("$1")
}

append_mismatch_message() {
  mismatch_messages+=("$1")
}

is_known_type() {
  local type_name="$1"
  local known_type
  for known_type in "${all_types[@]}"; do
    if [[ "$known_type" == "$type_name" ]]; then
      return 0
    fi
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
    if [[ "$seen" -eq 0 ]]; then
      deduped+=("$candidate")
    fi
  done

  printf "%s\n" "${deduped[@]}"
}

print_messages() {
  local prefix="$1"
  local message

  for message in "${missing_messages[@]}"; do
    printf "[swap-env] %s%s\n" "$prefix" "$message" >&2
  done

  for message in "${mismatch_messages[@]}"; do
    printf "[swap-env] %s%s\n" "$prefix" "$message" >&2
  done
}

ensure_file_source_readable() {
  local type_name="$1"
  local path_role="$2"
  local source_path="$3"
  local peer_path="$4"

  if [[ ! -e "$source_path" && ! -L "$source_path" ]]; then
    append_missing_message "Для типа '$type_name' отсутствует $path_role: ожидался файл '$source_path'. Связанный путь: '$peer_path'. Создайте файл или синхронизируйте его вручную и повторите запуск."
    return 1
  fi

  if [[ ! -f "$source_path" ]]; then
    append_missing_message "Для типа '$type_name' $path_role не читается: ожидался файл '$source_path'. Связанный путь: '$peer_path'. Исправьте путь или пересоздайте файл и повторите запуск."
    return 1
  fi

  if [[ ! -r "$source_path" ]]; then
    append_missing_message "Для типа '$type_name' $path_role не читается: не удалось прочитать '$source_path'. Связанный путь: '$peer_path'. Исправьте права доступа или пересоздайте файл и повторите запуск."
    return 1
  fi

  return 0
}

ensure_directory_source_readable() {
  local type_name="$1"
  local path_role="$2"
  local source_path="$3"
  local peer_path="$4"

  if [[ ! -e "$source_path" && ! -L "$source_path" ]]; then
    append_missing_message "Для типа '$type_name' отсутствует $path_role: ожидалась директория '$source_path'. Связанный путь: '$peer_path'. Создайте директорию или синхронизируйте её вручную и повторите запуск."
    return 1
  fi

  if [[ ! -d "$source_path" ]]; then
    append_missing_message "Для типа '$type_name' $path_role не читается: ожидалась директория '$source_path'. Связанный путь: '$peer_path'. Исправьте путь или пересоздайте директорию и повторите запуск."
    return 1
  fi

  if ! find "$source_path" -type d -printf '%P\n' >/dev/null 2>&1; then
    append_missing_message "Для типа '$type_name' $path_role не читается: не удалось прочитать структуру директорий '$source_path'. Связанный путь: '$peer_path'. Исправьте права доступа или пересоздайте директорию и повторите запуск."
    return 1
  fi

  return 0
}

get_directory_list() {
  local path="$1"
  find "$path" -type d -printf '%P\n' | LC_ALL=C sort
}

compare_type() {
  local type_name="$1"
  local kind="$2"
  local active_path="$3"
  local env_path="$4"

  if [[ "$kind" == "file" ]]; then
    ensure_file_source_readable "$type_name" "active-файл" "$active_path" "$env_path" || return
    ensure_file_source_readable "$type_name" "файл текущей среды" "$env_path" "$active_path" || return
    if ! cmp -s "$active_path" "$env_path"; then
      append_mismatch_message "Для типа '$type_name' файл '$active_path' не совпадает с '$env_path'. Синхронизируйте эти файлы вручную и повторите запуск."
    fi
    return
  fi

  ensure_directory_source_readable "$type_name" "active-директория" "$active_path" "$env_path" || return
  ensure_directory_source_readable "$type_name" "директория текущей среды" "$env_path" "$active_path" || return

  local active_dirs
  local env_dirs
  active_dirs="$(get_directory_list "$active_path")"
  env_dirs="$(get_directory_list "$env_path")"
  if [[ "$active_dirs" != "$env_dirs" ]]; then
    append_mismatch_message "Для типа '$type_name' структура директорий '$active_path' не совпадает с '$env_path'. Синхронизируйте эти директории вручную и повторите запуск."
  fi
}

remove_destination_path() {
  local destination_path="$1"
  if [[ -e "$destination_path" || -L "$destination_path" ]]; then
    if rm -rf "$destination_path"; then
      return
    fi

    if [[ "$current_platform" == "wsl" && "$destination_path" =~ ^/mnt/[a-zA-Z]/ ]] && command -v wslpath >/dev/null 2>&1 && command -v cmd.exe >/dev/null 2>&1; then
      local windows_path
      windows_path="$(wslpath -w "$destination_path")"
      if [[ -d "$destination_path" ]]; then
        cmd.exe /d /c rd /s /q "$windows_path" >/dev/null 2>&1 && return
      else
        cmd.exe /d /c del /f /q "$windows_path" >/dev/null 2>&1 && return
      fi
    fi

    printf "[swap-env] Не удалось удалить путь '%s'.\n" "$destination_path" >&2
    exit 1
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

save_or_load_type() {
  local action_name="$1"
  local type_name="$2"
  local kind="$3"
  local source_path="$4"
  local destination_path="$5"

  if [[ "$kind" == "file" ]]; then
    ensure_file_source_readable "$type_name" "исходный файл для '$action_name'" "$source_path" "$destination_path" || return
    remove_destination_path "$destination_path"
    copy_file_artifact "$source_path" "$destination_path"
    printf "[swap-env] %s: '%s' -> '%s'\n" "$type_name" "$source_path" "$destination_path"
    return
  fi

  ensure_directory_source_readable "$type_name" "исходная директория для '$action_name'" "$source_path" "$destination_path" || return
  remove_destination_path "$destination_path"
  copy_directory_artifact "$source_path" "$destination_path"
  printf "[swap-env] %s: '%s' -> '%s'\n" "$type_name" "$source_path" "$destination_path"
}

run_single_validate_type() {
  local type_name="$1"
  local validate_dry_run="$2"
  local kind
  local active_path
  local env_path

  kind="$(get_type_kind "$type_name")"
  active_path="$(get_type_active_path "$type_name")"
  env_path="$(get_type_variant_path "$type_name" "$current_platform")"

  compare_type "$type_name" "$kind" "$active_path" "$env_path"

  if [[ "${#missing_messages[@]}" -gt 0 || "${#mismatch_messages[@]}" -gt 0 ]]; then
    if [[ "$validate_dry_run" -eq 1 ]]; then
      print_messages "dry-run: "
    else
      print_messages ""
    fi

    if [[ "${#missing_messages[@]}" -gt 0 ]]; then
      exit 3
    fi

    exit 1
  fi

  exit 0
}

get_max_parallel_jobs() {
  local cpu_count=1
  if command -v nproc >/dev/null 2>&1; then
    cpu_count="$(nproc)"
  fi

  local max_jobs=$(( cpu_count * 80 / 100 ))
  if [[ "$max_jobs" -lt 1 ]]; then
    max_jobs=1
  fi

  printf "%s" "$max_jobs"
}

run_parallel_validate() {
  local validate_dry_run="$1"
  shift
  local -a types_to_check=("$@")
  local -a ordered_types=()
  local -a running_pids=()
  local -a running_indexes=()
  local -a output_files=()
  local -a exit_codes=()
  local type_name
  local index=0
  local max_jobs
  local temp_dir
  local has_missing=0
  local has_mismatch=0
  local has_internal_error=0

  for type_name in "${types_to_check[@]}"; do
    if [[ "$(get_type_kind "$type_name")" == "directory" ]]; then
      ordered_types+=("$type_name")
    fi
  done

  for type_name in "${types_to_check[@]}"; do
    if [[ "$(get_type_kind "$type_name")" == "file" ]]; then
      ordered_types+=("$type_name")
    fi
  done

  max_jobs="$(get_max_parallel_jobs)"
  temp_dir="$(mktemp -d)"

  collect_finished_job() {
    local pid="$1"
    local job_index="$2"
    local status=0

    set +e
    wait "$pid"
    status=$?
    set -e

    exit_codes[$job_index]="$status"

    if [[ -s "${output_files[$job_index]}" ]]; then
      cat "${output_files[$job_index]}" >&2
    fi
  }

  while [[ "$index" -lt "${#ordered_types[@]}" ]]; do
    type_name="${ordered_types[$index]}"
    output_files[$index]="$temp_dir/$index.out"

    if [[ "$validate_dry_run" -eq 1 ]]; then
      bash "$0" __validate-type --dry-run "$type_name" >"${output_files[$index]}" 2>&1 &
    else
      bash "$0" __validate-type "$type_name" >"${output_files[$index]}" 2>&1 &
    fi

    running_pids+=("$!")
    running_indexes+=("$index")
    index=$((index + 1))

    if [[ "${#running_pids[@]}" -ge "$max_jobs" ]]; then
      collect_finished_job "${running_pids[0]}" "${running_indexes[0]}"
      running_pids=("${running_pids[@]:1}")
      running_indexes=("${running_indexes[@]:1}")
    fi
  done

  while [[ "${#running_pids[@]}" -gt 0 ]]; do
    collect_finished_job "${running_pids[0]}" "${running_indexes[0]}"
    running_pids=("${running_pids[@]:1}")
    running_indexes=("${running_indexes[@]:1}")
  done

  rm -rf "$temp_dir"

  for status in "${exit_codes[@]}"; do
    case "${status:-0}" in
      0)
        ;;
      1)
        has_mismatch=1
        ;;
      3)
        has_missing=1
        ;;
      *)
        has_internal_error=1
        ;;
    esac
  done

  if [[ "$has_internal_error" -eq 1 ]]; then
    exit 2
  fi

  if [[ "$has_missing" -eq 1 ]]; then
    exit 3
  fi

  if [[ "$has_mismatch" -eq 1 ]]; then
    exit 1
  fi

  if [[ "$validate_dry_run" -eq 1 ]]; then
    printf "[swap-env] dry-run: все запрошенные типы синхронизированы для среды '%s'.\n" "$current_platform"
  else
    printf "[swap-env] validate: все запрошенные типы синхронизированы для среды '%s'.\n" "$current_platform"
  fi
}

if [[ "${1:-}" == "__validate-type" ]]; then
  shift
  internal_dry_run=0
  if [[ "${1:-}" == "--dry-run" ]]; then
    internal_dry_run=1
    shift
  fi
  if [[ "$#" -ne 1 ]]; then
    printf "[swap-env] Внутренняя команда __validate-type ожидает ровно один type.\n" >&2
    exit 2
  fi
  if ! is_known_type "$1"; then
    printf "[swap-env] Неподдерживаемый тип: %s\n" "$1" >&2
    exit 2
  fi
  run_single_validate_type "$1" "$internal_dry_run"
fi

if [[ "${1:-}" == "validate" || "${1:-}" == "save" || "${1:-}" == "load" ]]; then
  subcommand="$1"
  shift
fi

while (($# > 0)); do
  case "$1" in
    --help|-h)
      show_help=1
      shift
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    --type)
      if (($# < 2)); then
        printf "[swap-env] После --type ожидается значение.\n" >&2
        exit 2
      fi
      requested_types+=("$2")
      shift 2
      ;;
    --type=*)
      requested_types+=("${1#--type=}")
      shift
      ;;
    *)
      printf "[swap-env] Неподдерживаемый аргумент: %s\n" "$1" >&2
      exit 2
      ;;
  esac
done

if [[ "$show_help" -eq 1 ]]; then
  print_help
  exit 0
fi

if [[ "$dry_run" -eq 1 && "$subcommand" != "validate" ]]; then
  printf "[swap-env] --dry-run поддерживается только для validate.\n" >&2
  exit 2
fi

if [[ "${#requested_types[@]}" -eq 0 ]]; then
  if [[ "$subcommand" == "validate" ]]; then
    requested_types=("${all_types[@]}")
  else
    printf "[swap-env] Для команды %s нужен хотя бы один --type.\n" "$subcommand" >&2
    exit 2
  fi
fi

mapfile -t requested_types < <(unique_types "${requested_types[@]}")

for type_name in "${requested_types[@]}"; do
  if ! is_known_type "$type_name"; then
    printf "[swap-env] Неподдерживаемый тип: %s\n" "$type_name" >&2
    exit 2
  fi
done

if [[ "$subcommand" == "validate" ]]; then
  run_parallel_validate "$dry_run" "${requested_types[@]}"
  exit 0
fi

for type_name in "${requested_types[@]}"; do
  kind="$(get_type_kind "$type_name")"
  active_path="$(get_type_active_path "$type_name")"
  env_path="$(get_type_variant_path "$type_name" "$current_platform")"

  case "$subcommand" in
    save)
      save_or_load_type "save" "$type_name" "$kind" "$active_path" "$env_path"
      ;;
    load)
      save_or_load_type "load" "$type_name" "$kind" "$env_path" "$active_path"
      ;;
  esac
done
