#!/usr/bin/env bash
set -e

if command -v pwsh >/dev/null 2>&1; then
  pwsh scripts/log-entry.ps1 \
    -Type "${2:-ProposedPlan}" \
    -Message "$1" \
    -AISystemName "${3:-Codex}" \
    -LLMName "${4:-gpt-5}"
  exit $?
else
  exit 3
fi
