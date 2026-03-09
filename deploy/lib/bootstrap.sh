#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_BOOTSTRAP_SH:-}" ]; then
  AUTOTEKA_LIB_BOOTSTRAP_SH=1

  ENV_FILE_DEFAULT="/etc/autoteka/deploy.env"

  load_autoteka_env() {
    # 1) If AUTOTEKA_ROOT already present - keep.
    if [ -z "${AUTOTEKA_ROOT:-}" ]; then
      local env_file="${1:-$ENV_FILE_DEFAULT}"
      if [ -f "$env_file" ]; then
        # shellcheck disable=SC1090
        set -a
        source "$env_file" || true
        set +a
      fi
    fi

    # 2) If still empty, try to infer repo root from current deploy script location.
    if [ -z "${AUTOTEKA_ROOT:-}" ]; then
      local script_dir
      local deploy_dir
      script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
      deploy_dir="$(cd "$script_dir" && while [ ! -f "DEPLOY.md" ] && [ "$PWD" != "/" ]; do cd ..; done; pwd)"
      AUTOTEKA_ROOT="$(cd "$deploy_dir/.." && pwd)"
      export AUTOTEKA_ROOT
    fi

    if [ -z "${AUTOTEKA_ROOT:-}" ] || [ ! -d "$AUTOTEKA_ROOT" ]; then
      echo "AUTOTEKA_ROOT is not set or does not exist. Set it in $ENV_FILE_DEFAULT or export AUTOTEKA_ROOT." >&2
      exit 1
    fi
  }
fi
