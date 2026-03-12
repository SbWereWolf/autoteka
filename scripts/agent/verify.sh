#!/usr/bin/env bash
set -e

if command -v pwsh >/dev/null 2>&1; then
  pwsh "$(dirname "$0")/verify.ps1" "$@"
  exit $?
elif command -v powershell.exe >/dev/null 2>&1; then
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(dirname "$0")/verify.ps1" "$@"
  exit $?
else
  exit 3
fi
