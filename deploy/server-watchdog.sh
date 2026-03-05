#!/usr/bin/env bash
set -u

LOG="/var/log/server-watchdog.log"
METRIC_LOG="/var/log/server-metrics.log"
STATE="/var/lib/server-watchdog.state"
REBOOT_STATE="/var/lib/server-watchdog.reboot"

TELEGRAM_TOKEN="${TELEGRAM_TOKEN:-}"
TELEGRAM_CHAT="${TELEGRAM_CHAT:-}"

send_telegram() {
  local msg="$1"
  [ -n "${TELEGRAM_TOKEN}" ] || return 0
  [ -n "${TELEGRAM_CHAT}" ] || return 0
  curl -fsS -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage"     --data-urlencode "chat_id=${TELEGRAM_CHAT}"     --data-urlencode "text=${msg}"     >/dev/null 2>&1 || true
}

# ===== SETTINGS =====
LOAD_LIMIT="2.0"
RAM_LIMIT="90"
BOOT_GRACE=180
START_GRACE=120
MAX_STAGE1=2
MAX_STAGE2=4
MAX_STAGE3=5
REBOOT_COOLDOWN=3600

CONTAINER="vue-app"
COMPOSE_UNIT="vue-app.service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p /var/lib

log_action() { echo "$(date -Is) $*" >> "$LOG"; }

float_gt() { awk -v a="$1" -v b="$2" 'BEGIN{exit !(a>b)}'; }

container_exists() { docker inspect "$CONTAINER" >/dev/null 2>&1; }
container_running() { [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || echo false)" = "true" ]; }
container_health() {
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER" 2>/dev/null || echo "unknown"
}

uptime_s() { awk '{print int($1)}' /proc/uptime 2>/dev/null || echo 0; }

load_1m() { awk '{print $1}' /proc/loadavg 2>/dev/null || echo 0; }

ram_used_pct() {
  # returns used% (rough)
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

now_ts() { date -Is; }

# Init state
[ -f "$STATE" ] || echo "0" > "$STATE"
FAIL_COUNT="$(cat "$STATE" 2>/dev/null || echo 0)"

UP="$(uptime_s)"
if [ "$UP" -lt "$BOOT_GRACE" ]; then
  exit 0
fi

LOAD="$(load_1m)"
RAM="$(ram_used_pct)"
HEALTH="none"

if command -v docker >/dev/null 2>&1; then
  if container_exists; then
    HEALTH="$(container_health)"
  else
    HEALTH="missing"
  fi
else
  HEALTH="no-docker"
fi

# write metrics line (always)
echo "$(now_ts) load=$LOAD ram=$RAM health=$HEALTH" >> "$METRIC_LOG"
[ -x "$SCRIPT_DIR/metrics-export.sh" ] && "$SCRIPT_DIR/metrics-export.sh" >/dev/null 2>&1 || true

# Success path
if ! float_gt "$LOAD" "$LOAD_LIMIT" && [ "$RAM" -lt "$RAM_LIMIT" ] && [ "$HEALTH" != "unhealthy" ] && [ "$HEALTH" != "missing" ] && [ "$HEALTH" != "no-docker" ]; then
  echo "0" > "$STATE"
  exit 0
fi

# Failure path
FAIL_COUNT=$((FAIL_COUNT+1))
echo "$FAIL_COUNT" > "$STATE"

log_action "WARN fail=$FAIL_COUNT load=$LOAD ram=$RAM health=$HEALTH"

if [ "$FAIL_COUNT" -le "$MAX_STAGE1" ]; then
  # Stage 1: restart container
  if container_exists; then
    log_action "stage1: docker restart $CONTAINER"
    docker restart "$CONTAINER" >/dev/null 2>&1 || true
  else
    log_action "stage1: container missing -> start compose unit"
    systemctl start "$COMPOSE_UNIT" >/dev/null 2>&1 || true
  fi
  send_telegram "Watchdog: stage1 restart (fail=$FAIL_COUNT, load=$LOAD, ram=$RAM, health=$HEALTH)"
  exit 0
fi

if [ "$FAIL_COUNT" -le "$MAX_STAGE2" ]; then
  # Stage 2: restart compose unit
  log_action "stage2: systemctl restart $COMPOSE_UNIT"
  systemctl restart "$COMPOSE_UNIT" >/dev/null 2>&1 || true
  send_telegram "Watchdog: stage2 systemd restart (fail=$FAIL_COUNT, load=$LOAD, ram=$RAM, health=$HEALTH)"
  exit 0
fi

# Stage 3: reboot (rate-limited)
LAST_REBOOT=0
[ -f "$REBOOT_STATE" ] && LAST_REBOOT="$(cat "$REBOOT_STATE" 2>/dev/null || echo 0)"
NOW="$(date +%s)"

if [ $((NOW - LAST_REBOOT)) -lt "$REBOOT_COOLDOWN" ]; then
  log_action "stage3: reboot skipped (cooldown)"
  send_telegram "Watchdog: stage3 reboot skipped (cooldown) (fail=$FAIL_COUNT)"
  exit 0
fi

echo "$NOW" > "$REBOOT_STATE"
log_action "stage3: reboot now"
send_telegram "Watchdog: stage3 reboot NOW (fail=$FAIL_COUNT, load=$LOAD, ram=$RAM, health=$HEALTH)"
/sbin/reboot || true
