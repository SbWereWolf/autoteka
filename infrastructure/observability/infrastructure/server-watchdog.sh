#!/usr/bin/env bash
set -euo pipefail

LOG="/var/log/server-watchdog.log"
METRIC_LOG="/var/log/server-metrics.log"
RESOURCE_STATE="/var/lib/server-watchdog.state"
REBOOT_STATE="/var/lib/server-watchdog.reboot"
LOCK_FILE="/var/lock/autoteka-server-watchdog.lock"

WEB_CONTAINER="autoteka-http"
PHP_CONTAINER="autoteka-php"
COMPOSE_UNIT="autoteka.service"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"
source "$INFRA_ROOT/lib/laravel-runtime.sh"
source "$INFRA_ROOT/lib/health-state.sh"
load_telegram_env

# ===== host/resource settings =====
LOAD_LIMIT="${WATCHDOG_LOAD_LIMIT}"
RAM_LIMIT="${WATCHDOG_RAM_LIMIT}"
BOOT_GRACE="${WATCHDOG_BOOT_GRACE}"
MAX_STAGE1="${WATCHDOG_STAGE1_MAX_FAILS}"
MAX_STAGE2="${WATCHDOG_STAGE2_MAX_FAILS}"
REBOOT_COOLDOWN="${WATCHDOG_REBOOT_COOLDOWN}"

# ===== health domains =====
NGINX_FAIL_THRESHOLD="${WATCHDOG_NGINX_FAIL_THRESHOLD}"
PHP_FAIL_THRESHOLD="${WATCHDOG_PHP_FAIL_THRESHOLD}"
BACKEND_FAIL_THRESHOLD="${WATCHDOG_BACKEND_FAIL_THRESHOLD}"
ADMIN_FAIL_THRESHOLD="${WATCHDOG_ADMIN_FAIL_THRESHOLD}"
API_FAIL_THRESHOLD="${WATCHDOG_API_FAIL_THRESHOLD}"

NGINX_REPAIR_COOLDOWN="${WATCHDOG_NGINX_REPAIR_COOLDOWN}"
PHP_REPAIR_COOLDOWN="${WATCHDOG_PHP_REPAIR_COOLDOWN}"
BACKEND_REPAIR_COOLDOWN="${WATCHDOG_BACKEND_REPAIR_COOLDOWN}"
ADMIN_REPAIR_COOLDOWN="${WATCHDOG_ADMIN_REPAIR_COOLDOWN}"
API_REPAIR_COOLDOWN="${WATCHDOG_API_REPAIR_COOLDOWN}"

NGINX_MAX_REPAIRS="${WATCHDOG_NGINX_MAX_REPAIRS}"
PHP_MAX_REPAIRS="${WATCHDOG_PHP_MAX_REPAIRS}"
BACKEND_MAX_REPAIRS="${WATCHDOG_BACKEND_MAX_REPAIRS}"
ADMIN_MAX_REPAIRS="${WATCHDOG_ADMIN_MAX_REPAIRS}"
API_MAX_REPAIRS="${WATCHDOG_API_MAX_REPAIRS}"

NGINX_REPAIR_VERIFY_TIMEOUT="${WATCHDOG_NGINX_REPAIR_VERIFY_TIMEOUT}"
PHP_REPAIR_VERIFY_TIMEOUT="${WATCHDOG_PHP_REPAIR_VERIFY_TIMEOUT}"
CONTAINER_REPAIR_VERIFY_INTERVAL="${WATCHDOG_CONTAINER_REPAIR_VERIFY_INTERVAL}"
BACKEND_UP_URL="${BACKEND_UP_URL}"
API_HEALTH_URL="${API_HEALTH_URL}"
ADMIN_HEALTH_URL="${ADMIN_HEALTH_URL}"

DRY_RUN=0
SCRIPT_ID="server-watchdog"
WATCHDOG_ACTION="healthcheck системы и безопасная автопочинка"
PROBE_DETAIL=""

usage() {
  cat <<'USAGE'
Usage:
  autoteka watchdog [--dry-run]

What it does:
  - runs docker liveness checks for nginx and php-fpm
  - runs software checks: /up, /api/v1/category-list, /admin/login
  - applies bounded auto-remediation with fail thresholds and cooldowns
  - keeps Telegram dedup locks and per-domain incident state
  - preserves legacy host/resource emergency handling (stage1/stage2/stage3)

Flags:
  -n, --dry-run   Show what would happen without changing state, sending Telegram,
                  restarting containers or writing incident files.
  -h, --help      Show this help.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    -n|--dry-run)
      DRY_RUN=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

mkdir -p /var/lib /var/log /var/lock "$(health_state_dir)"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log_action "[watchdog] skip reason=flock"
  echo "watchdog already running, skip" >&2
  exit 0
fi

log_action() {
  if [ "$DRY_RUN" = "1" ]; then
    dry_run_log "log $(date +"%Y-%m-%d %H:%M:%S") $*"
    return 0
  fi
  echo "$(date +"%Y-%m-%d %H:%M:%S") $*" >> "$LOG"
}

log_watchdog_end() {
  local err_arr="$1"
  if [ -z "$err_arr" ]; then
    log_action "[watchdog] end, result: OK"
  else
    log_action "[watchdog] end ERRORS_START{\"errors\":[$err_arr]}ERRORS_END"
  fi
}

append_metrics() {
  local line="$1"
  if [ "$DRY_RUN" = "1" ]; then
    dry_run_log "metrics $line"
    return 0
  fi
  echo "$line" >> "$METRIC_LOG"
}
float_gt() { awk -v a="$1" -v b="$2" 'BEGIN{exit !(a>b)}'; }
now_epoch() { date +%s; }
now_iso() { date -Is; }
uptime_s() { awk '{print int($1)}' /proc/uptime 2>/dev/null || echo 0; }
load_1m() { awk '{print $1}' /proc/loadavg 2>/dev/null || echo 0; }
ram_used_pct() {
  awk '
    /^MemTotal:/ {t=$2}
    /^MemAvailable:/ {a=$2}
    END {
      if (t>0) {
        used=(t-a)*100/t;
        printf "%.0f\n", used
      } else {
        print 0
      }
    }' /proc/meminfo 2>/dev/null || echo 0
}

docker_available() { command -v docker >/dev/null 2>&1; }
container_exists() { docker inspect "$1" >/dev/null 2>&1; }
container_health() {
  local container="$1"

  if ! container_exists "$container"; then
    echo "missing"
    return 0
  fi

  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-health{{end}}' "$container" 2>/dev/null || echo "unknown"
}

reason_code() {
  local domain="$1"
  local suffix="$2"
  printf 'WATCHDOG_%s_%s' "$(printf '%s' "$domain" | tr '[:lower:]-' '[:upper:]_')" "$suffix"
}

domain_fail_threshold() {
  case "$1" in
    nginx) echo "$NGINX_FAIL_THRESHOLD" ;;
    php) echo "$PHP_FAIL_THRESHOLD" ;;
    backend) echo "$BACKEND_FAIL_THRESHOLD" ;;
    admin) echo "$ADMIN_FAIL_THRESHOLD" ;;
    api) echo "$API_FAIL_THRESHOLD" ;;
    *) echo 2 ;;
  esac
}

domain_cooldown() {
  case "$1" in
    nginx) echo "$NGINX_REPAIR_COOLDOWN" ;;
    php) echo "$PHP_REPAIR_COOLDOWN" ;;
    backend) echo "$BACKEND_REPAIR_COOLDOWN" ;;
    admin) echo "$ADMIN_REPAIR_COOLDOWN" ;;
    api) echo "$API_REPAIR_COOLDOWN" ;;
    *) echo 0 ;;
  esac
}

domain_max_repairs() {
  case "$1" in
    nginx) echo "$NGINX_MAX_REPAIRS" ;;
    php) echo "$PHP_MAX_REPAIRS" ;;
    backend) echo "$BACKEND_MAX_REPAIRS" ;;
    admin) echo "$ADMIN_MAX_REPAIRS" ;;
    api) echo "$API_MAX_REPAIRS" ;;
    *) echo 0 ;;
  esac
}

domain_repair_verify_timeout() {
  case "$1" in
    nginx) echo "$NGINX_REPAIR_VERIFY_TIMEOUT" ;;
    php) echo "$PHP_REPAIR_VERIFY_TIMEOUT" ;;
    *) echo 0 ;;
  esac
}

wait_for_container_health_after_repair() {
  local domain="$1"
  local container="$2"
  local timeout="$3"
  local interval="$4"
  local deadline
  local status

  deadline=$(( $(now_epoch) + timeout ))

  while :; do
    status="$(container_health "$container")"
    PROBE_DETAIL="container=$container health=$status"
    case "$status" in
      healthy)
        return 0
        ;;
      starting)
        if [ "$(now_epoch)" -ge "$deadline" ]; then
          return 1
        fi
        if [ "$DRY_RUN" = "1" ]; then
          dry_run_log "sleep $interval (waiting for $domain container health to leave starting)"
          return 0
        fi
        sleep "$interval"
        ;;
      *)
        return 1
        ;;
    esac
  done
}

probe_domain_after_repair() {
  local domain="$1"
  local timeout

  case "$domain" in
    nginx)
      timeout="$(domain_repair_verify_timeout "$domain")"
      wait_for_container_health_after_repair "$domain" "$WEB_CONTAINER" "$timeout" "$CONTAINER_REPAIR_VERIFY_INTERVAL"
      ;;
    php)
      timeout="$(domain_repair_verify_timeout "$domain")"
      wait_for_container_health_after_repair "$domain" "$PHP_CONTAINER" "$timeout" "$CONTAINER_REPAIR_VERIFY_INTERVAL"
      ;;
    *)
      probe_domain "$domain"
      ;;
  esac
}

probe_domain() {
  local domain="$1"
  local status

  PROBE_DETAIL=""
  case "$domain" in
    nginx)
      status="$(container_health "$WEB_CONTAINER")"
      PROBE_DETAIL="container=$WEB_CONTAINER health=$status"
      [ "$status" = "healthy" ]
      ;;
    php)
      status="$(container_health "$PHP_CONTAINER")"
      PROBE_DETAIL="container=$PHP_CONTAINER health=$status"
      [ "$status" = "healthy" ]
      ;;
    backend)
      status="$(http_status_once "$BACKEND_UP_URL")"
      PROBE_DETAIL="url=$BACKEND_UP_URL status=$status"
      [ "$status" -ge 200 ] && [ "$status" -lt 400 ]
      ;;
    admin)
      status="$(http_status_once "$ADMIN_HEALTH_URL")"
      PROBE_DETAIL="url=$ADMIN_HEALTH_URL status=$status"
      [ "$status" -ge 200 ] && [ "$status" -lt 400 ]
      ;;
    api)
      status="$(http_status_once "$API_HEALTH_URL")"
      PROBE_DETAIL="url=$API_HEALTH_URL status=$status"
      [ "$status" -ge 200 ] && [ "$status" -lt 400 ]
      ;;
    *)
      PROBE_DETAIL="unsupported-domain=$domain"
      return 1
      ;;
  esac
}

run_domain_repair() {
  local domain="$1"
  local args=("$INFRA_ROOT/repair/repair-health.sh" "$domain")

  if [ "$DRY_RUN" = "1" ]; then
    args+=(--dry-run)
  fi

  case "$domain" in
    nginx|php|backend|admin)
      "${args[@]}"
      ;;
    api)
      return 2
      ;;
    *)
      return 2
      ;;
  esac
}

close_domain_incident() {
  local domain="$1"
  local success_reason="$2"
  local previous_phase
  local active_since
  local repair_attempts
  local duration

  previous_phase="$(health_state_get "$domain" phase healthy)"
  active_since="$(health_state_get "$domain" active_since 0)"
  repair_attempts="$(health_state_get "$domain" repair_attempts 0)"
  duration=0
  if [ "$active_since" -gt 0 ] 2>/dev/null; then
    duration=$(( $(now_epoch) - active_since ))
  fi

  log_action "health[$domain] recovered phase=$previous_phase attempts=$repair_attempts duration=${duration}s $success_reason"
  if [ "$repair_attempts" -gt 0 ] 2>/dev/null; then
    notify_info "$SCRIPT_ID" "$WATCHDOG_ACTION" "$(reason_code "$domain" AUTO_RECOVERED)" \
      "domain=$domain восстановлен автоматически; previous_phase=$previous_phase; duration=${duration}s; $success_reason"
  else
    notify_info "$SCRIPT_ID" "$WATCHDOG_ACTION" "$(reason_code "$domain" RECOVERED)" \
      "domain=$domain снова healthy; previous_phase=$previous_phase; duration=${duration}s; $success_reason"
  fi

  reset_health_domain_incident "$SCRIPT_ID" "$domain"
}

handle_domain_success() {
  local domain="$1"
  local success_reason="$2"

  if health_state_has_incident "$domain"; then
    close_domain_incident "$domain" "$success_reason"
  fi
}

handle_domain_failure() {
  local domain="$1"
  local fail_reason="$2"
  local fail_count
  local fail_threshold
  local phase
  local repair_attempts
  local max_repairs
  local cooldown_until
  local cooldown_seconds
  local now
  local next_attempt_at

  now="$(now_epoch)"
  fail_count="$(health_state_get "$domain" fail_count 0)"
  fail_count=$((fail_count + 1))
  fail_threshold="$(domain_fail_threshold "$domain")"
  phase="$(health_state_get "$domain" phase healthy)"
  repair_attempts="$(health_state_get "$domain" repair_attempts 0)"
  max_repairs="$(domain_max_repairs "$domain")"
  cooldown_until="$(health_state_get "$domain" cooldown_until 0)"
  cooldown_seconds="$(domain_cooldown "$domain")"

  health_state_set "$domain" fail_count "$fail_count"
  if [ "$(health_state_get "$domain" active_since 0)" = "0" ]; then
    health_state_set "$domain" active_since "$now"
  fi
  health_state_set "$domain" phase degraded
  health_state_set "$domain" last_failure_reason "$fail_reason"

  log_action "health[$domain] fail_count=$fail_count phase=$phase repairs=$repair_attempts $fail_reason"

  if [ "$fail_count" -eq 1 ]; then
    notify_error_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "$(reason_code "$domain" DEGRADED)" \
      "domain=$domain перешёл в degraded; $fail_reason"
    return 0
  fi

  if [ "$max_repairs" -le 0 ]; then
    health_state_set "$domain" phase manual_required
    notify_error_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "$(reason_code "$domain" MANUAL_REQUIRED)" \
      "domain=$domain требует ручной диагностики; автопочинка отключена; $fail_reason"
    return 0
  fi

  if [ "$repair_attempts" -ge "$max_repairs" ]; then
    health_state_set "$domain" phase manual_required
    notify_error_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "$(reason_code "$domain" MANUAL_REQUIRED)" \
      "domain=$domain всё ещё болеет после ${repair_attempts} попыток автопочинки; требуется ручное вмешательство; $fail_reason"
    return 0
  fi

  if [ "$cooldown_until" -gt "$now" ]; then
    health_state_set "$domain" phase cooldown
    notify_error_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "$(reason_code "$domain" REPAIR_SKIPPED)" \
      "domain=$domain остаётся degraded; автопочинка отложена до epoch=$cooldown_until; $fail_reason"
    return 0
  fi

  if [ "$fail_count" -lt "$fail_threshold" ]; then
    return 0
  fi

  repair_attempts=$((repair_attempts + 1))
  health_state_set "$domain" repair_attempts "$repair_attempts"
  health_state_set "$domain" phase repairing
  notify_info_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "$(reason_code "$domain" AUTO_REPAIR_STARTED)" \
    "domain=$domain, attempt=$repair_attempts из $max_repairs; запускаю автопочинку"

  if run_domain_repair "$domain"; then
    if probe_domain_after_repair "$domain"; then
      close_domain_incident "$domain" "$PROBE_DETAIL"
      return 0
    fi
  fi

  if [ "$repair_attempts" -ge "$max_repairs" ]; then
    health_state_set "$domain" phase manual_required
    notify_error_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "$(reason_code "$domain" MANUAL_REQUIRED)" \
      "domain=$domain не восстановлен после ${repair_attempts} попыток автопочинки; требуется ручное вмешательство; $PROBE_DETAIL"
    return 0
  fi

  next_attempt_at=$((now + cooldown_seconds))
  health_state_set "$domain" phase cooldown
  health_state_set "$domain" cooldown_until "$next_attempt_at"
  notify_error_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "$(reason_code "$domain" REPAIR_FAILED)" \
    "domain=$domain не восстановлен автопочинкой; attempt=$repair_attempts из $max_repairs; следующий автоматический retry после epoch=$next_attempt_at; $PROBE_DETAIL"
}

handle_host_failure() {
  local load="$1"
  local ram="$2"
  local host_reason="$3"
  local fail_count
  local last_reboot
  local now

  [ -f "$RESOURCE_STATE" ] || echo "0" > "$RESOURCE_STATE"
  fail_count="$(cat "$RESOURCE_STATE" 2>/dev/null || echo 0)"
  fail_count=$((fail_count + 1))
  if [ "$DRY_RUN" = "1" ]; then
    dry_run_log "write host fail count=$fail_count to $RESOURCE_STATE"
  else
    echo "$fail_count" > "$RESOURCE_STATE"
  fi

  log_action "WARN host fail=$fail_count load=$load ram=$ram reason=$host_reason"

  if [ "$fail_count" -le "$MAX_STAGE1" ]; then
    if docker_available && container_exists "$WEB_CONTAINER"; then
      log_action "stage1: docker restart $WEB_CONTAINER"
      run_cmd docker restart "$WEB_CONTAINER" >/dev/null 2>&1 || true
    else
      log_action "stage1: container missing -> start compose unit"
      run_cmd systemctl start "$COMPOSE_UNIT" >/dev/null 2>&1 || true
    fi
    notify_error_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "WATCHDOG_STAGE1_RESTART" \
      "stage1 restart, fail=$fail_count, load=$load, ram=$ram, reason=$host_reason"
    return 0
  fi

  if [ "$fail_count" -le "$MAX_STAGE2" ]; then
    log_action "stage2: systemctl restart $COMPOSE_UNIT"
    run_cmd systemctl restart "$COMPOSE_UNIT" >/dev/null 2>&1 || true
    notify_error_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "WATCHDOG_STAGE2_SYSTEMD_RESTART" \
      "stage2 systemd restart, fail=$fail_count, load=$load, ram=$ram, reason=$host_reason"
    return 0
  fi

  last_reboot=0
  [ -f "$REBOOT_STATE" ] && last_reboot="$(cat "$REBOOT_STATE" 2>/dev/null || echo 0)"
  now="$(now_epoch)"

  if [ $((now - last_reboot)) -lt "$REBOOT_COOLDOWN" ]; then
    log_action "stage3: reboot skipped (cooldown)"
    notify_error_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "WATCHDOG_STAGE3_REBOOT_SKIPPED" \
      "stage3 reboot skipped by cooldown, fail=$fail_count, reason=$host_reason"
    return 0
  fi

  if [ "$DRY_RUN" = "1" ]; then
    dry_run_log "echo $now > $REBOOT_STATE"
  else
    echo "$now" > "$REBOOT_STATE"
  fi
  log_action "stage3: reboot now"
  notify_error_once "$SCRIPT_ID" "$WATCHDOG_ACTION" "WATCHDOG_STAGE3_REBOOT_NOW" \
    "stage3 reboot now, fail=$fail_count, load=$load, ram=$ram, reason=$host_reason"
  run_cmd /sbin/reboot || true
}

reset_host_failure_state() {
  if [ -f "$RESOURCE_STATE" ] && [ "$(cat "$RESOURCE_STATE" 2>/dev/null || echo 0)" != "0" ]; then
    if [ "$DRY_RUN" = "1" ]; then
      dry_run_log "echo 0 > $RESOURCE_STATE"
    else
      echo "0" > "$RESOURCE_STATE"
    fi
  fi
  clear_notification_locks_by_prefix "$SCRIPT_ID" "WATCHDOG_STAGE"
}

UP="$(uptime_s)"
if [ "$UP" -lt "$BOOT_GRACE" ]; then
  log_action "[watchdog] skip reason=boot_grace"
  exit 0
fi

LOAD="$(load_1m)"
RAM="$(ram_used_pct)"
HOST_REASON=""

log_action "[watchdog] start"

if ! docker_available; then
  HOST_REASON="docker command unavailable"
elif float_gt "$LOAD" "$LOAD_LIMIT"; then
  HOST_REASON="load $LOAD > limit $LOAD_LIMIT"
elif [ "$RAM" -ge "$RAM_LIMIT" ]; then
  HOST_REASON="ram ${RAM}% >= limit ${RAM_LIMIT}%"
fi

NGINX_STATUS="skipped"
PHP_STATUS="skipped"
BACKEND_STATUS="skipped"
ADMIN_STATUS="skipped"
API_STATUS="skipped"
OVERALL_HEALTH="healthy"

if [ -n "$HOST_REASON" ]; then
  OVERALL_HEALTH="degraded"
  append_metrics "$(now_iso) load=$LOAD ram=$RAM health=$OVERALL_HEALTH nginx=$NGINX_STATUS php=$PHP_STATUS backend=$BACKEND_STATUS admin=$ADMIN_STATUS api=$API_STATUS host=resource-failure"
  if [ -x "$INFRA_ROOT/observability/application/metrics-export.sh" ]; then
    if ! "$INFRA_ROOT/observability/application/metrics-export.sh" >/dev/null 2>&1; then
      log_action "notify metrics export failed"
      notify_info "$SCRIPT_ID" "$WATCHDOG_ACTION" "WATCHDOG_METRICS_EXPORT_FAILED" "не удалось обновить infrastructure/observability/application/metrics/data.json"
    fi
  fi
  handle_host_failure "$LOAD" "$RAM" "$HOST_REASON"
  log_watchdog_end '{"code":"HOST_FAILED","detail":"'"${HOST_REASON//\"/\\\"}"'"}' || true
  exit 0
fi

reset_host_failure_state

probe_domain nginx && NGINX_STATUS="healthy" || NGINX_STATUS="failed"
log_action "[watchdog] check nginx=$NGINX_STATUS"
if [ "$NGINX_STATUS" = "healthy" ]; then
  handle_domain_success nginx "$PROBE_DETAIL"
else
  OVERALL_HEALTH="degraded"
  handle_domain_failure nginx "$PROBE_DETAIL"
fi

if [ "$NGINX_STATUS" != "healthy" ]; then
  append_metrics "$(now_iso) load=$LOAD ram=$RAM health=$OVERALL_HEALTH nginx=$NGINX_STATUS php=$PHP_STATUS backend=$BACKEND_STATUS admin=$ADMIN_STATUS api=$API_STATUS"
  if [ -x "$INFRA_ROOT/observability/application/metrics-export.sh" ]; then
    if ! "$INFRA_ROOT/observability/application/metrics-export.sh" >/dev/null 2>&1; then
      log_action "notify metrics export failed"
      notify_info "$SCRIPT_ID" "$WATCHDOG_ACTION" "WATCHDOG_METRICS_EXPORT_FAILED" "не удалось обновить infrastructure/observability/application/metrics/data.json"
    fi
  fi
  log_watchdog_end '{"code":"NGINX_FAILED","detail":"'"${PROBE_DETAIL//\"/\\\"}"'"}' || true
  exit 0
fi

probe_domain php && PHP_STATUS="healthy" || PHP_STATUS="failed"
log_action "[watchdog] check php=$PHP_STATUS"
if [ "$PHP_STATUS" = "healthy" ]; then
  handle_domain_success php "$PROBE_DETAIL"
else
  OVERALL_HEALTH="degraded"
  handle_domain_failure php "$PROBE_DETAIL"
fi

if [ "$PHP_STATUS" != "healthy" ]; then
  append_metrics "$(now_iso) load=$LOAD ram=$RAM health=$OVERALL_HEALTH nginx=$NGINX_STATUS php=$PHP_STATUS backend=$BACKEND_STATUS admin=$ADMIN_STATUS api=$API_STATUS"
  if [ -x "$INFRA_ROOT/observability/application/metrics-export.sh" ]; then
    if ! "$INFRA_ROOT/observability/application/metrics-export.sh" >/dev/null 2>&1; then
      log_action "notify metrics export failed"
      notify_info "$SCRIPT_ID" "$WATCHDOG_ACTION" "WATCHDOG_METRICS_EXPORT_FAILED" "не удалось обновить infrastructure/observability/application/metrics/data.json"
    fi
  fi
  log_watchdog_end '{"code":"PHP_FAILED","detail":"'"${PROBE_DETAIL//\"/\\\"}"'"}' || true
  exit 0
fi

probe_domain backend && BACKEND_STATUS="healthy" || BACKEND_STATUS="failed"
log_action "[watchdog] check backend=$BACKEND_STATUS"
if [ "$BACKEND_STATUS" = "healthy" ]; then
  handle_domain_success backend "$PROBE_DETAIL"
else
  OVERALL_HEALTH="degraded"
  handle_domain_failure backend "$PROBE_DETAIL"
fi

if [ "$BACKEND_STATUS" != "healthy" ]; then
  append_metrics "$(now_iso) load=$LOAD ram=$RAM health=$OVERALL_HEALTH nginx=$NGINX_STATUS php=$PHP_STATUS backend=$BACKEND_STATUS admin=$ADMIN_STATUS api=$API_STATUS"
  if [ -x "$INFRA_ROOT/observability/application/metrics-export.sh" ]; then
    if ! "$INFRA_ROOT/observability/application/metrics-export.sh" >/dev/null 2>&1; then
      log_action "notify metrics export failed"
      notify_info "$SCRIPT_ID" "$WATCHDOG_ACTION" "WATCHDOG_METRICS_EXPORT_FAILED" "не удалось обновить infrastructure/observability/application/metrics/data.json"
    fi
  fi
  log_watchdog_end '{"code":"BACKEND_FAILED","detail":"'"${PROBE_DETAIL//\"/\\\"}"'"}' || true
  exit 0
fi

probe_domain admin && ADMIN_STATUS="healthy" || ADMIN_STATUS="failed"
log_action "[watchdog] check admin=$ADMIN_STATUS"
ADMIN_PROBE_DETAIL="$PROBE_DETAIL"
if [ "$ADMIN_STATUS" = "healthy" ]; then
  handle_domain_success admin "$PROBE_DETAIL"
else
  OVERALL_HEALTH="degraded"
  handle_domain_failure admin "$PROBE_DETAIL"
fi

probe_domain api && API_STATUS="healthy" || API_STATUS="failed"
log_action "[watchdog] check api=$API_STATUS"
if [ "$API_STATUS" = "healthy" ]; then
  handle_domain_success api "$PROBE_DETAIL"
else
  OVERALL_HEALTH="degraded"
  handle_domain_failure api "$PROBE_DETAIL"
fi

append_metrics "$(now_iso) load=$LOAD ram=$RAM health=$OVERALL_HEALTH nginx=$NGINX_STATUS php=$PHP_STATUS backend=$BACKEND_STATUS admin=$ADMIN_STATUS api=$API_STATUS"
if [ -x "$INFRA_ROOT/observability/application/metrics-export.sh" ]; then
  if ! "$INFRA_ROOT/observability/application/metrics-export.sh" >/dev/null 2>&1; then
    log_action "notify metrics export failed"
    notify_info "$SCRIPT_ID" "$WATCHDOG_ACTION" "WATCHDOG_METRICS_EXPORT_FAILED" "не удалось обновить infrastructure/observability/application/metrics/data.json"
  fi
fi

WATCHDOG_END_ERRORS=""
if [ "$ADMIN_STATUS" != "healthy" ]; then
  WATCHDOG_END_ERRORS='{"code":"ADMIN_FAILED","detail":"'"${ADMIN_PROBE_DETAIL//\"/\\\"}"'"}'"${WATCHDOG_END_ERRORS:+,$WATCHDOG_END_ERRORS}"
fi
if [ "$API_STATUS" != "healthy" ]; then
  WATCHDOG_END_ERRORS='{"code":"API_FAILED","detail":"'"${PROBE_DETAIL//\"/\\\"}"'"}'"${WATCHDOG_END_ERRORS:+,$WATCHDOG_END_ERRORS}"
fi
log_watchdog_end "$WATCHDOG_END_ERRORS" || true

exit 0
