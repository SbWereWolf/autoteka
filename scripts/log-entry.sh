#!/usr/bin/env bash
set -euo pipefail

warn() {
  echo "[warn] $*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  bash ./scripts/log-entry.sh \
    --type <UserMessage|ProposedPlan|FinalAnswer> \
    --message "<markdown>" \
    --ai-system-name "<name>" \
    --llm-name "<name>" \
    [--log-filename "<existing-file>"]
EOF
}

TYPE=""
MESSAGE=""
AI_SYSTEM_NAME=""
LLM_NAME=""
LOG_FILENAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --type) TYPE="${2:-}"; shift 2 ;;
    --message) MESSAGE="${2:-}"; shift 2 ;;
    --ai-system-name) AI_SYSTEM_NAME="${2:-}"; shift 2 ;;
    --llm-name) LLM_NAME="${2:-}"; shift 2 ;;
    --log-filename) LOG_FILENAME="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "$TYPE" || -z "$MESSAGE" || -z "$AI_SYSTEM_NAME" || -z "$LLM_NAME" ]]; then
  echo "Missing required arguments." >&2
  usage
  exit 2
fi

case "$TYPE" in
  UserMessage) SECTION="Запрос пользователя" ;;
  ProposedPlan) SECTION="Предложенный план" ;;
  FinalAnswer) SECTION="Доклад" ;;
  *) echo "Invalid --type: $TYPE" >&2; exit 2 ;;
esac

repo_root="$(pwd)"
logs_root="$repo_root/logs"
mkdir -p "$logs_root"

daily_dir_from_epoch() {
  local ts="$1"
  local y m d
  y="$(date -d "@$ts" +%Y)"
  m="$(date -d "@$ts" +%m)"
  d="$(date -d "@$ts" +%d)"
  echo "$logs_root/$y/$m/$d"
}

generate_filename() {
  local ts rand
  ts="$(date -u +%s)"
  while :; do
    rand="$((1111 + RANDOM % 8889))"
    candidate="${ts}-${rand}-${AI_SYSTEM_NAME}-${LLM_NAME}.md"
    if [[ ! -e "$1/$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
}

if [[ -z "$LOG_FILENAME" ]]; then
  now_ts="$(date -u +%s)"
  daily_dir="$(daily_dir_from_epoch "$now_ts")"
  mkdir -p "$daily_dir"
  LOG_FILENAME="$(generate_filename "$daily_dir")"
  target_file="$daily_dir/$LOG_FILENAME"
  : > "$target_file"
else
  LOG_FILENAME="$(basename "$LOG_FILENAME")"
  if [[ "$LOG_FILENAME" =~ ^([0-9]+)- ]]; then
    ts="${BASH_REMATCH[1]}"
  else
    ts="$(date -u +%s)"
  fi
  daily_dir="$(daily_dir_from_epoch "$ts")"
  mkdir -p "$daily_dir"
  target_file="$daily_dir/$LOG_FILENAME"
  [[ -e "$target_file" ]] || : > "$target_file"
fi

if [[ ! -s "$target_file" ]]; then
  stamp="$(date +%Y-%m-%dT%H:%M:%S%:z)"
  printf '# %s\n\n' "$stamp" >> "$target_file"
fi

{
  printf '## %s\n' "$SECTION"
  printf '%s\n\n' "$MESSAGE"
} >> "$target_file"

if [[ -x "$repo_root/lint/lint.sh" ]]; then
  if ! bash "$repo_root/lint/lint.sh" -Path "$target_file" -Mode Warn >/tmp/log-entry-lint.out 2>&1; then
    warn "Линтер вернул ошибку для $target_file"
    sed -n '1,80p' /tmp/log-entry-lint.out >&2 || true
  fi
else
  warn "Линтер не найден: $repo_root/lint/lint.sh"
fi

echo "$LOG_FILENAME"
