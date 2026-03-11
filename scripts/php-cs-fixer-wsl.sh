#!/usr/bin/env bash
set -euo pipefail

if ! command -v php.exe >/dev/null 2>&1; then
  echo "php.exe not found in PATH" >&2
  exit 127
fi

if ! command -v wslpath >/dev/null 2>&1; then
  echo "wslpath not found in PATH" >&2
  exit 127
fi

args=()
for arg in "$@"; do
  if [[ "$arg" == /mnt/* ]]; then
    args+=("$(wslpath -w "$arg")")
  else
    args+=("$arg")
  fi
done

exec php.exe ./vendor/bin/php-cs-fixer "${args[@]}"
