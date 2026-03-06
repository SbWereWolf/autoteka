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

backend_dir() {
  printf '%s\n' "$AUTOTEKA_ROOT/backend"
}

detect_php_fpm_runtime_identity() {
  compose exec -T php sh -lc '
    set -eu

    resolve_field() {
      field="$1"
      value=""

      value="$(awk -F= -v key="$field" "
        \$1 ~ /^[[:space:]]*[;#]/ { next }
        \$1 ~ \"^[[:space:]]*\" key \"[[:space:]]*$\" {
          gsub(/^[[:space:]]+|[[:space:]]+$/, \"\", \$2)
          print \$2
          exit
        }
      " /usr/local/etc/php-fpm.d/www.conf 2>/dev/null || true)"

      if [ -z "$value" ]; then
        value="www-data"
      fi

      printf "%s\n" "$value"
    }

    runtime_user="$(resolve_field user)"
    runtime_group="$(resolve_field group)"
    runtime_gid="$(awk -F: -v key="$runtime_group" '$1 == key { print $3; exit }' /etc/group)"

    if [ -z "$runtime_gid" ]; then
      runtime_gid="$(id -g "$runtime_user")"
    fi

    printf "%s:%s:%s:%s\n" \
      "$runtime_user" \
      "$runtime_group" \
      "$(id -u "$runtime_user")" \
      "$runtime_gid"
  '
}

laravel_runtime_paths() {
  cat <<EOF
$(backend_dir)/database
$(backend_dir)/storage
$(backend_dir)/storage/app
$(backend_dir)/storage/app/public
$(backend_dir)/storage/app/private
$(backend_dir)/storage/framework
$(backend_dir)/storage/framework/cache
$(backend_dir)/storage/framework/cache/data
$(backend_dir)/storage/framework/sessions
$(backend_dir)/storage/framework/views
$(backend_dir)/storage/framework/testing
$(backend_dir)/storage/logs
$(backend_dir)/bootstrap/cache
EOF
}

prepare_laravel_runtime() {
  local backend
  local runtime_identity
  local runtime_user
  local runtime_group
  local runtime_uid
  local runtime_gid
  local path

  backend="$(backend_dir)"

  mkdir -p "$backend"
  if [ ! -f "$backend/.env" ] && [ -f "$backend/example.env" ]; then
    cp "$backend/example.env" "$backend/.env"
  fi
  mkdir -p "$backend/database"
  touch "$backend/database/database.sqlite"

  while IFS= read -r path; do
    [ -n "$path" ] || continue
    mkdir -p "$path"
  done <<EOF
$(laravel_runtime_paths)
EOF

  runtime_identity="$(detect_php_fpm_runtime_identity)"
  IFS=':' read -r runtime_user runtime_group runtime_uid runtime_gid <<EOF
$runtime_identity
EOF

  while IFS= read -r path; do
    [ -n "$path" ] || continue
    chown -R "$runtime_uid:$runtime_gid" "$path"
  done <<EOF
$(laravel_runtime_paths)
EOF

  chown "$runtime_uid:$runtime_gid" "$backend/database/database.sqlite"

  while IFS= read -r path; do
    [ -n "$path" ] || continue
    find "$path" -type d -exec chmod 775 {} \;
    find "$path" -type f -exec chmod 664 {} \;
  done <<EOF
$(laravel_runtime_paths)
EOF

  chmod 664 "$backend/database/database.sqlite"
  rm -f "$backend/database/database.sqlite-wal" "$backend/database/database.sqlite-shm"

  echo "laravel runtime prepared for ${runtime_user}:${runtime_group} (${runtime_uid}:${runtime_gid})"
}

artisan_in_php() {
  local command="$1"

  compose exec -T php sh -lc "
    set -eu
    cd /var/www/backend
    php artisan $command
  "
}

wait_for_php_exec_ready() {
  local timeout="${1:-60}"
  local started_at

  started_at="$(date +%s)"

  while true; do
    if compose exec -T php sh -lc 'cd /var/www/backend && pwd >/dev/null' >/dev/null 2>&1; then
      return 0
    fi

    if [ $(( $(date +%s) - started_at )) -ge "$timeout" ]; then
      echo "php container did not become ready within ${timeout}s" >&2
      return 1
    fi

    sleep 2
  done
}

clear_laravel_optimizations() {
  artisan_in_php "optimize:clear"
}

prepare_laravel_runtime_and_clear() {
  prepare_laravel_runtime
  clear_laravel_optimizations
}

check_sqlite_write_access() {
  artisan_in_php "tinker --execute=\"session(['deploy_runtime_check' => 'ok']); DB::table('sessions')->count(); cache()->put('deploy_runtime_check', 'ok', 60);\""
}

http_smoke_check() {
  local url="$1"

  curl -fsS -o /dev/null -L "$url"
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
