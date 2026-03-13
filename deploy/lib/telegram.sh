#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_TELEGRAM_SH:-}" ]; then
  AUTOTEKA_LIB_TELEGRAM_SH=1

  AUTOTEKA_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  # shellcheck disable=SC1090
  source "$AUTOTEKA_LIB_DIR/dry-run.sh"

  TELEGRAM_ENV_FILE_DEFAULT="/etc/autoteka/telegram.env"
  TELEGRAM_LOCK_DIR_DEFAULT="${TMPDIR:-/tmp}/autoteka-telegram-locks"
  TELEGRAM_LOG_DEFAULT="/var/log/autoteka-telegram.log"
  TELEGRAM_APP_VERSION_CACHE=""

  app_version_short() {
    if [ -n "$TELEGRAM_APP_VERSION_CACHE" ]; then
      printf '%s\n' "$TELEGRAM_APP_VERSION_CACHE"
      return 0
    fi

    if [ -n "${AUTOTEKA_ROOT:-}" ] && [ -d "$AUTOTEKA_ROOT/.git" ]; then
      TELEGRAM_APP_VERSION_CACHE="$(git -C "$AUTOTEKA_ROOT" rev-parse --short=12 HEAD 2>/dev/null || true)"
    fi
    if [ -z "$TELEGRAM_APP_VERSION_CACHE" ]; then
      TELEGRAM_APP_VERSION_CACHE="unknown"
    fi

    printf '%s\n' "$TELEGRAM_APP_VERSION_CACHE"
  }

  load_telegram_env() {
    local env_file="${1:-$TELEGRAM_ENV_FILE_DEFAULT}"

    if [ -z "${TELEGRAM_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT:-}" ]; then
      if [ -f "$env_file" ]; then
        # shellcheck disable=SC1090
        set -a
        source "$env_file" || true
        set +a
      fi
    fi
  }

  telegram_enabled() {
    [ -n "${TELEGRAM_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT:-}" ]
  }

  telegram_log() {
    local message="$1"

    mkdir -p "$(dirname "$TELEGRAM_LOG_DEFAULT")"
    printf '%s %s\n' "$(date -u '+%Y-%m-%d %H:%M')" "$message" >> "$TELEGRAM_LOG_DEFAULT"
  }

  telegram_send() {
    local message="$1"

    telegram_enabled || return 1

    telegram_log "Для отправки подготовлено сообщение: $message"

    if curl -fsS -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
      --data-urlencode "chat_id=${TELEGRAM_CHAT}" \
      --data-urlencode "text=${message}" \
      >/dev/null 2>&1; then
      telegram_log "Успешная отправка: $message"
      return 0
    fi

    telegram_log "Сбой отправки: $message"
    return 1
  }

  telegram_lock_dir() {
    mkdir -p "$TELEGRAM_LOCK_DIR_DEFAULT"
    printf '%s\n' "$TELEGRAM_LOCK_DIR_DEFAULT"
  }

  telegram_lock_path() {
    local script_id="$1"
    local reason_code="$2"
    local lock_dir

    lock_dir="$(telegram_lock_dir)"
    printf '%s/autoteka.%s.%s.lock\n' "$lock_dir" "$script_id" "$reason_code"
  }

  format_telegram_message() {
    local script_id="$1"
    local reason_code="$2"
    local action="$3"
    local kind="$4"
    local detail="$5"

    printf '[autoteka][%s][%s][version:%s] %s. %s: %s.' \
      "$script_id" "$reason_code" "$(app_version_short)" "$action" "$kind" "$detail"
  }

  notify_error_once() {
    local script_id="$1"
    local action="$2"
    local reason_code="$3"
    local reason_text="$4"
    local lock_path

    if is_dry_run; then
      dry_run_log "telegram error once [$script_id][$reason_code] $reason_text"
      return 0
    fi

    telegram_enabled || return 0

    lock_path="$(telegram_lock_path "$script_id" "$reason_code")"
    if [ -f "$lock_path" ]; then
      return 0
    fi

    if telegram_send "$(format_telegram_message "$script_id" "$reason_code" "$action" "Причина" "$reason_text")"; then
      touch "$lock_path"
    fi

    return 0
  }

  notify_info() {
    local script_id="$1"
    local action="$2"
    local reason_code="$3"
    local reason_text="$4"

    if is_dry_run; then
      dry_run_log "telegram info [$script_id][$reason_code] $reason_text"
      return 0
    fi

    telegram_enabled || return 0
    telegram_send "$(format_telegram_message "$script_id" "$reason_code" "$action" "Событие" "$reason_text")" || true
  }

  notify_info_once() {
    local script_id="$1"
    local action="$2"
    local reason_code="$3"
    local reason_text="$4"
    local lock_path

    if is_dry_run; then
      dry_run_log "telegram info once [$script_id][$reason_code] $reason_text"
      return 0
    fi

    telegram_enabled || return 0

    lock_path="$(telegram_lock_path "$script_id" "$reason_code")"
    if [ -f "$lock_path" ]; then
      return 0
    fi

    if telegram_send "$(format_telegram_message "$script_id" "$reason_code" "$action" "Событие" "$reason_text")"; then
      touch "$lock_path"
    fi

    return 0
  }

  clear_script_notification_locks() {
    local script_id="$1"
    local lock_dir

    lock_dir="$(telegram_lock_dir)"
    if is_dry_run; then
      dry_run_log "rm -f $lock_dir/autoteka.${script_id}.*.lock"
      return 0
    fi

    rm -f "$lock_dir/autoteka.${script_id}."*.lock 2>/dev/null || true
  }

  clear_notification_lock() {
    local script_id="$1"
    local reason_code="$2"

    remove_file_if_exists "$(telegram_lock_path "$script_id" "$reason_code")"
  }

  clear_notification_locks_by_prefix() {
    local script_id="$1"
    local reason_prefix="$2"
    local lock_dir

    lock_dir="$(telegram_lock_dir)"
    if is_dry_run; then
      dry_run_log "rm -f $lock_dir/autoteka.${script_id}.${reason_prefix}*.lock"
      return 0
    fi

    rm -f "$lock_dir/autoteka.${script_id}.${reason_prefix}"*.lock 2>/dev/null || true
  }
fi
