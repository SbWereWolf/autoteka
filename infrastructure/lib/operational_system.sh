#!/usr/bin/env bash
# Определение платформы (win/nix) и проверка путей.
# Используется init-roots.sh, swap-env.sh и другими bash-скриптами.
set -euo pipefail

if [ -n "${AUTOTEKA_OPERATIONAL_SYSTEM_SH:-}" ]; then
  return 0 2>/dev/null || exit 0
fi
AUTOTEKA_OPERATIONAL_SYSTEM_SH=1

autoteka_get_current_platform() {
  # Сначала OS: на Windows (в т.ч. Git Bash) пути от Node — Windows-стиль.
  if [[ -n "${OS:-}" && "$OS" == *[Ww][Ii][Nn][Dd][Oo][Ww][Ss]* ]]; then
    printf "win"
    return
  fi
  if [[ -n "${PWD:-}" && "$PWD" == /* ]]; then
    printf "nix"
    return
  fi
  printf "[operational_system] Не удалось определить платформу: задайте переменную окружения OS (со значением, содержащим Windows) или PWD (начинается с /)\n" >&2
  exit 2
}

autoteka_is_absolute_path() {
  local path="$1"
  local platform
  platform="$(autoteka_get_current_platform)"
  if [[ "$platform" == "nix" ]]; then
    [[ "$path" == /* ]]
    return
  fi
  # win: C:\ или C:/
  [[ "$path" =~ ^[A-Za-z]:[\\/] ]]
}

autoteka_path_for_test() {
  local path="$1"
  local platform
  platform="$(autoteka_get_current_platform)"
  if [[ "$platform" == "nix" ]]; then
    printf '%s' "$path"
    return
  fi
  # win: замена \ на / для надёжной работы [ -d ] в Git Bash
  printf '%s' "${path//\\//}"
}

# Временная папка ОС. Используется в install.sh для вычисления TELEGRAM_LOCK_DIR.
# Не задаётся в dev.env/prod.env: только окружение процесса или запись в $OPTIONS_FILE.
autoteka_get_os_temp_dir() {
  local platform
  platform="$(autoteka_get_current_platform)"
  if [[ "$platform" == "nix" ]]; then
    if [ -z "${TMPDIR:-}" ]; then
      cat >&2 <<'EOF'
TMPDIR не задан или пуст. Задайте переменную окружения процесса, например:
  export TMPDIR=/tmp
или
  printf '%s\n' 'TMPDIR=/путь/к/каталогу' | sudo tee -a "$OPTIONS_FILE"
EOF
      exit 3
    fi
    printf '%s' "$TMPDIR"
    return
  fi
  if [ -n "${TEMP:-}" ]; then
    printf '%s' "$TEMP"
    return
  fi
  if [ -n "${TMP:-}" ]; then
    printf '%s' "$TMP"
    return
  fi
  cat >&2 <<'EOF'
TEMP и TMP не заданы или пусты. Задайте переменные окружения процесса (cmd.exe или PowerShell).

Текущая сессия cmd.exe:
  set "TEMP=%LOCALAPPDATA%\Temp"

Текущая сессия pwsh.exe или powershell.exe:
  $env:TEMP = Join-Path $env:LOCALAPPDATA 'Temp'

Задайте значение в OPTIONS_FILE
pwsh.exe (в этой сессии должен быть задан $env:OPTIONS_FILE):
  pwsh -NoProfile -Command "Add-Content -LiteralPath $env:OPTIONS_FILE -Encoding utf8 -Value ('TEMP=' + (Join-Path $env:LOCALAPPDATA 'Temp'))"

cmd.exe (в этой сессии должна быть задана переменная OPTIONS_FILE):
  (echo TEMP=%LOCALAPPDATA%\Temp)>>"%OPTIONS_FILE%"
EOF
  exit 3
}
