#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  bash ./scripts/commit-with-message.sh \
    --subject "Subject" \
    --body "Body paragraph 1" \
    [--body "Body paragraph 2"] \
    [--agent-id "assistant"] \
    [--model-name "gpt-5"]
USAGE
}

SUBJECT=""
AGENT_ID="assistant"
MODEL_NAME="gpt-5"
COMMIT_USER_NAME="assistant"
COMMIT_USER_EMAIL="assistant@local"
BODY_PARTS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --subject)
      shift
      [[ $# -gt 0 ]] || { echo "ERROR: --subject requires value"; exit 1; }
      SUBJECT="$1"
      ;;
    --body)
      shift
      [[ $# -gt 0 ]] || { echo "ERROR: --body requires value"; exit 1; }
      BODY_PARTS+=("$1")
      ;;
    --agent-id)
      shift
      [[ $# -gt 0 ]] || { echo "ERROR: --agent-id requires value"; exit 1; }
      AGENT_ID="$1"
      ;;
    --model-name)
      shift
      [[ $# -gt 0 ]] || { echo "ERROR: --model-name requires value"; exit 1; }
      MODEL_NAME="$1"
      ;;
    --commit-user-name)
      shift
      [[ $# -gt 0 ]] || { echo "ERROR: --commit-user-name requires value"; exit 1; }
      COMMIT_USER_NAME="$1"
      ;;
    --commit-user-email)
      shift
      [[ $# -gt 0 ]] || { echo "ERROR: --commit-user-email requires value"; exit 1; }
      COMMIT_USER_EMAIL="$1"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $1"
      usage
      exit 1
      ;;
  esac
  shift
done

[[ -n "$SUBJECT" ]] || { echo "ERROR: --subject is required"; exit 1; }
[[ ${#SUBJECT} -le 50 ]] || {
  echo "ERROR: subject is too long (${#SUBJECT}), max 50"
  exit 1
}
[[ ${#BODY_PARTS[@]} -gt 0 ]] || { echo "ERROR: at least one --body required"; exit 1; }

TMP_FILE=".commit-message-$(date +%s)-$RANDOM.md"

cleanup() {
  rm -f "$TMP_FILE"
}
trap cleanup EXIT

{
  printf '%s\n\n' "$SUBJECT"
  for i in "${!BODY_PARTS[@]}"; do
    part="${BODY_PARTS[$i]}"
    while IFS= read -r line; do
      if [[ -z "$line" ]]; then
        printf '\n'
      else
        printf '%s\n' "$line" | fold -s -w 70
      fi
    done <<< "$part"
    if [[ "$i" -lt $((${#BODY_PARTS[@]} - 1)) ]]; then
      printf '\n'
    fi
  done
  printf '\n'
  printf '%s\n' "Author: $AGENT_ID $MODEL_NAME" | fold -s -w 70
} > "$TMP_FILE"

npx prettier --write "$TMP_FILE"
npx markdownlint-cli --fix --disable MD041 "$TMP_FILE"
npx markdownlint-cli --disable MD041 "$TMP_FILE"
git -c "user.name=$COMMIT_USER_NAME" -c "user.email=$COMMIT_USER_EMAIL" commit -F "$TMP_FILE"
