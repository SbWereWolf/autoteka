#!/usr/bin/env bash
set -euo pipefail

# Convert /var/log/server-metrics.log -> $INFRA_ROOT/observability/application/metrics/data.json
# Input format (single line):
#   2026-03-04T03:10:00+03:00 load=0.25 ram=32 health=healthy

# INFRA_ROOT и AUTOTEKA_ROOT — только из аргументов или переменных окружения
if [ -f /etc/autoteka/options.env ]; then
  set -a
  # shellcheck disable=SC1090
  source /etc/autoteka/options.env || true
  set +a
fi
export INFRA_ROOT="${INFRA_ROOT:-}"
export AUTOTEKA_ROOT="${AUTOTEKA_ROOT:-}"
if [ -z "${INFRA_ROOT}" ] || [[ "${INFRA_ROOT}" != /* ]] || \
   [ -z "${AUTOTEKA_ROOT}" ] || [[ "${AUTOTEKA_ROOT}" != /* ]]; then
  echo "INFRA_ROOT и AUTOTEKA_ROOT должны быть заданы абсолютными путями." >&2
  exit 2
fi
# shellcheck disable=SC1090
source "$INFRA_ROOT/lib/bootstrap.sh"
load_autoteka_env

INPUT="/var/log/server-metrics.log"
OUTPUT="$INFRA_ROOT/observability/application/metrics/data.json"

mkdir -p "$(dirname "$OUTPUT")"

if [ ! -f "$INPUT" ]; then
  echo "[]" > "$OUTPUT"
  exit 0
fi

tail -200 "$INPUT" | awk '
BEGIN { print "["; first=1 }
{
  ts=$1
  load="0"; ram="0"; health="unknown"
  for (i=2; i<=NF; i++) {
    split($i, kv, "=")
    if (kv[1]=="load") load=kv[2]
    if (kv[1]=="ram")  ram=kv[2]
    if (kv[1]=="health") health=kv[2]
  }
  if (!first) printf ",\n"
  first=0
  printf "{\"time\":\"%s\",\"load\":%s,\"ram\":%s,\"health\":\"%s\"}", ts, load, ram, health
}
END { print "\n]" }
' > "$OUTPUT"
