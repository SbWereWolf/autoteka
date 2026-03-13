#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_BOOTSTRAP_SH:-}" ]; then
  AUTOTEKA_LIB_BOOTSTRAP_SH=1

  ENV_FILE_DEFAULT="/etc/autoteka/deploy.env"

  resolve_infra_root_from_autoteka_root() {
    if [ -n "${AUTOTEKA_ROOT:-}" ] && [ -d "$AUTOTEKA_ROOT/infrastructure" ]; then
      printf '%s\n' "$AUTOTEKA_ROOT/infrastructure"
      return 0
    fi
    if [ -n "${AUTOTEKA_ROOT:-}" ] && [ -d "$AUTOTEKA_ROOT/deploy" ]; then
      printf '%s\n' "$AUTOTEKA_ROOT/deploy"
      return 0
    fi
    return 1
  }

  resolve_infra_root_from_script_location() {
    local script_dir=""
    local search_root=""

    script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
    search_root="$script_dir"
    while [ "$search_root" != "/" ]; do
      if [ -f "$search_root/DEPLOY.md" ] && [ -d "$search_root/lib" ] && [ -d "$search_root/runtime" ]; then
        printf '%s\n' "$search_root"
        return 0
      fi
      search_root="$(dirname "$search_root")"
    done

    return 1
  }

  load_autoteka_env() {
    local env_file="${1:-$ENV_FILE_DEFAULT}"

    # Load environment from file, but keep compatibility with partially filled files.
    if [ -f "$env_file" ]; then
      # shellcheck disable=SC1090
      set -a
      source "$env_file" || true
      set +a
    fi

    # If AUTOTEKA_ROOT is not explicitly configured, infer it from script location.
    if [ -z "${AUTOTEKA_ROOT:-}" ]; then
      local inferred_infra_root=""
      if inferred_infra_root="$(resolve_infra_root_from_script_location)"; then
        AUTOTEKA_ROOT="$(cd "$inferred_infra_root/.." && pwd)"
        export AUTOTEKA_ROOT
      fi
    fi

    if [ -z "${AUTOTEKA_ROOT:-}" ] || [ ! -d "$AUTOTEKA_ROOT" ]; then
      echo "AUTOTEKA_ROOT is not set or does not exist. Set it in $ENV_FILE_DEFAULT or export AUTOTEKA_ROOT." >&2
      exit 1
    fi

    if [ -z "${INFRA_ROOT:-}" ]; then
      local inferred_infra_root=""
      if inferred_infra_root="$(resolve_infra_root_from_autoteka_root)"; then
        INFRA_ROOT="$inferred_infra_root"
      elif inferred_infra_root="$(resolve_infra_root_from_script_location)"; then
        INFRA_ROOT="$inferred_infra_root"
      fi
      export INFRA_ROOT
    fi

    if [ -z "${INFRA_ROOT:-}" ] || [ ! -d "$INFRA_ROOT" ]; then
      echo "INFRA_ROOT is not set or does not exist. Set it in $ENV_FILE_DEFAULT or export INFRA_ROOT." >&2
      exit 1
    fi
  }
fi
