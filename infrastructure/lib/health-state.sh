#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_HEALTH_STATE_SH:-}" ]; then
  AUTOTEKA_LIB_HEALTH_STATE_SH=1

  # INFRA_ROOT должен быть задан вызывающим скриптом (env или args)
  # shellcheck disable=SC1090
  source "$INFRA_ROOT/lib/dry-run.sh"
  # shellcheck disable=SC1090
  source "$INFRA_ROOT/lib/telegram.sh"

  HEALTH_STATE_DIR_DEFAULT="/var/lib/server-watchdog/health"

  health_state_dir() {
    printf '%s\n' "${HEALTH_STATE_DIR:-$HEALTH_STATE_DIR_DEFAULT}"
  }

  health_state_path() {
    local domain="$1"
    local key="$2"

    printf '%s/%s.%s\n' "$(health_state_dir)" "$domain" "$key"
  }

  health_state_get() {
    local domain="$1"
    local key="$2"
    local default_value="${3:-}"
    local path

    path="$(health_state_path "$domain" "$key")"
    if [ -f "$path" ]; then
      cat "$path"
      return 0
    fi

    printf '%s\n' "$default_value"
  }

  health_state_set() {
    local domain="$1"
    local key="$2"
    local value="$3"
    local path

    path="$(health_state_path "$domain" "$key")"
    ensure_dir "$(dirname "$path")"

    if is_dry_run; then
      dry_run_log "write health state ${domain}.${key}=${value}"
      return 0
    fi

    printf '%s' "$value" > "$path"
  }

  health_state_clear_domain() {
    local domain="$1"
    local dir

    dir="$(health_state_dir)"
    if is_dry_run; then
      dry_run_log "rm -f $dir/${domain}.*"
      return 0
    fi

    mkdir -p "$dir"
    rm -f "$dir/${domain}."* 2>/dev/null || true
  }

  health_state_has_incident() {
    local domain="$1"
    local fail_count
    local phase

    fail_count="$(health_state_get "$domain" fail_count 0)"
    phase="$(health_state_get "$domain" phase healthy)"

    [ "$fail_count" != "0" ] || [ "$phase" != "healthy" ]
  }

  http_status_once() {
    local url="$1"

    curl -ksS -o /dev/null -L -w '%{http_code}' "$url" 2>/dev/null || echo "000"
  }

  http_ok_once() {
    local url="$1"
    local status

    status="$(http_status_once "$url")"
    [ "$status" -ge 200 ] && [ "$status" -lt 400 ]
  }

  health_domain_reason_prefix() {
    local domain="$1"

    printf 'WATCHDOG_%s_' "$(printf '%s' "$domain" | tr '[:lower:]-' '[:upper:]_')"
  }

  clear_health_domain_notification_locks() {
    local script_id="$1"
    local domain="$2"

    clear_notification_locks_by_prefix "$script_id" "$(health_domain_reason_prefix "$domain")"
  }

  reset_health_domain_incident() {
    local script_id="$1"
    local domain="$2"

    health_state_clear_domain "$domain"
    clear_health_domain_notification_locks "$script_id" "$domain"
  }

  reset_all_health_incidents() {
    local script_id="$1"
    local domain

    for domain in nginx php backend admin api; do
      reset_health_domain_incident "$script_id" "$domain"
    done
  }
fi
