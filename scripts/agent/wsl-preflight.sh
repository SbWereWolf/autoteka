#!/usr/bin/env bash
# Pre-check перед тестированием на WSL.
# Проверяет зависимости и конфигурацию. Включён в типичный план тестирования.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${AUTOTEKA_ROOT:-$(cd -- "$SCRIPT_DIR/../.." && pwd)}"
FAILED=0

check() {
  local name="$1" cmd="$2" expected="${3:-0}"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  [OK] $name"
    return 0
  else
    echo "  [FAIL] $name"
    FAILED=1
    return 1
  fi
}

echo ">>> WSL preflight"
echo ""

echo "1. Системные зависимости"
check "WSL2" "wsl.exe --version 2>/dev/null || uname -r | grep -q Microsoft" || true
check "Docker" "docker compose version"
check "curl" "curl --version"
check "Node.js" "node --version"
check "npm" "npm --version"
check "bash" "bash --version"

echo ""
echo "2. Systemd (опционально для install.sh)"
if systemctl is-active docker >/dev/null 2>&1; then
  echo "  [OK] systemd + docker.service"
else
  echo "  [WARN] systemd/docker не активен. Для install.sh может потребоваться: [boot] systemd=true в ~/.wslconfig"
fi

echo ""
echo "3. Env-файлы"
if [ -f "$REPO_ROOT/system-tests/.env" ]; then
  if grep -q '^INFRA_ROOT=' "$REPO_ROOT/system-tests/.env" 2>/dev/null; then
    echo "  [OK] system-tests/.env (INFRA_ROOT задан)"
  else
    echo "  [FAIL] system-tests/.env: INFRA_ROOT не задан"
    FAILED=1
  fi
else
  echo "  [FAIL] system-tests/.env отсутствует. Выполните: bash ./scripts/swap-env.sh load -t system-tests-env"
  FAILED=1
fi

if [ -f "$REPO_ROOT/infrastructure/prod.test.env" ]; then
  echo "  [OK] infrastructure/prod.test.env"
else
  echo "  [FAIL] infrastructure/prod.test.env отсутствует. Создайте: cp infrastructure/prod.env infrastructure/prod.test.env"
  FAILED=1
fi

echo ""
echo "4. scripts/.env (для swap-env)"
if [ -f "$REPO_ROOT/scripts/.env" ]; then
  if grep -qE '^AUTOTEKA_ROOT=|^INFRA_ROOT=' "$REPO_ROOT/scripts/.env" 2>/dev/null; then
    echo "  [OK] scripts/.env"
  else
    echo "  [FAIL] scripts/.env: AUTOTEKA_ROOT или INFRA_ROOT не заданы"
    FAILED=1
  fi
else
  echo "  [FAIL] scripts/.env отсутствует"
  FAILED=1
fi

echo ""
if [ "$FAILED" -eq 1 ]; then
  echo ">>> Preflight: есть ошибки. Исправьте перед тестированием."
  exit 1
fi
echo ">>> Preflight: OK"
