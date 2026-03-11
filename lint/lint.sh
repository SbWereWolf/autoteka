#!/usr/bin/env bash
set -u

MODE="Warn"
PATHS=()

log() {
  printf '[lint] %s\n' "$1"
}

usage() {
  cat <<'USAGE'
Usage: bash ./lint/lint.sh -Path <path> [-Path <path2> ...] [-Mode Warn|Strict|DryRun]
USAGE
}

is_wsl() {
  if [[ -n "${WSL_DISTRO_NAME:-}" ]]; then
    return 0
  fi

  if [[ -r /proc/version ]] && grep -qi microsoft /proc/version; then
    return 0
  fi

  return 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="$SCRIPT_DIR/lint-rules.yml"
WIN_ENV_PATH="$SCRIPT_DIR/win.env"
WSL_ENV_PATH="$SCRIPT_DIR/wsl.env"
NIX_ENV_PATH="$SCRIPT_DIR/nix.env"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -Path)
      shift
      [[ $# -gt 0 ]] || { log "ERROR: -Path requires value"; exit 1; }
      PATHS+=("$1")
      ;;
    -Mode)
      shift
      [[ $# -gt 0 ]] || { log "ERROR: -Mode requires value"; exit 1; }
      MODE="$1"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log "ERROR: unknown arg: $1"
      usage
      exit 1
      ;;
  esac
  shift
done

case "$MODE" in
  Strict|Warn|DryRun) ;;
  *)
    log "ERROR: invalid -Mode '$MODE'"
    exit 1
    ;;
esac

if [[ ${#PATHS[@]} -eq 0 ]]; then
  log "ERROR: at least one -Path is required"
  exit 1
fi

if [[ ! -f "$CONFIG_PATH" ]]; then
  log "ERROR: lint-rules.yml not found"
  exit 1
fi

ENV_PATH=""
if [[ "$(uname -s)" == "Linux" ]] && is_wsl; then
  [[ -f "$WSL_ENV_PATH" ]] && ENV_PATH="$WSL_ENV_PATH"
elif [[ "$(uname -s)" == "Linux" ]]; then
  [[ -f "$NIX_ENV_PATH" ]] && ENV_PATH="$NIX_ENV_PATH"
else
  [[ -f "$WIN_ENV_PATH" ]] && ENV_PATH="$WIN_ENV_PATH"
fi

if [[ -n "$ENV_PATH" ]]; then
  log "Loading env: $ENV_PATH"
  # shellcheck disable=SC1090,SC1091
  set -a
  source "$ENV_PATH"
  set +a
else
  log "Env file not found, continuing with current environment"
fi

read_rules() {
  awk '
    function trim(s){gsub(/^[ \t]+|[ \t]+$/, "", s); return s}
    {
      line=$0
      if (match(line, /^  ("[^"]+"|[^[:space:]:][^:]*):[ \t]*$/)) {
        key=line
        sub(/^  /,"",key)
        sub(/:[ \t]*$/,"",key)
        gsub(/^"|"$/, "", key)
        current=tolower(key)
        in_lint=0
        in_format=0
        next
      }
      if (current == "") next
      if (match(line, /^    format:[ \t]*/)) {
        cmd=line
        sub(/^    format:[ \t]*/, "", cmd)
        cmd=trim(cmd)
        gsub(/^"|"$/, "", cmd)
        if (cmd != "") {
          print current "|format|" cmd
          in_lint=0
        } else {
          in_format=1
        }
        next
      }
      if (in_format && match(line, /^      -[ \t]*/)) {
        cmd=line
        sub(/^      -[ \t]*/, "", cmd)
        cmd=trim(cmd)
        gsub(/^"|"$/, "", cmd)
        print current "|format|" cmd
        next
      }
      if (match(line, /^    lint:[ \t]*$/)) {
        in_lint=1
        in_format=0
        next
      }
      if (in_lint && match(line, /^      -[ \t]*/)) {
        cmd=line
        sub(/^      -[ \t]*/, "", cmd)
        cmd=trim(cmd)
        gsub(/^"|"$/, "", cmd)
        print current "|lint|" cmd
        next
      }
      if (match(line, /^  /) == 0) {
        current=""
        in_lint=0
        in_format=0
      }
    }
  ' "$CONFIG_PATH"
}

RULES_CACHE="$(read_rules)"

expand_command() {
  local input="$1"
  local output="$input"
  local missing=()

  while [[ "$output" =~ \$\{([A-Za-z0-9_]+)\} ]]; do
    local var_name="${BASH_REMATCH[1]}"
    local var_val="${!var_name:-}"

    if [[ -z "$var_val" ]]; then
      local seen=0
      for v in "${missing[@]:-}"; do
        if [[ "$v" == "$var_name" ]]; then seen=1; break; fi
      done
      [[ $seen -eq 0 ]] && missing+=("$var_name")
      var_val=""
    fi

    output="${output//\$\{$var_name\}/$var_val}"
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    printf 'MISSING|%s\n' "$(IFS=,; echo "${missing[*]}")"
    return 10
  fi

  printf 'OK|%s\n' "$output"
  return 0
}

get_rule_commands() {
  local file="$1"
  local ext=".${file##*.}"
  local name
  name="$(basename "$file" | tr '[:upper:]' '[:lower:]')"

  if [[ "$file" != *.* ]]; then
    ext=""
  fi

  local matched=1
  while IFS='|' read -r key kind cmd; do
    [[ -z "$key" ]] && continue

    if [[ -n "$ext" ]]; then
      if [[ "$key" == "${ext,,}" ]]; then
        printf '%s|%s\n' "$kind" "$cmd"
        matched=0
      fi
    else
      if [[ "$key" == "$name" ]]; then
        printf '%s|%s\n' "$kind" "$cmd"
        matched=0
      fi
    fi
  done <<< "$RULES_CACHE"

  return $matched
}

run_command() {
  local cmd="$1"
  local file="$2"

  local expanded
  if ! expanded="$(expand_command "$cmd")"; then
    local missing
    missing="${expanded#MISSING|}"
    log "SKIP (empty env): $cmd | missing: $missing"
    return 0
  fi

  local final_cmd="${expanded#OK|}"
  final_cmd="$(echo "$final_cmd" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

  if [[ -z "$final_cmd" ]]; then
    log "SKIP (empty command after env expansion): $cmd"
    return 0
  fi

  if [[ "$MODE" == "DryRun" ]]; then
    log "DRYRUN: $final_cmd \"$file\""
    return 0
  fi

  log "Running: $final_cmd \"$file\""
  bash -lc "$final_cmd \"$file\""
  local ec=$?

  if [[ $ec -ne 0 ]]; then
    if [[ "$MODE" == "Strict" ]]; then
      log "ERROR: Command failed ($ec): $final_cmd \"$file\""
      return $ec
    fi
    log "WARN: Command failed ($ec): $final_cmd \"$file\""
  fi

  return 0
}

lint_file() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    log "Skipping missing file: $file"
    return 0
  fi

  local abs
  abs="$(realpath "$file" 2>/dev/null || echo "$file")"

  local cmds
  if ! cmds="$(get_rule_commands "$abs")"; then
    log "No rule for: $abs"
    return 0
  fi

  while IFS='|' read -r kind cmd; do
    [[ -z "$kind" ]] && continue
    run_command "$cmd" "$abs" || return $?
  done <<< "$cmds"

  log "OK: $abs"
  return 0
}

process_path() {
  local p="$1"

  if [[ ! -e "$p" ]]; then
    log "Skipping missing path: $p"
    return 0
  fi

  if [[ -d "$p" ]]; then
    while IFS= read -r file; do
      lint_file "$file" || return $?
    done < <(find "$p" -type f)
  else
    lint_file "$p" || return $?
  fi

  return 0
}

for path_item in "${PATHS[@]}"; do
  if ! process_path "$path_item"; then
    if [[ "$MODE" == "Strict" ]]; then
      exit 1
    fi
  fi
done

exit 0
