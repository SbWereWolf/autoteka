#!/usr/bin/env bash
set -e

JSON=false
if [[ "$1" == "--json" ]]; then
  JSON=true
fi

if ! command -v git >/dev/null 2>&1; then
  echo '{"error":"git_not_found"}'
  exit 3
fi

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo '{"error":"not_a_git_repo"}'
  exit 4
fi

ROOT=$(git rev-parse --show-toplevel)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
STATUS=$(git status --porcelain=v1)

HAS_NODE=false
HAS_COMPOSER=false
[[ -f package.json ]] && HAS_NODE=true
[[ -f composer.json ]] && HAS_COMPOSER=true

if $JSON; then
  echo "{
    \"repo_root\": \"$ROOT\",
    \"branch\": \"$BRANCH\",
    \"has_changes\": $( [[ -n "$STATUS" ]] && echo true || echo false ),
    \"has_node\": $HAS_NODE,
    \"has_composer\": $HAS_COMPOSER
  }"
fi

exit 0
