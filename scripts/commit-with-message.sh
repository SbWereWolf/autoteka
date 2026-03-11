#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  bash ./scripts/commit-with-message.sh \
    --subject "Subject" \
    --body "Body explanation 1" \
    [--body "Body explanation 2"] \
    --ai-system-name "codex" \
    [--llm-name "gpt-5"] \
    [--dry-run]
USAGE
}

SUBJECT=""
AI_SYSTEM_NAME=""
LLM_NAME="gpt-5"
DRY_RUN="false"
BODY_PARTS=()

ensure_node_runtime() {
  if command -v node >/dev/null 2>&1; then
    return 0
  fi

  if [[ -f "$HOME/.bashrc" ]]; then
    # shellcheck disable=SC1090,SC1091
    source "$HOME/.bashrc" >/dev/null 2>&1 || true
  fi

  if command -v node >/dev/null 2>&1; then
    return 0
  fi

  if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
    # shellcheck disable=SC1090,SC1091
    source "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
    if command -v nvm >/dev/null 2>&1; then
      nvm use default >/dev/null 2>&1 || true
    fi
  fi

  if command -v node >/dev/null 2>&1; then
    return 0
  fi

  if command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env --shell bash 2>/dev/null || true)"
  fi

  if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: node is not available in PATH"
    exit 1
  fi
}

resolve_temp_dir() {
  local candidate="${TMPDIR:-}"
  if [[ -z "$candidate" ]]; then
    candidate="${TEMP:-${TMP:-/tmp}}"
  fi

  if command -v cygpath >/dev/null 2>&1; then
    if [[ "$candidate" =~ ^[A-Za-z]:\\ ]]; then
      candidate="$(cygpath -u "$candidate")"
    fi
  fi

  printf '%s' "$candidate"
}

assert_slug_part() {
  local value="$1"
  local name="$2"

  [[ -n "$value" ]] || {
    echo "ERROR: $name is required"
    exit 1
  }

  if [[ ! "$value" =~ ^[A-Za-z0-9._-]{1,64}$ ]]; then
    echo "ERROR: $name has invalid format: '$value'. Allowed: [A-Za-z0-9._-], max 64"
    exit 1
  fi
}

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
    --ai-system-name)
      shift
      [[ $# -gt 0 ]] || { echo "ERROR: --ai-system-name requires value"; exit 1; }
      AI_SYSTEM_NAME="$1"
      ;;
    --llm-name)
      shift
      [[ $# -gt 0 ]] || { echo "ERROR: --llm-name requires value"; exit 1; }
      LLM_NAME="$1"
      ;;
    --dry-run)
      DRY_RUN="true"
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

assert_slug_part "$AI_SYSTEM_NAME" "ai-system-name"
assert_slug_part "$LLM_NAME" "llm-name"
ensure_node_runtime

IDENTITY_NAME="${AI_SYSTEM_NAME}-${LLM_NAME}"
IDENTITY_EMAIL="${IDENTITY_NAME}@local"
TMP_DIR="$(resolve_temp_dir)"
TMP_FILE="$(mktemp "$TMP_DIR/commit-message-XXXXXX.md")"

if [[ -z "$TMP_FILE" || ! -f "$TMP_FILE" ]]; then
  echo "ERROR: failed to create temp commit message file"
  exit 1
fi

build_message() {
  {
    printf '%s\n\n' "$SUBJECT"
    for i in "${!BODY_PARTS[@]}"; do
      item_number=$((i + 1))
      part="${BODY_PARTS[$i]}"
      normalized_part="$(printf '%s' "$part" | tr '\n' '  ' | tr -s '[:space:]' ' ' | sed 's/^ //; s/ $//')"
      [[ -n "$normalized_part" ]] || {
        echo "ERROR: body item #$item_number is empty after normalization"
        exit 1
      }
      printf '%s\n' "${item_number}. ${normalized_part}" | fold -s -w 70
    done
    printf '%s\n' "Author: ${IDENTITY_NAME}"
  }
}

cleanup() {
  if [[ -n "${TMP_FILE:-}" && -e "$TMP_FILE" ]]; then
    rm -f "$TMP_FILE" || echo "WARN: failed to remove temp commit message file: $TMP_FILE" >&2
  fi
  return 0
}
trap cleanup EXIT

build_message > "$TMP_FILE"

npx prettier --write "$TMP_FILE"

build_message > "$TMP_FILE"

[[ -f "$TMP_FILE" ]] || {
  echo "ERROR: temp commit message file is missing before commit: $TMP_FILE"
  exit 1
}

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run mode: commit was not created."
  echo "Author: ${IDENTITY_NAME} <${IDENTITY_EMAIL}>"
  echo "Commit message:"
  cat "$TMP_FILE"
  exit 0
fi

GIT_AUTHOR_NAME="$IDENTITY_NAME" \
  GIT_AUTHOR_EMAIL="$IDENTITY_EMAIL" \
  GIT_COMMITTER_NAME="$IDENTITY_NAME" \
  GIT_COMMITTER_EMAIL="$IDENTITY_EMAIL" \
  git -c "user.name=$IDENTITY_NAME" -c "user.email=$IDENTITY_EMAIL" \
  commit --author "$IDENTITY_NAME <$IDENTITY_EMAIL>" -F "$TMP_FILE"
