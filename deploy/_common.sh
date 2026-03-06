#!/usr/bin/env bash
set -euo pipefail

# Shared helpers for deploy scripts.

ENV_FILE_DEFAULT="/etc/vue-app/deploy.env"
TELEGRAM_ENV_FILE_DEFAULT="/etc/vue-app/telegram.env"
TELEGRAM_LOCK_DIR_DEFAULT="${TMPDIR:-/tmp}/autoteka-telegram-locks"
TELEGRAM_LOG_DEFAULT="/var/log/autoteka-telegram.log"

load_autoteka_env() {
  # 1) If AUTOTEKA_ROOT already present - keep
  if [ -z "${AUTOTEKA_ROOT:-}" ]; then
    local env_file="${1:-$ENV_FILE_DEFAULT}"
    if [ -f "$env_file" ]; then
      # shellcheck disable=SC1090
      set -a
      source "$env_file" || true
      set +a
    fi
  fi

  # 2) If still empty, try to infer from script location (local run)
  if [ -z "${AUTOTEKA_ROOT:-}" ]; then
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
    # deploy/.. -> repo root
    AUTOTEKA_ROOT="$(cd "$script_dir/.." && pwd)"
    export AUTOTEKA_ROOT
  fi

  if [ -z "${AUTOTEKA_ROOT:-}" ] || [ ! -d "$AUTOTEKA_ROOT" ]; then
    echo "AUTOTEKA_ROOT is not set or does not exist. Set it in $ENV_FILE_DEFAULT or export AUTOTEKA_ROOT." >&2
    exit 1
  fi
}

compose() {
  /usr/bin/docker compose -f "$AUTOTEKA_ROOT/deploy/docker-compose.yml" "$@"
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

  printf '[autoteka][%s][%s] %s. %s: %s.' \
    "$script_id" "$reason_code" "$action" "$kind" "$detail"
}

notify_error_once() {
  local script_id="$1"
  local action="$2"
  local reason_code="$3"
  local reason_text="$4"
  local lock_path

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

  telegram_enabled || return 0
  telegram_send "$(format_telegram_message "$script_id" "$reason_code" "$action" "Событие" "$reason_text")" || true
}

clear_script_notification_locks() {
  local script_id="$1"
  local lock_dir

  lock_dir="$(telegram_lock_dir)"
  rm -f "$lock_dir/autoteka.${script_id}."*.lock 2>/dev/null || true
}
