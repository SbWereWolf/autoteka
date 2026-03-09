#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_DRY_RUN_SH:-}" ]; then
  AUTOTEKA_LIB_DRY_RUN_SH=1

  is_dry_run() {
    [ "${DRY_RUN:-0}" = "1" ]
  }

  dry_run_log() {
    printf '[DRY-RUN] %s\n' "$*"
  }

  run_cmd() {
    if is_dry_run; then
      dry_run_log "$*"
      return 0
    fi

    "$@"
  }

  run_shell() {
    local command="$1"

    if is_dry_run; then
      dry_run_log "$command"
      return 0
    fi

    sh -lc "$command"
  }

  ensure_dir() {
    local dir="$1"

    if is_dry_run; then
      dry_run_log "mkdir -p $dir"
      return 0
    fi

    mkdir -p "$dir"
  }

  remove_file_if_exists() {
    local path="$1"

    if is_dry_run; then
      dry_run_log "rm -f $path"
      return 0
    fi

    rm -f "$path" 2>/dev/null || true
  }
fi
