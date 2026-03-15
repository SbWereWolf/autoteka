#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTOTEKA_LIB_TELEGRAM_SH:-}" ]; then
  AUTOTEKA_LIB_TELEGRAM_SH=1

  # INFRA_ROOT должен быть задан вызывающим скриптом (env или args)
    source "$INFRA_ROOT/lib/dry-run.sh"

  TELEGRAM_LOCK_DIR="${TMPDIR:-/tmp}/autoteka-telegram-locks"
  TELEGRAM_APP_VERSION_CACHE=""

  app_version_short() {
    if [ -n "$TELEGRAM_APP_VERSION_CACHE" ]; then
      printf '%s\n' "$TELEGRAM_APP_VERSION_CACHE"
      return 0
    fi

    if [ -n "${AUTOTEKA_ROOT:-}" ] && [ -d "$AUTOTEKA_ROOT/.git" ]; then
      local hash subject
      hash="$(git -C "$AUTOTEKA_ROOT" log -1 --format='%h' HEAD 2>/dev/null || true)"
      subject="$(git -C "$AUTOTEKA_ROOT" log -1 --format='%s' HEAD 2>/dev/null | head -1 | tr '\n\t' ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | cut -c1-60)"
      if [ -n "$hash" ]; then
        if [ -n "$subject" ]; then
          TELEGRAM_APP_VERSION_CACHE="${hash} — ${subject}"
        else
          TELEGRAM_APP_VERSION_CACHE="$hash"
        fi
      fi
    fi
    if [ -z "$TELEGRAM_APP_VERSION_CACHE" ]; then
      TELEGRAM_APP_VERSION_CACHE="unknown"
    fi

    printf '%s\n' "$TELEGRAM_APP_VERSION_CACHE"
  }

  load_telegram_env() {
    if [ -z "${TELEGRAM_ENV_FILE:-}" ]; then
      echo "TELEGRAM_ENV_FILE не задан. Задайте в options.env или в переменных окружения. Пример: TELEGRAM_ENV_FILE=/etc/autoteka/telegram.env" >&2
      exit 3
    fi
    local env_file="${1:-$TELEGRAM_ENV_FILE}"

    if [ -z "${TELEGRAM_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT:-}" ]; then
      if [ -f "$env_file" ]; then
        set -a
        source "$env_file" || { echo "Сбой загрузки '$env_file'" >&2; exit 3; }
        set +a
      fi
    fi
  }

  telegram_enabled() {
    [ -n "${TELEGRAM_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT:-}" ]
  }

  telegram_log() {
    local message="$1"

    if [ -z "${TELEGRAM_LOG_FILE:-}" ]; then
      echo "TELEGRAM_LOG_FILE не задан. Задайте в файле, указанном TELEGRAM_ENV_FILE (telegram.env), или в options.env. Пример: TELEGRAM_LOG_FILE=/var/log/autoteka-telegram.log" >&2
      exit 3
    fi
    mkdir -p "$(dirname "$TELEGRAM_LOG_FILE")"
    printf '%s %s\n' "$(date -u '+%Y-%m-%d %H:%M')" "$message" >> "$TELEGRAM_LOG_FILE"
  }

  telegram_send() {
    local message="$1"

    telegram_enabled \
    || telegram_log "Не могу отправить сообщение - нет реквизитов" \
    && return 3

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
    mkdir -p "$TELEGRAM_LOCK_DIR"
    printf '%s\n' "$TELEGRAM_LOCK_DIR"
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
      dry_run_log "telegram info [$script_id][$reason_code][$action] $reason_text"
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
      dry_run_log "telegram info once [$script_id][$reason_code][$action] $reason_text"
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
