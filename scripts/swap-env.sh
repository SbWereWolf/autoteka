#!/usr/bin/env bash
set -euo pipefail

mode="switch"
if [[ "${1:-}" == "--status" ]]; then
  mode="status"
elif [[ "${1:-}" == "--dry-run" ]]; then
  mode="dry-run"
elif [[ "${1:-}" != "" ]]; then
  printf "Usage: %s [--status|--dry-run]\n" "$(basename "$0")" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
state_file="$repo_root/.node-env.active"

package_roots=(
  "."
  "frontend"
  "system-tests"
  "infrastructure/tests"
)

env_roots=(
  "scripts"
  "lint"
  "backend/apps/ShopAPI"
  "backend/apps/ShopOperator"
)

get_target_platform() {
  if [[ -n "${WSL_DISTRO_NAME:-}" || -n "${WSL_INTEROP:-}" ]]; then
    printf "wsl"
    return
  fi

  printf "win"
}

get_state_platform() {
  if [[ ! -f "$state_file" ]]; then
    return
  fi

  local value
  value="$(tr -d '\r\n' < "$state_file")"
  if [[ "$value" == "win" || "$value" == "wsl" ]]; then
    printf "%s" "$value"
  fi
}

set_state_platform() {
  local platform="$1"

  if [[ "$mode" == "dry-run" ]]; then
    printf "[swap-env] dry-run write state '%s' -> '%s'\n" "$platform" "$state_file"
    return
  fi

  printf "%s" "$platform" > "$state_file"
}

path_exists_any() {
  local path="$1"
  [[ -e "$path" || -L "$path" ]]
}

get_link_platform() {
  local path="$1"

  if [[ ! -L "$path" ]]; then
    return
  fi

  local target
  target="$(readlink "$path")"

  case "$(basename "$target")" in
    *.win|*.win.json)
      printf "win"
      ;;
    *.wsl|*.wsl.json)
      printf "wsl"
      ;;
    *)
      printf "other"
      ;;
  esac
}

describe_active_entry() {
  local path="$1"

  if [[ -L "$path" ]]; then
    local link_platform
    link_platform="$(get_link_platform "$path")"

    if [[ -e "$path" ]]; then
      printf "symlink-%s" "$link_platform"
    else
      printf "broken-symlink-%s" "$link_platform"
    fi
    return
  fi

  if [[ -d "$path" ]]; then
    printf "directory"
    return
  fi

  if [[ -f "$path" ]]; then
    printf "file"
    return
  fi

  if [[ -e "$path" ]]; then
    printf "other"
    return
  fi

  printf "missing"
}

get_inferred_platform() {
  local active_description="$1"
  local has_win_variant="$2"
  local has_wsl_variant="$3"
  local state_platform="$4"

  case "$active_description" in
    symlink-win|broken-symlink-win)
      printf "win"
      return
      ;;
    symlink-wsl|broken-symlink-wsl)
      printf "wsl"
      return
      ;;
  esac

  if [[ "$active_description" != "missing" ]]; then
    if [[ "$has_wsl_variant" -eq 1 && "$has_win_variant" -eq 0 ]]; then
      printf "win"
      return
    fi

    if [[ "$has_win_variant" -eq 1 && "$has_wsl_variant" -eq 0 ]]; then
      printf "wsl"
      return
    fi

    if [[ -n "$state_platform" ]]; then
      printf "%s" "$state_platform"
      return
    fi

    printf "unknown-active"
    return
  fi

  if [[ "$has_win_variant" -eq 1 || "$has_wsl_variant" -eq 1 ]]; then
    printf "stored-only"
    return
  fi

  printf "empty"
}

invoke_move() {
  local source_path="$1"
  local destination_path="$2"

  if [[ "$mode" == "dry-run" ]]; then
    printf "[swap-env] dry-run move '%s' -> '%s'\n" "$source_path" "$destination_path"
    return
  fi

  mv "$source_path" "$destination_path"
}

remove_link() {
  local path="$1"

  if [[ "$mode" == "dry-run" ]]; then
    printf "[swap-env] dry-run remove link '%s'\n" "$path"
    return
  fi

  rm -f "$path"
}

get_status_label() {
  local path="$1"
  local target_platform="$2"

  if [[ -d "$path" ]]; then
    printf "directory:%s" "$target_platform"
    return
  fi

  if [[ -f "$path" ]]; then
    printf "file:%s" "$target_platform"
    return
  fi

  if [[ -L "$path" ]]; then
    printf "symlink:%s" "$target_platform"
    return
  fi

  printf "missing"
}

switch_entry() {
  local entry_label="$1"
  local active_path="$2"
  local win_variant_path="$3"
  local wsl_variant_path="$4"
  local state_platform="$5"
  local target_platform="$6"

  local active_description
  active_description="$(describe_active_entry "$active_path")"

  local has_win_variant=0
  local has_wsl_variant=0
  path_exists_any "$win_variant_path" && has_win_variant=1
  path_exists_any "$wsl_variant_path" && has_wsl_variant=1

  local inferred_platform
  inferred_platform="$(get_inferred_platform "$active_description" "$has_win_variant" "$has_wsl_variant" "$state_platform")"

  local current_variant_path=""
  local target_variant_path=""
  if [[ "$inferred_platform" == "win" ]]; then
    current_variant_path="$win_variant_path"
  elif [[ "$inferred_platform" == "wsl" ]]; then
    current_variant_path="$wsl_variant_path"
  fi

  if [[ "$target_platform" == "win" ]]; then
    target_variant_path="$win_variant_path"
  else
    target_variant_path="$wsl_variant_path"
  fi

  case "$active_description" in
    symlink-*|broken-symlink-*)
      remove_link "$active_path"
      active_description="missing"
      ;;
  esac

  case "$active_description" in
    directory|file|other)
      if [[ "$inferred_platform" == "unknown-active" ]]; then
        printf "Cannot migrate active %s '%s': current platform is unknown. Set .node-env.active to 'win' or 'wsl' and retry.\n" \
          "$entry_label" \
          "$active_path" >&2
        exit 1
      fi

      if [[ "$inferred_platform" == "$target_platform" ]]; then
        if path_exists_any "$target_variant_path"; then
          printf "Cannot keep active %s '%s': target variant '%s' already exists.\n" \
            "$entry_label" \
            "$active_path" \
            "$target_variant_path" >&2
          exit 1
        fi

        printf "%s" "$(get_status_label "$active_path" "$target_platform")"
        return
      fi

      if [[ -n "$current_variant_path" ]] && path_exists_any "$current_variant_path"; then
        printf "Cannot switch active %s '%s': current variant '%s' already exists.\n" \
          "$entry_label" \
          "$active_path" \
          "$current_variant_path" >&2
        exit 1
      fi

      if [[ -z "$current_variant_path" ]]; then
        printf "Cannot switch active %s '%s': current platform is not resolved.\n" \
          "$entry_label" \
          "$active_path" >&2
        exit 1
      fi

      invoke_move "$active_path" "$current_variant_path"
      ;;
  esac

  if path_exists_any "$target_variant_path"; then
    invoke_move "$target_variant_path" "$active_path"
  fi

  printf "%s" "$(get_status_label "$active_path" "$target_platform")"
}

target_platform="$(get_target_platform)"
state_platform="$(get_state_platform)"

for relative_root in "${package_roots[@]}"; do
  if [[ "$relative_root" == "." ]]; then
    package_root="$repo_root"
  else
    package_root="$repo_root/$relative_root"
  fi

  if [[ ! -f "$package_root/package.json" ]]; then
    continue
  fi

  active_node_modules="$package_root/node_modules"
  win_node_modules="$package_root/node_modules.win"
  wsl_node_modules="$package_root/node_modules.wsl"
  active_lock="$package_root/package-lock.json"
  win_lock="$package_root/package-lock.win.json"
  wsl_lock="$package_root/package-lock.wsl.json"

  node_modules_description="$(describe_active_entry "$active_node_modules")"
  lock_description="$(describe_active_entry "$active_lock")"

  has_win_node_modules=0
  has_wsl_node_modules=0
  has_win_lock=0
  has_wsl_lock=0

  path_exists_any "$win_node_modules" && has_win_node_modules=1
  path_exists_any "$wsl_node_modules" && has_wsl_node_modules=1
  path_exists_any "$win_lock" && has_win_lock=1
  path_exists_any "$wsl_lock" && has_wsl_lock=1

  node_modules_platform="$(get_inferred_platform "$node_modules_description" "$has_win_node_modules" "$has_wsl_node_modules" "$state_platform")"
  lock_platform="$(get_inferred_platform "$lock_description" "$has_win_lock" "$has_wsl_lock" "$state_platform")"

  if [[ "$mode" == "status" ]]; then
    printf "[swap-env] %s -> target=%s, state=%s, node_modules=%s, node_modules.current=%s, node_modules.win=%s, node_modules.wsl=%s, package-lock=%s, package-lock.current=%s, package-lock.win=%s, package-lock.wsl=%s\n" \
      "$relative_root" \
      "$target_platform" \
      "${state_platform:-missing}" \
      "$node_modules_description" \
      "$node_modules_platform" \
      "$( [[ "$has_win_node_modules" -eq 1 ]] && printf "present" || printf "missing" )" \
      "$( [[ "$has_wsl_node_modules" -eq 1 ]] && printf "present" || printf "missing" )" \
      "$lock_description" \
      "$lock_platform" \
      "$( [[ "$has_win_lock" -eq 1 ]] && printf "present" || printf "missing" )" \
      "$( [[ "$has_wsl_lock" -eq 1 ]] && printf "present" || printf "missing" )"
    continue
  fi

  node_modules_status="$(switch_entry "node_modules" "$active_node_modules" "$win_node_modules" "$wsl_node_modules" "$state_platform" "$target_platform")"
  lock_status="$(switch_entry "package-lock" "$active_lock" "$win_lock" "$wsl_lock" "$state_platform" "$target_platform")"

  printf "[swap-env] %s -> node_modules=%s, package-lock=%s\n" \
    "$relative_root" \
    "$node_modules_status" \
    "$lock_status"
done

for relative_root in "${env_roots[@]}"; do
  env_root="$repo_root/$relative_root"
  active_env="$env_root/.env"
  win_env="$env_root/win.env"
  wsl_env="$env_root/wsl.env"

  env_description="$(describe_active_entry "$active_env")"

  has_win_env=0
  has_wsl_env=0
  path_exists_any "$win_env" && has_win_env=1
  path_exists_any "$wsl_env" && has_wsl_env=1

  env_platform="$(get_inferred_platform "$env_description" "$has_win_env" "$has_wsl_env" "$state_platform")"

  if [[ "$mode" == "status" ]]; then
    printf "[swap-env] %s -> target=%s, state=%s, .env=%s, .env.current=%s, win.env=%s, wsl.env=%s\n" \
      "$relative_root" \
      "$target_platform" \
      "${state_platform:-missing}" \
      "$env_description" \
      "$env_platform" \
      "$( [[ "$has_win_env" -eq 1 ]] && printf "present" || printf "missing" )" \
      "$( [[ "$has_wsl_env" -eq 1 ]] && printf "present" || printf "missing" )"
    continue
  fi

  env_status="$(switch_entry ".env" "$active_env" "$win_env" "$wsl_env" "$state_platform" "$target_platform")"

  printf "[swap-env] %s -> .env=%s\n" \
    "$relative_root" \
    "$env_status"
done

if [[ "$mode" != "status" ]]; then
  set_state_platform "$target_platform"
fi
