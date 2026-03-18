#!/usr/bin/env bash
set -euo pipefail

# Git polling watcher:
# - fetch origin/<branch>
# - if new commits -> stash local changes, reset --hard and start rollout
# - logs to /var/log/autoteka-deploy.log
# - protected from parallel runs via flock

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"
source "$INFRA_ROOT/lib/telegram.sh"
load_telegram_env

BRANCH="${BRANCH}"
REMOTE="${REMOTE}"
LOG="/var/log/autoteka-deploy.log"
LOCK="/var/lock/autoteka-watch-changes.lock"
STATE_DIR="/var/lib"
SCRIPT_ID="watch_changes"
WATCH_ACTION="проверка изменений для раскатки"
WATCH_STAGE="инициализация"

if ! mkdir -p /var/lock /var/log /var/lib 2>/dev/null || \
   [ ! -w /var/lock ] || \
   [ ! -w /var/log ] || \
   [ ! -w /var/lib ]; then
  RUNTIME_DIR="${AUTOTEKA_ROOT}/.runtime"
  mkdir -p "$RUNTIME_DIR/lock" "$RUNTIME_DIR/log" "$RUNTIME_DIR/lib"
  LOG="$RUNTIME_DIR/log/autoteka-deploy.log"
  LOCK="$RUNTIME_DIR/lock/autoteka-watch-changes.lock"
  STATE_DIR="$RUNTIME_DIR/lib"
fi

log() {
  echo "$(date -Is) watch: $*"
}

watch_reason_code() {
  case "$1" in
    git_fetch)
      echo "WATCH_CHANGES_FETCH_FAILED"
      ;;
    git_stash)
      echo "WATCH_CHANGES_STASH_FAILED"
      ;;
    git_stash_verify)
      echo "WATCH_CHANGES_WORKTREE_DIRTY_AFTER_STASH"
      ;;
    git_reset)
      echo "WATCH_CHANGES_RESET_FAILED"
      ;;
    deploy_start)
      echo "WATCH_CHANGES_DEPLOY_START_FAILED"
      ;;
    *)
      echo "WATCH_CHANGES_UNKNOWN_FAILED"
      ;;
  esac
}

on_watch_error() {
  local exit_code="$?"
  local reason_code

  reason_code="$(watch_reason_code "$WATCH_STAGE")"
  log "failed: stage=$WATCH_STAGE exit_code=$exit_code"
  notify_error_once "$SCRIPT_ID" "$WATCH_ACTION" "$reason_code" \
    "сбой на этапе '$WATCH_STAGE', код выхода $exit_code"

  exit "$exit_code"
}

trap on_watch_error ERR

exec 9>"$LOCK"
if ! flock -n 9; then
  exit 0
fi

{
  log "=== start ==="
  log "AUTOTEKA_ROOT=$AUTOTEKA_ROOT"

  git config --global --add safe.directory "$AUTOTEKA_ROOT" >/dev/null 2>&1 || true

  cd "$AUTOTEKA_ROOT"

  WATCH_STAGE="git_fetch"
  git fetch "$REMOTE" "$BRANCH"

  LOCAL="$(git rev-parse HEAD)"
  REMOTE_HASH="$(git rev-parse "$REMOTE/$BRANCH")"

  if [ "$LOCAL" = "$REMOTE_HASH" ]; then
    clear_script_notification_locks "$SCRIPT_ID"
    log "no changes ($LOCAL)"
    log "=== end ==="
    exit 0
  fi

  log "updating $LOCAL -> $REMOTE_HASH"

  WORKTREE_STATUS="$(git status --porcelain --untracked-files=all)"
  if [ -n "$WORKTREE_STATUS" ]; then
    STASH_MESSAGE="$(date -Is) autoteka auto deploy: очистка рабочей копии перед обновлением"

    WATCH_STAGE="git_stash"
    log "worktree is dirty; creating stash before update"
    STASH_OUTPUT="$(git stash push --include-untracked -m "$STASH_MESSAGE" 2>&1)"
    log "git stash result: $STASH_OUTPUT"

    STASH_ENTRY="$(git stash list -1 --format='%gd %cr %s')"
    if [ -n "$STASH_ENTRY" ]; then
      log "stash saved for restore: $STASH_ENTRY"
    else
      log "stash command completed without visible stash entry"
    fi

    WATCH_STAGE="git_stash_verify"
    REMAINING_STATUS="$(git status --porcelain --untracked-files=all)"
    if [ -n "$REMAINING_STATUS" ]; then
      log "worktree still dirty after stash:"
      printf '%s\n' "$REMAINING_STATUS"
      exit 1
    fi
  else
    log "worktree already clean; stash not required"
  fi

  printf '%s\n' "$LOCAL" > "$STATE_DIR/autoteka-http-prev-commit" || true

  WATCH_STAGE="git_reset"
  git reset --hard "$REMOTE/$BRANCH"

  clear_script_notification_locks "$SCRIPT_ID"

  WATCH_STAGE="deploy_start"
  log "starting rollout for $REMOTE_HASH"
  "$INFRA_ROOT/runtime/deploy.sh"

  log "rollout process finished for $REMOTE_HASH"
  log "=== end ==="
} >> "$LOG" 2>&1
