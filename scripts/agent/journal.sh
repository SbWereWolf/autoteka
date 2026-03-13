#!/usr/bin/env bash
set -e

if command -v pwsh >/dev/null 2>&1; then
  pwsh scripts/log-entry.ps1 \
    -Type "${2}" \
    -Message "$1" \
    -AISystemName "${3}" \
    -LLMName "${4}"
  exit $?
else
  exit 3
fi
