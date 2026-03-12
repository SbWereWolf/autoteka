#!/usr/bin/env bash
set -e

MODE="check"
STAGED=false

for arg in "$@"; do
  [[ "$arg" == "--apply" ]] && MODE="apply"
  [[ "$arg" == "--staged" ]] && STAGED=true
done

FILES=$(bash "$(dirname "$0")/changed-files.sh" $( $STAGED && echo "--staged" ))

if [[ -z "$FILES" ]]; then
  exit 0
fi

if [[ -f package.json ]] && command -v npm >/dev/null 2>&1; then
  if [[ "$MODE" == "check" ]]; then
    npm run lint --if-present
  else
    npm run lint:fix --if-present
  fi
fi

if [[ -f composer.json ]] && [[ -x vendor/bin/php-cs-fixer ]]; then
  if [[ "$MODE" == "check" ]]; then
    vendor/bin/php-cs-fixer fix --dry-run --diff
  else
    vendor/bin/php-cs-fixer fix
  fi
fi

exit $?
