#!/usr/bin/env bash
set -euo pipefail

# Shared helpers for deploy scripts.

ENV_FILE_DEFAULT="/etc/vue-app/deploy.env"

load_autoteka_env() {
  # 1) If AUTOTEKA_ROOT already present - keep
  if [ -z "${AUTOTEKA_ROOT:-}" ]; then
    local env_file="${1:-$ENV_FILE_DEFAULT}"
    if [ -f "$env_file" ]; then
      # shellcheck disable=SC1090
      set -a
      source "$env_file" || true
      set +a
    fi
  fi

  # 2) If still empty, try to infer from script location (local run)
  if [ -z "${AUTOTEKA_ROOT:-}" ]; then
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
    # deploy/.. -> repo root
    AUTOTEKA_ROOT="$(cd "$script_dir/.." && pwd)"
    export AUTOTEKA_ROOT
  fi

  if [ -z "${AUTOTEKA_ROOT:-}" ] || [ ! -d "$AUTOTEKA_ROOT" ]; then
    echo "AUTOTEKA_ROOT is not set or does not exist. Set it in $ENV_FILE_DEFAULT or export AUTOTEKA_ROOT." >&2
    exit 1
  fi
}

compose() {
  /usr/bin/docker compose -f "$AUTOTEKA_ROOT/deploy/docker-compose.yml" "$@"
}
