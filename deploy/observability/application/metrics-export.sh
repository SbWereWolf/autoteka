#!/usr/bin/env bash
set -euo pipefail

# Convert /var/log/server-metrics.log -> $AUTOTEKA_ROOT/deploy/observability/application/metrics/data.json
# Input format (single line):
#   2026-03-04T03:10:00+03:00 load=0.25 ram=32 health=healthy

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR" && while [ ! -f "DEPLOY.md" ] && [ "$PWD" != "/" ]; do cd ..; done; pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"
# shellcheck disable=SC1090
source "$DEPLOY_DIR/lib/bootstrap.sh"
load_autoteka_env

INPUT="/var/log/server-metrics.log"
OUTPUT="$AUTOTEKA_ROOT/deploy/observability/application/metrics/data.json"

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
