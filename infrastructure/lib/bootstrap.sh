#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_BOOTSTRAP_SH:-}" ]; then
  AUTOTEKA_LIB_BOOTSTRAP_SH=1

  ENV_FILE_DEFAULT="/etc/autoteka/deploy.env"

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

    if [ -f "$env_file" ]; then
      # shellcheck disable=SC1090
      set -a
      source "$env_file" || true
      set +a
    fi

    if [ -z "${AUTOTEKA_ROOT:-}" ] || [ ! -d "$AUTOTEKA_ROOT" ]; then
      echo "AUTOTEKA_ROOT is not set or does not exist. Set it in $ENV_FILE_DEFAULT or export AUTOTEKA_ROOT." >&2
      exit 1
    fi

    if [ -z "${INFRA_ROOT:-}" ]; then
      local inferred_infra_root=""
      if inferred_infra_root="$(resolve_infra_root_from_script_location)"; then
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
