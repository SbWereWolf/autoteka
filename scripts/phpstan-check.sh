#!/usr/bin/env bash
set -u

modules=(
  "backend/apps/ShopAPI"
  "backend/apps/ShopOperator"
  "backend/packages/SchemaDefinition"
)

log() {
  printf '[phpstan-check] %s\n' "$1"
}

has_errors=0

for module in "${modules[@]}"; do
  if [[ ! -d "$module" ]]; then
    log "ERROR: module not found: $module"
    has_errors=1
    continue
  fi

  if [[ ! -f "$module/composer.json" ]]; then
    log "ERROR: composer.json not found: $module"
    has_errors=1
    continue
  fi

  if [[ ! -f "$module/phpstan.neon" ]]; then
    log "ERROR: phpstan.neon not found: $module"
    has_errors=1
    continue
  fi

  phpstan_bin="$module/vendor/bin/phpstan"
  if [[ ! -x "$phpstan_bin" ]]; then
    log "ERROR: phpstan binary not found in $module/vendor/bin"
    has_errors=1
    continue
  fi

  log "Running: $module"
  (
    cd "$module" || exit 1
    ./vendor/bin/phpstan analyse --configuration phpstan.neon --no-progress
  )
  ec=$?
  if [[ $ec -ne 0 ]]; then
    log "ERROR: phpstan failed for $module"
    has_errors=1
  else
    log "OK: $module"
  fi
done

if [[ $has_errors -ne 0 ]]; then
  exit 1
fi

exit 0
