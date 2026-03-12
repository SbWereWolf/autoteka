#!/usr/bin/env bash
set -e

STAGED=false
JSON=false

for arg in "$@"; do
  [[ "$arg" == "--staged" ]] && STAGED=true
  [[ "$arg" == "--json" ]] && JSON=true
done

if ! command -v git >/dev/null 2>&1; then
  exit 3
fi

if $STAGED; then
  FILES=$(git diff --name-only --cached)
else
  FILES=$(git status --porcelain=v1 | awk '{print substr($0,4)}')
fi

if $JSON; then
  printf '%s\n' "$FILES" | jq -R . | jq -s .
else
  printf '%s\n' "$FILES"
fi

exit 0
