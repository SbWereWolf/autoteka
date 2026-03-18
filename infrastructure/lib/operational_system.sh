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
