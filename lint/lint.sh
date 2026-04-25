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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LINT_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export LINT_REPO_ROOT
CONFIG_PATH="$SCRIPT_DIR/lint-rules.yml"
ENV_PATH="$SCRIPT_DIR/.env"

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

if [[ -n "$ENV_PATH" ]]; then
  log "Loading env: $ENV_PATH"
  # shellcheck disable=SC1090,SC1091
  set -a
  source "$ENV_PATH"
  set +a
else
  log "Env file not found, continuing with current environment"
fi

if [[ -z "${npm_config_yes:-}" ]]; then
  export npm_config_yes=true
fi

read_rules() {
  awk '
    function trim(s){gsub(/^[ \t]+|[ \t]+$/, "", s); return s}
    function unescape(s){gsub(/\\"/, "\"", s); return s}
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
        cmd=unescape(cmd)
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
        cmd=unescape(cmd)
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
        cmd=unescape(cmd)
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
  local i

  for ((i = 0; i < 10; i++)); do
    [[ "$output" =~ \$\{([A-Za-z0-9_]+)\} ]] || break
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

  while [[ "$output" =~ \$\{([A-Za-z0-9_]+)\} ]]; do
    local var_name="${BASH_REMATCH[1]}"
    local seen=0
    local v
    for v in "${missing[@]:-}"; do
      if [[ "$v" == "$var_name" ]]; then seen=1; break; fi
    done
    [[ $seen -eq 0 ]] && missing+=("$var_name")
    output="${output//\$\{$var_name\}/}"
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
  LAST_LINT_COMMAND_FAILED=0

  local expanded
  if ! expanded="$(expand_command "$cmd")"; then
    local missing
    missing="${expanded#MISSING|}"
    log "ERROR: missing required env: $missing | command: $cmd"
    return 3
  fi

  local final_cmd="${expanded#OK|}"
  final_cmd="$(echo "$final_cmd" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

  if [[ -z "$final_cmd" ]]; then
    log "ERROR: empty command after env expansion: $cmd"
    return 3
  fi

  if [[ "$MODE" == "DryRun" ]]; then
    log "DRYRUN: $final_cmd \"$file\""
    return 0
  fi

  log "Running: $final_cmd \"$file\""
  if [[ "$cmd" == *'${ESLINT_CONFIG_PATH}'* ]]; then
    (cd "$(dirname "$file")" && bash -lc "$final_cmd \"$file\"")
  else
    bash -lc "$final_cmd \"$file\""
  fi
  local ec=$?

  if [[ $ec -ne 0 ]]; then
    LAST_LINT_COMMAND_FAILED=1

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

  local had_failure=0
  while IFS='|' read -r kind cmd; do
    [[ -z "$kind" ]] && continue
    run_command "$cmd" "$abs"
    ec=$?

    if [[ $ec -eq 3 ]]; then
      return 3
    fi

    if [[ $ec -ne 0 ]]; then
      return $ec
    fi

    if [[ "$LAST_LINT_COMMAND_FAILED" == "1" ]]; then
      had_failure=1
    fi
  done <<< "$cmds"

  if [[ $had_failure -eq 1 ]]; then
    log "WARN: completed with issues: $abs"
  else
    log "OK: $abs"
  fi

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
  process_path "$path_item"
  ec=$?

  if [[ $ec -eq 3 ]]; then
    exit 3
  fi

  if [[ $ec -ne 0 && "$MODE" == "Strict" ]]; then
    exit 1
  fi
done

exit 0
