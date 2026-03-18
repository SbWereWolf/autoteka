#!/usr/bin/env bash
set -euo pipefail

# Backup deploy settings: env, systemd, docker, fail2ban, logrotate + app data.
# Creates up to three tar.gz archives (root, autoteka, infra) from glob rules.
# Runtime health incident state is intentionally NOT included (excluded via rules).

# exit codes: 0=ok, 1=error, 2=args validation failed, 3=missing dependency

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../init-roots.sh"
autoteka_init_roots "$@"
set -- "${AUTOTEKA_ARGS[@]}"

# Загрузить options.env для STORAGE_BACKUP_RETENTION_DAYS
if [ -n "${AUTOTEKA_OPTIONS_FILE:-}" ] && [ -f "$AUTOTEKA_OPTIONS_FILE" ]; then
  set -a
  source "$AUTOTEKA_OPTIONS_FILE" 2>/dev/null || true
  set +a
fi

OUTPUT_DIR="/root"
DRY_RUN="no"
CONFIG_DIR="$INFRA_ROOT/maintenance/config"

usage() {
  cat <<'USAGE'
Usage:
  sudo "$INFRA_ROOT"/maintenance/backup.sh [--output-dir=PATH] [--dry-run]

Purpose:
  Create backup archives from glob rules (backup-rules-*.txt).
  Up to three archives: root (/), autoteka ($AUTOTEKA_ROOT), infra ($INFRA_ROOT).

Options:
  --output-dir=PATH   Directory for .tar.gz archives. Default: /root
  --dry-run           List files only, do not create archives.
  -h, --help          Show this help.

Archives created (when rules match):
  autoteka-backup-root-YYYYMMDD-HHMMSS.tar.gz
  autoteka-backup-autoteka-YYYYMMDD-HHMMSS.tar.gz
  autoteka-backup-infra-YYYYMMDD-HHMMSS.tar.gz

WARNING: Archives contain secrets. Store securely, do not commit to git.
USAGE
}

while [ "${1:-}" != "" ]; do
  case "$1" in
    --output-dir=*)
      OUTPUT_DIR="${1#--output-dir=}"
      shift
      ;;
    --dry-run)
      DRY_RUN="yes"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

if [ -z "${STORAGE_BACKUP_RETENTION_DAYS:-}" ]; then
  echo "STORAGE_BACKUP_RETENTION_DAYS не задан в options.env." >&2
  exit 3
fi
RETENTION_DAYS="$STORAGE_BACKUP_RETENTION_DAYS"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
say() { printf '>>> %s\n' "$*"; }

# --- backup_glob logic (inlined) ---
trim() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

normalize_rule() {
  local s="$1"
  while [[ "$s" == /* ]]; do s="${s#/}"; done
  printf '%s' "$s"
}

backup_from_rules() {
  local root="$1" rules_file="$2" archive_path="$3" dry="$4"
  local -A selected=()
  local -a order=()
  local effective_rules=0 line mode rule m p
  local -a matches=()
  local saved_pwd="$PWD"

  [[ -f "$rules_file" ]] || return 0
  [[ -r "$rules_file" ]] || return 0

  shopt -s extglob globstar nullglob dotglob globskipdots 2>/dev/null || true
  cd "$root" || { cd "$saved_pwd" 2>/dev/null || true; return 1; }

  while IFS= read -r raw_line || [[ -n "${raw_line:-}" ]]; do
    raw_line="${raw_line%$'\r'}"
    line=$(trim "$raw_line")
    [[ -n "$line" ]] || continue

    if [[ "${line:0:2}" == '\#' ]]; then
      mode=include
      rule="${line:1}"
    elif [[ "${line:0:1}" == '#' ]]; then
      continue
    elif [[ "${line:0:2}" == '\!' ]]; then
      mode=include
      rule="${line:1}"
    elif [[ "${line:0:2}" == '!(' ]]; then
      mode=include
      rule="$line"
    elif [[ "${line:0:1}" == '!' ]]; then
      mode=exclude
      rule="${line:1}"
    else
      mode=include
      rule="$line"
    fi

    rule=$(trim "$rule")
    [[ -n "$rule" ]] || continue
    rule=$(normalize_rule "$rule")
    [[ -n "$rule" ]] || continue

    ((effective_rules += 1)) || true
    mapfile -t matches < <(compgen -G "$rule" 2>/dev/null || true)

    if [[ "$mode" == "include" ]]; then
      for m in "${matches[@]}"; do
        selected["$m"]=1
        order+=("$m")
      done
    else
      for m in "${matches[@]}"; do
        unset 'selected[$m]' 2>/dev/null || true
      done
    fi
  done < "$rules_file"

  shopt -u extglob globstar nullglob dotglob globskipdots 2>/dev/null || true
  cd "$saved_pwd" 2>/dev/null || true

  if (( effective_rules == 0 )); then
    say "skip (no rules): $rules_file"
    return 0
  fi

  if (( ${#selected[@]} == 0 )); then
    say "skip (no matches): $rules_file"
    return 0
  fi

  if [[ "$dry" == "yes" ]]; then
    for p in "${order[@]}"; do
      [[ -v selected["$p"] ]] || continue
      printf '%s\n' "$p"
    done
    return 0
  fi

  mkdir -p "$(dirname "$archive_path")"
  local -a tar_args=(--create --gzip --file "$archive_path" --directory "$root" --no-recursion --null --verbatim-files-from --files-from=-)

  for p in "${order[@]}"; do
    [[ -v selected["$p"] ]] || continue
    printf '%s\0' "$p"
  done | tar "${tar_args[@]}"
  say "created: $archive_path"
  return 0
}

# --- main ---
say "Backup (dry-run=$DRY_RUN, output-dir=$OUTPUT_DIR)"

rules_file() {
  local base="$1"
  if [[ -f "$CONFIG_DIR/$base.txt" ]]; then
    printf '%s' "$CONFIG_DIR/$base.txt"
  else
    printf ''
  fi
}

RULES_ROOT=$(rules_file "backup-rules-root")
RULES_AUTOTEKA=$(rules_file "backup-rules-autoteka")
RULES_INFRA=$(rules_file "backup-rules-infra")

[[ -z "$RULES_ROOT" ]] \
&& echo "Предупреждение: backup-rules-root.txt не найден, архивация root пропущена." >&2

[[ -z "$RULES_AUTOTEKA" ]] \
&& echo "Предупреждение: backup-rules-autoteka.txt не найден, архивация autoteka пропущена." >&2

[[ -z "$RULES_INFRA" ]] \
&& echo "Предупреждение: backup-rules-infra.txt не найден, архивация infra пропущена." >&2

if [[ "$DRY_RUN" == "yes" ]]; then
  [[ -n "$RULES_ROOT" ]] && { say "--- root (/) ---"; backup_from_rules "/" "$RULES_ROOT" "" "yes" || true; }
  [[ -n "$RULES_AUTOTEKA" ]] && { say "--- autoteka ($AUTOTEKA_ROOT) ---"; backup_from_rules "$AUTOTEKA_ROOT" "$RULES_AUTOTEKA" "" "yes" || true; }
  [[ -n "$RULES_INFRA" ]] && { say "--- infra ($INFRA_ROOT) ---"; backup_from_rules "$INFRA_ROOT" "$RULES_INFRA" "" "yes" || true; }
  exit 0
fi

ARCH_ROOT="$OUTPUT_DIR/autoteka-backup-root-$TIMESTAMP.tar.gz"
ARCH_AUTOTEKA="$OUTPUT_DIR/autoteka-backup-autoteka-$TIMESTAMP.tar.gz"
ARCH_INFRA="$OUTPUT_DIR/autoteka-backup-infra-$TIMESTAMP.tar.gz"

[[ -n "$RULES_ROOT" ]] && backup_from_rules "/" "$RULES_ROOT" "$ARCH_ROOT" "no" || true
[[ -n "$RULES_AUTOTEKA" ]] && backup_from_rules "$AUTOTEKA_ROOT" "$RULES_AUTOTEKA" "$ARCH_AUTOTEKA" "no" || true
[[ -n "$RULES_INFRA" ]] && backup_from_rules "$INFRA_ROOT" "$RULES_INFRA" "$ARCH_INFRA" "no" || true

# Удалить архивы старше RETENTION_DAYS дней (по дате модификации файла)
if [ -d "$OUTPUT_DIR" ] && [ "$RETENTION_DAYS" -gt 0 ] 2>/dev/null; then
  while IFS= read -r -d '' f; do
    [ -f "$f" ] || continue
    rm -f "$f"
    say "removed old: $f"
  done < <(find "$OUTPUT_DIR" -maxdepth 1 -name "autoteka-backup-*-*.tar.gz" -mtime "+${RETENTION_DAYS}" -print0 2>/dev/null || true)
fi

echo
echo "Backup completed. Archives in: $OUTPUT_DIR"
echo "WARNING: Archives contain secrets. Store securely, do not commit to git."
