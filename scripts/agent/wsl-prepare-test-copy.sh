#!/usr/bin/env bash
# Копирует проект в изолированную папку WSL и настраивает env-файлы.
# Запускать из WSL. После копирования — тестирование из TEST_ROOT.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
TEST_ROOT="${TEST_ROOT:-/tmp/autoteka-wsl-test}"
SOURCE_DIR="${1:-$REPO_ROOT}"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "SOURCE_DIR не существует: $SOURCE_DIR" >&2
  exit 2
fi

echo ">>> Копирование $SOURCE_DIR -> $TEST_ROOT"
mkdir -p "$TEST_ROOT"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='node_modules.*' \
    --exclude='vendor' \
    --exclude='.runtime' \
    --exclude='infrastructure/.env' \
    --exclude='infrastructure/backup.env' \
    --exclude='infrastructure/prod.test.env' \
    --exclude='infrastructure/dev.test.env' \
    --exclude='scripts/.env' \
    --exclude='system-tests/.env' \
    --exclude='inbox' \
    --exclude='tasks' \
    "$SOURCE_DIR/" "$TEST_ROOT/"
else
  mkdir -p "$TEST_ROOT"
  (cd "$SOURCE_DIR" && tar cf - --exclude=.git --exclude=node_modules --exclude=vendor --exclude=.runtime --exclude=inbox --exclude=tasks . 2>/dev/null) | (cd "$TEST_ROOT" && tar xf -)
fi
rm -f "$TEST_ROOT/infrastructure/.env" "$TEST_ROOT/infrastructure/backup.env" \
      "$TEST_ROOT/infrastructure/prod.test.env" "$TEST_ROOT/infrastructure/dev.test.env" \
      "$TEST_ROOT/scripts/.env" "$TEST_ROOT/system-tests/.env" 2>/dev/null || true

AUTOTEKA_ROOT="$TEST_ROOT"
INFRA_ROOT="$TEST_ROOT/infrastructure"
RUNTIME_INSTANCE_SUFFIX="$(basename "$TEST_ROOT" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')"
RUNTIME_INSTANCE="autoteka-test-${RUNTIME_INSTANCE_SUFFIX}"

echo ">>> Создание env-файлов (AUTOTEKA_ROOT=$AUTOTEKA_ROOT)"

# infrastructure/.env для install.sh
cp -n "$INFRA_ROOT/prod.env" "$INFRA_ROOT/.env" 2>/dev/null || true
sed -i "s|^AUTOTEKA_ROOT=.*|AUTOTEKA_ROOT=$AUTOTEKA_ROOT|" "$INFRA_ROOT/.env"
sed -i "s|^INFRA_ROOT=.*|INFRA_ROOT=$INFRA_ROOT|" "$INFRA_ROOT/.env"
if grep -q '^AUTOTEKA_RUNTIME_INSTANCE=' "$INFRA_ROOT/.env"; then
  sed -i "s|^AUTOTEKA_RUNTIME_INSTANCE=.*|AUTOTEKA_RUNTIME_INSTANCE=$RUNTIME_INSTANCE|" "$INFRA_ROOT/.env"
else
  printf '%s\n' "AUTOTEKA_RUNTIME_INSTANCE=$RUNTIME_INSTANCE" >> "$INFRA_ROOT/.env"
fi

# prod.test.env — синхронизация с prod.env, пути под тестовый корень
cp "$INFRA_ROOT/prod.env" "$INFRA_ROOT/prod.test.env"
sed -i "s|^AUTOTEKA_ROOT=.*|AUTOTEKA_ROOT=$AUTOTEKA_ROOT|" "$INFRA_ROOT/prod.test.env"
sed -i "s|^INFRA_ROOT=.*|INFRA_ROOT=$INFRA_ROOT|" "$INFRA_ROOT/prod.test.env"
if grep -q '^DB_DATABASE=' "$INFRA_ROOT/prod.test.env"; then
  sed -i "s|^DB_DATABASE=.*|DB_DATABASE=../../database/database.test.sqlite|" "$INFRA_ROOT/prod.test.env"
else
  printf '%s\n' 'DB_DATABASE=../../database/database.test.sqlite' >> "$INFRA_ROOT/prod.test.env"
fi
if grep -q '^AUTOTEKA_RUNTIME_INSTANCE=' "$INFRA_ROOT/prod.test.env"; then
  sed -i "s|^AUTOTEKA_RUNTIME_INSTANCE=.*|AUTOTEKA_RUNTIME_INSTANCE=$RUNTIME_INSTANCE|" "$INFRA_ROOT/prod.test.env"
else
  printf '%s\n' "AUTOTEKA_RUNTIME_INSTANCE=$RUNTIME_INSTANCE" >> "$INFRA_ROOT/prod.test.env"
fi
if [ ! -f "$AUTOTEKA_ROOT/backend/database/database.test.sqlite" ] && [ -f "$AUTOTEKA_ROOT/backend/database/database.sqlite" ]; then
  cp "$AUTOTEKA_ROOT/backend/database/database.sqlite" "$AUTOTEKA_ROOT/backend/database/database.test.sqlite"
fi

# dev.test.env — синхронизация с dev.env
if [ -f "$INFRA_ROOT/dev.env" ]; then
  cp "$INFRA_ROOT/dev.env" "$INFRA_ROOT/dev.test.env"
  sed -i "s|^AUTOTEKA_ROOT=.*|AUTOTEKA_ROOT=$AUTOTEKA_ROOT|" "$INFRA_ROOT/dev.test.env"
  sed -i "s|^INFRA_ROOT=.*|INFRA_ROOT=$INFRA_ROOT|" "$INFRA_ROOT/dev.test.env"
  sed -i "s|^DEV_BIND_HOST=.*|DEV_BIND_HOST=127.0.0.1|" "$INFRA_ROOT/dev.test.env"
  sed -i "s|^DEV_WEB_PORT=.*|DEV_WEB_PORT=8081|" "$INFRA_ROOT/dev.test.env"
  if grep -q '^DB_DATABASE=' "$INFRA_ROOT/dev.test.env"; then
    sed -i "s|^DB_DATABASE=.*|DB_DATABASE=../../database/database.test.sqlite|" "$INFRA_ROOT/dev.test.env"
  else
    printf '%s\n' 'DB_DATABASE=../../database/database.test.sqlite' >> "$INFRA_ROOT/dev.test.env"
  fi
  if grep -q '^AUTOTEKA_RUNTIME_INSTANCE=' "$INFRA_ROOT/dev.test.env"; then
    sed -i "s|^AUTOTEKA_RUNTIME_INSTANCE=.*|AUTOTEKA_RUNTIME_INSTANCE=$RUNTIME_INSTANCE|" "$INFRA_ROOT/dev.test.env"
  else
    printf '%s\n' "AUTOTEKA_RUNTIME_INSTANCE=$RUNTIME_INSTANCE" >> "$INFRA_ROOT/dev.test.env"
  fi
fi

# scripts/.env
mkdir -p "$TEST_ROOT/scripts"
[ -f "$TEST_ROOT/scripts/.env" ] || cp "$TEST_ROOT/scripts/example.env" "$TEST_ROOT/scripts/.env"
sed -i "s|^AUTOTEKA_ROOT=.*|AUTOTEKA_ROOT=$AUTOTEKA_ROOT|" "$TEST_ROOT/scripts/.env"
sed -i "s|^INFRA_ROOT=.*|INFRA_ROOT=$INFRA_ROOT|" "$TEST_ROOT/scripts/.env"

# system-tests/nix.env и system-tests/.env
mkdir -p "$TEST_ROOT/system-tests"
cp -n "$TEST_ROOT/system-tests/example.env" "$TEST_ROOT/system-tests/nix.env" 2>/dev/null || true
printf '%s\n' "INFRA_ROOT=$INFRA_ROOT" "BASH_PATH=/usr/bin/bash" > "$TEST_ROOT/system-tests/nix.env"
cp "$TEST_ROOT/system-tests/nix.env" "$TEST_ROOT/system-tests/.env"

echo ">>> Готово. Тестовая копия: $TEST_ROOT"
echo "    cd $TEST_ROOT"
echo "    sudo ./infrastructure/bootstrap/install.sh"
