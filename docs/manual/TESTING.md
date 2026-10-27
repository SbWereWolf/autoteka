# TESTING

Документ фиксирует, как в проекте запускать тесты в изолированных
режимах, какие env/config используются и как выбирать профиль под
конкретную задачу отладки.

## 1. Базовое правило изоляции env/config

- У тестов свои env-файлы и свои конфиги.
- Тестовые раннеры не должны зависеть от runtime `.env` рабочих
  приложений.
- Линтинг использует активный `lint/.env`.
- Перед запуском verify/linters active `lint/.env` должно быть
  синхронизировано с env-specific storage текущей среды через
  `scripts/swap-env.ps1` / `scripts/swap-env.sh`.
- Перед запуском system-tests active `system-tests/.env` должно быть
  синхронизировано через `swap-env load -t system-tests-env`.
- Сам `swap-env`: он либо проверяет состояние (`validate`), либо явно
  сохраняет (`save`) / загружает (`load`) артефакты текущей среды.
- Для frontend direct checks active `frontend/node_modules` и
  `frontend/package-lock.json` должны совпадать с env-specific storage
  текущей среды; если `swap-env load` блокируется живыми `vite` или
  `npm install` процессами, сначала остановить эти процессы и только
  потом повторять `load`.

## 2. Где какие env и конфиги

### 2.1 Backend (phpunit)

- Основной конфиг тестов: `backend/apps/ShopOperator/phpunit.xml`.
- Локальный файл переменных для тестового окружения:
  `backend/apps/ShopOperator/testing.env`.
- Файл `testing.env` предназначен только для тестового контура.

### 2.2 System tests (Vitest + Playwright)

- Конфиг раннера: `system-tests/scripts/run-vitest.mjs`.
- Конфиг Vitest: `system-tests/vitest.config.ts`.
- Env для раннера: `system-tests/.env` (содержит `INFRA_ROOT`).
  Синхронизация через `swap-env load -t system-tests-env`.
- Для dev/prod профилей нужны `infrastructure/dev.test.env` и
  `infrastructure/prod.test.env` (копии из `dev.env`/`prod.env`,
  gitignored).
- Обычный `quick-dev` допускает работу по
  `backend/database/database.sqlite`.
- Для isolated copy используйте отдельный `RUN_INSTANCE`.
- В isolated copy `DB_DATABASE` должен указывать на отдельный test
  SQLite, обычно `../../database/database.test.sqlite`.
- Если `database.test.sqlite` отсутствует, создайте её копированием из
  `database.sqlite`.
- Базовый URL задаётся:
  - через `BASE_URL` в окружении;
  - или через CLI-override: `--base-url=http://127.0.0.1:8081`
    (приоритетнее чем env).

### 2.3 Frontend независимые тесты

- Unit/UI mock режимы во frontend запускаются из `frontend` и используют
  свои test-конфиги frontend без обязательного поднятия backend.
- Для текущего проекта последовательные прогоны являются дефолтом:
  parallel-варианты не использовать в dev-цикле, пока повторные замеры
  не покажут реальный выигрыш по wall-clock.

## 3. Матрица режимов запуска

Перед запуском тестов убедитесь, что у вас актуальные образы для
контейнеров Docker. Если до запуска тестов уже есть запущенные
контейнеры, то удалите их, для каждого теста (где используется Docker)
следует создавать новый набор контейнеров, после тестирования контейнеры
следует удалять.

### 3.1 quick — HTTP без браузера, LOCAL

- Назначение: максимально быстрая ручная отладка.
- Стек: без Docker, локальный сервер (`php artisan serve`), без UI
  браузера.
- Команда:

```bash
cd system-tests
npm run test:quick-local
```

Пример с URL:

```bash
BASE_URL=http://127.0.0.1:8081 npm run test:quick-local
```

### 3.2 quick — HTTP без браузера, DEV (Docker)

- Назначение: быстрая проверка dev-runtime в контейнерах.
- Стек: Docker DEV, без браузера.
- Команда:

```bash
cd system-tests
npm run test:quick-dev
```

### 3.3 ui-headless — Playwright, DEV (Docker)

- Назначение: UI регрессия в dev-окружении без видимого браузера.
- Стек: Docker DEV, Playwright headless.
- Команда:

```bash
cd system-tests
npm run test:ui-headless-dev
```

### 3.4 ui-headless — Playwright, PROD (Docker)

- Назначение: предрелизная проверка prod-runtime.
- Стек: Docker PROD, Playwright headless.
- Важно: если изменялись исходники приложения/инфраструктуры, перед
  прогоном обязателен rebuild prod-образов.
- Команда:

```bash
cd system-tests
npm run test:ui-headless-prod
```

### 3.5 ui-headed — Playwright с видимым браузером, LOCAL

- Назначение: визуальная диагностика UX/флоу локально.
- Стек: без Docker, локальный сервер, видимый браузер.
- Команда:

```bash
cd system-tests
npm run test:ui-headed-local
```

### 3.6 ui-headed — Playwright с видимым браузером, PROD (Docker)

- Назначение: UX-контроль на prod-сборке в контейнерах.
- Стек: Docker PROD, видимый браузер.
- Важно: если изменялись исходники приложения/инфраструктуры, перед
  прогоном обязателен rebuild prod-образов.
- Команда:

```bash
cd system-tests
npm run test:ui-headed-prod
```

## 4. Независимое тестирование

### 4.1 Frontend на моках (без серверной части)

```bash
cd frontend
npm run test:unit
npm run test:ui:mock
```

Рекомендуемый порядок для изменений в UI:

1. сначала обновить/написать `frontend/ui-mock` тесты;
2. получить red на текущем коде;
3. довести frontend до green в `npm run test:ui:mock`;
4. только затем переходить к живому контуру.

Если перед `npm run test:unit` или `npm run test:ui:mock` видно ошибки
вида `vitest: not found`, `playwright: not found` или
`swap-env ... frontend-node-modules: different`, это означает не
кодовую, а env проблему. В таком случае сначала восстановить frontend
env через `pwsh scripts/swap-env.ps1 load`.

Для `frontend/ui-mock` текущий стабильный browser profile — `chromium`.
Навигация в mock-suite намеренно ждёт `domcontentloaded`, а не полный
`load`, потому что это устраняет ложные timeout-падения dev-server
harness при первом открытии страницы и не ослабляет сами UI-assertions.

Если `npm --prefix system-tests run test:quick-dev` или
`test:ui-headless-dev` зависают на dev-runtime, а
`docker logs autoteka-dev-frontend` показывает
`Cannot find package 'vite-plugin-vue-devtools'`, проблема не в UI-коде,
а в stale docker volume `/workspace/frontend/node_modules`. В этом
случае надо пересобрать dev frontend image и дать entrypoint заново
выполнить `npm ci` для container-local зависимостей.

### 4.2 Backend по HTTP (без клиентской части)

Локально (без Docker):

```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8081
```

В отдельной сессии:

```bash
cd system-tests
npm run test:quick-local -- --base-url=http://127.0.0.1:8081
```

## 5. Зависимое (сквозное) тестирование и совместная отладка JS+PHP

Цель: одновременно отлаживать frontend и backend.

Для кросс-рантайм изменений использовать такой порядок:

1. заранее написать `system-tests` под новое поведение;
2. подтвердить, что до реализации они падают;
3. сначала добиться green на mock/backend-слое;
4. затем довести живой frontend+backend до green в `system-tests`.

Локальный вариант:

1. Поднять backend локально (`php artisan serve`).
2. Поднять frontend (`npm run dev` в `frontend`).
3. Запустить UI-сценарии: `npm run test:ui-headed-local` в
   `system-tests`.
4. Отлаживать параллельно:
   - JS/Vue в frontend;
   - PHP/Laravel в backend.

Docker DEV вариант:

1. Поднять DEV runtime.
2. Запустить:
   - `npm run test:quick-dev`;
   - `npm run test:ui-headless-dev`.

Для длинных browser-flow кейсов в `system-tests/ui`
(`TC-UI-USER-002/005/006/010`) текущий стабильный профиль — `chromium` +
`waitForBaseUrlReady()` + увеличенный timeout. Это нужно, чтобы тесты
проверяли реальный UI/runtime, а не случайную фазу cold-start dev
web/frontend после `docker compose`.

### 7.3. Как запустить local dev / debug

Базовый dev-runtime с `php` target = `dev`:

```powershell
docker compose -f $env:INFRA_ROOT\runtime\docker-compose.dev.yml -f $env:INFRA_ROOT\runtime\docker-compose.dev.target-dev.yml up --build -d
```

Локальный smoke runtime с `php` target = `prod`:

```powershell
docker compose -f $env:INFRA_ROOT\runtime\docker-compose.dev.yml -f $env:INFRA_ROOT\runtime\docker-compose.dev.target-prod.yml up --build -d
```

Файл `docker-compose.dev.target-prod.yml` задаёт те же переменные
окружения `services.php.environment`, что и серверный
`docker-compose.prod.yml` (FPM, OpCache, `LARAVEL_OPTIMIZE`), чтобы
локальная проверка совпадала с prod по PHP.

Какие каталоги в dev идут с хоста, а какие в named volumes — таблица в
[DEPLOY § Runtime](../../infrastructure/DEPLOY.md#dev-что-на-хосте-что-в-named-volume).

Остановить dev/debug-контур:

```powershell
docker compose -f $env:INFRA_ROOT\runtime\docker-compose.dev.yml -f $env:INFRA_ROOT\runtime\docker-compose.dev.target-dev.yml down
```

Переcобрать контейнеры:

```powershell
docker compose -f $env:INFRA_ROOT\runtime\docker-compose.dev.yml -f $env:INFRA_ROOT\runtime\docker-compose.dev.target-dev.yml build
```

Открыть shell в backend-контейнере:

```powershell
docker exec autoteka-dev-php sh
```

По умолчанию приложение доступно по адресу `http://127.0.0.1:8081`.
Адрес и порты управляются через `$INFRA_ROOT/dev.env` и локальный
`$INFRA_ROOT/.env`.

Подробности по локальным runtime-командам и env:

- [README: Dev runtime с выбором php target](../../README.md#dev-runtime-с-выбором-php-target-override);
- [DEPLOY](../../infrastructure/DEPLOY.md).

## 6. Что покрыто тест-кейсами сейчас (high-level)

- `system-tests/cases`:
  - API endpoint тесты `TC-API-ENDPOINTS-001..030`;
  - smoke/health/readme/manual кейсы.
- `system-tests/ui`:
  - `USER-UI` сценарии (`TC-UI-USER-*`);
  - `CLERK-UI` сценарии (`TC-UI-CLERK-*`);
  - `ADMIN-UI` сценарии управления пользователями
    (`TC-UI-ADMIN-USERS-*`).

## 7. Рекомендуемый dev-цикл (только DEV, как основной)

Для редизайна магазинов и других cross-runtime изменений выполнять в
первую очередь:

1. `npm --prefix frontend run test:unit`
2. `npm --prefix frontend run test:ui:mock`
3. `cd backend/apps/ShopAPI && php artisan test`
4. `cd backend/apps/ShopOperator && php artisan test`
5. `npm --prefix system-tests run test:quick-dev`
6. `npm --prefix system-tests run test:ui-headless-dev`

Все команды запускать последовательно. PROD профили выполнять точечно
как финальный предрелизный прогон.

## 8. Тестирование на WSL

### 8.1 Требования

- WSL2
- Docker (Docker Desktop с WSL2 backend или Docker Engine в WSL)
- Node.js, npm, curl
- Playwright:
  `cd system-tests && npm install && npx playwright install firefox`
- Зависимости для браузеров в WSL (при ошибке «Host system is missing
  dependencies»):

  ```bash
  sudo apt-get install -y libxdamage1 libgtk-3-0 libgdk-pixbuf-2.0-0 libpango-1.0-0 libatk1.0-0 libcairo2 libasound2 libpangocairo-1.0-0 libcairo-gobject2
  ```

- systemd (опционально): `[boot] systemd=true` в `~/.wslconfig` для
  install.sh; при Docker Desktop `docker.service` может отсутствовать —
  install.sh пропускает systemctl в этом случае
- WSLg для headed-профилей (видимый браузер)

### 8.2 Pre-check перед тестированием

```bash
bash scripts/agent/wsl-preflight.sh
```

Проверяет: Docker, curl, Node.js, npm, system-tests/.env, prod.test.env,
scripts/.env.

### 8.3 Типичный план предрелизного тестирования на WSL

1. **Подготовка изолированной копии** (опционально):

   ```bash
   TEST_ROOT=/tmp/autoteka-wsl-test bash scripts/agent/wsl-prepare-test-copy.sh
   cd $TEST_ROOT
   ```

   Скрипт переводит `dev.test.env` / `prod.test.env` на отдельный
   `backend/database/database.test.sqlite` и отдельный `RUN_INSTANCE`.

2. **Pre-check**:

   ```bash
   bash scripts/agent/wsl-preflight.sh
   ```

3. **Синхронизация тестовых env с prod**:

   ```bash
   cp infrastructure/prod.env infrastructure/prod.test.env
   cp infrastructure/dev.env infrastructure/dev.test.env
   # Адаптировать пути AUTOTEKA_ROOT, INFRA_ROOT под тестовую копию
   sed -i 's|^DB_DATABASE=.*|DB_DATABASE=../../database/database.test.sqlite|' infrastructure/prod.test.env
   sed -i 's|^DB_DATABASE=.*|DB_DATABASE=../../database/database.test.sqlite|' infrastructure/dev.test.env
   bash scripts/swap-env.sh load -t system-tests-env
   ```

   Если `backend/database/database.test.sqlite` отсутствует, её нужно
   создать копированием из `backend/database/database.sqlite`.

4. **install.sh** (требует root):

   ```bash
   export INFRA_ROOT="$(pwd)/infrastructure" AUTOTEKA_ROOT="$(pwd)"
   sudo -E ./infrastructure/bootstrap/install.sh
   ```

5. **deploy**:

   ```bash
   autoteka deploy
   ```

6. **System-tests** (двухэтапно). Перед прогоном загрузить prod.test.env
   (для docker compose):

   ```bash
   set -a && source infrastructure/prod.test.env && set +a
   cd system-tests
   npm run test:ui-headless-prod
   npm run test:ui-headed-prod
   ```

Если isolated guard обнаруживает отсутствие marker-файла, неправильный
контракт isolated режима или попытку опасной операции без явного opt-in,
запуск обязан завершиться ошибкой до `docker compose up`, `migrate` и
`seed`.

1. **Очистка после тестирования**:

   ```bash
   autoteka uninstall nuke --force --rm-etc --prune-images --prune-volumes
   # При необходимости: --rm-root для удаления AUTOTEKA_ROOT
   ```

### 8.4 Типичные проблемы

- **docker.service не найден** — Docker Desktop; install.sh пропускает
  systemctl, docker compose работает.
- **INFRA_ROOT/OPTIONS_FILE unbound** — задайте переменные перед install
  или передайте `--infra-root=` / `--autoteka-root=`.
- **system-tests/.env отсутствует** — выполните
  `bash scripts/swap-env.sh load -t system-tests-env`.
- **Playwright: Executable doesn't exist** — выполните
  `npx playwright install firefox` в `system-tests`.

## 9. Quick verify cache

`scripts/agent/verify.ps1 -TestProfile minimal` использует локальный кэш
quick-проверок по хэшам `src`-деревьев.

- Кэш хранится в `/.runtime/verify/minimal-src-cache.json`.
- Frontend quick-блок учитывает только `frontend/src`.
- Backend quick-блок `ShopAPI` учитывает `backend/apps/ShopAPI/app` и
  `backend/packages/SchemaDefinition/src`.
- Backend quick-блок `ShopOperator` учитывает
  `backend/apps/ShopOperator/app` и
  `backend/packages/SchemaDefinition/src`.
- Если хэш не изменился с прошлого успешного запуска, блок пропускается
  с сообщением `cache hit: src unchanged`.

Сброс кэша выполняется только вручную: удалите
`/.runtime/verify/minimal-src-cache.json`, если нужен полный rerun без
использования старых fingerprints.

На Windows verify использует ProcessStartInfo с CreateNoWindow — тесты
запускаются без всплывающих консольных окон. Требуется pwsh.

## 10. Проверки сброса бизнес-данных

Проверки задачи ограничены `BusinessResetCommandTest.php` и
`catalog-brand.spec.ts`. Перед тестовыми миграциями создайте
согласованную копию рабочей БД. Все команды в первом блоке выполняются
из корня:

```bash
(
  set -e
  source scripts/.env
  mkdir -p "$AUTOTEKA_ROOT/backend/database/backup"
  TEST_BACKUP_PATH="$AUTOTEKA_ROOT/backend/database/backup/$(date +%Y%m%d-%H%M%S).database.sqlite"
  SQLITE_BACKUP_PATH=${TEST_BACKUP_PATH//\\/\\\\}
  SQLITE_BACKUP_PATH=${SQLITE_BACKUP_PATH//\"/\\\"}
  sqlite3 -readonly "$AUTOTEKA_ROOT/backend/database/database.sqlite" ".backup \"$SQLITE_BACKUP_PATH\""
  "$SCRIPT_PHP_PATH" backend/apps/ShopOperator/vendor/bin/phpunit \
    -c backend/apps/ShopOperator/phpunit.xml \
    backend/apps/ShopOperator/tests/Feature/Console/BusinessResetCommandTest.php
)
```

Тест создаёт отдельные файловые БД, явно переопределяет
DB_DATABASE/DB_URL и путь кэша. Проверяет восемь случаев:
canonical/legacy × четыре сочетания `--purge-cities` и
`--purge-contact-types`, WAL-копию, восстановление, сохранность
инфраструктуры и атомарность отказов, включая поздний отказ удаления
`contact_type` с полным откатом и сохранным backup. Проверяется help
обоих ключей. Без своего ключа `city` и `contact_type` сохраняют все
строки/ID/поля; `shop_contact` пуст всегда. Миграционная матрица
проверяет populated/empty таблицы, исторический счётчик выше MAX(id),
следующий INSERT, полный FK-граф, индексы и данные. Цикл
`migrate → rollback → migrate` выполняется на отдельной копии; rollback
восстанавливает прежние правила, итоговый migrate убирает каскады. Для
legacy-цикла оба пути передаются явно, как в
[руководстве сброса](BUSINESS_DATA_RESET.md#5-переход-к-схеме-без-каскадного-удаления).

### 10.1. Цикл на копии текущей legacy-установки

Используйте резервную копию, созданную до двух новых миграций. В текущей
установке это `backend/database/backup/20261028-025206.database.sqlite`.
Исходная копия содержит обе legacy/canonical таблицы и 11 каскадов.
Следующий блок выполняется из корня; он создаёт отдельную БД и не
использует рабочие DB_URL, кэш конфигурации или storage. Перед каждым
шагом сохраняется отдельная копия тестовой БД. Ошибка прекращает цикл.

```bash
(
  set -e -o pipefail
  source scripts/.env
  CYCLE_SOURCE="$AUTOTEKA_ROOT/backend/database/backup/20261028-025206.database.sqlite"
  CYCLE_DIRECTORY=$(mktemp -d)
  cd "$CYCLE_DIRECTORY"
  sqlite3 -readonly "$CYCLE_SOURCE" '.backup database.sqlite'
  export DB_URL=''
  export DB_DATABASE="$CYCLE_DIRECTORY/database.sqlite"
  export APP_CONFIG_CACHE="$CYCLE_DIRECTORY/config.php"
  export LARAVEL_STORAGE_PATH="$CYCLE_DIRECTORY/storage"
  mkdir -p "$LARAVEL_STORAGE_PATH/framework/"{cache/data,sessions,views} \
    "$LARAVEL_STORAGE_PATH/logs"
  MIGRATION_PATHS=(
    --realpath
    --path="$AUTOTEKA_ROOT/backend/packages/SchemaDefinition/database/migrations/2026_10_28_030000_restrict_delete_rules.php"
    --path="$AUTOTEKA_ROOT/backend/packages/SchemaDefinition/database/legacy-migrations/2026_10_28_030100_restrict_legacy_promotion_image_delete.php"
  )
  cd "$AUTOTEKA_ROOT/backend/apps/ShopOperator"
  CYCLE_STEP=0
  for CYCLE_ACTION in migrate migrate:rollback migrate; do
    CYCLE_STEP=$((CYCLE_STEP + 1))
    (
      cd "$CYCLE_DIRECTORY"
      sqlite3 -readonly database.sqlite ".backup step-$CYCLE_STEP.database.sqlite"
    )
    for CYCLE_STATE in before after; do
      if [ "$CYCLE_STATE" = after ]; then
        "$SCRIPT_PHP_PATH" artisan "$CYCLE_ACTION" --force "${MIGRATION_PATHS[@]}"
      fi
      sqlite3 -readonly "$DB_DATABASE" '.dump --data-only' |
        sed -e '/^INSERT INTO migrations /d' \
          -e "/^INSERT INTO sqlite_sequence VALUES('migrations',/d" |
        LC_ALL=C sort > "$CYCLE_DIRECTORY/$CYCLE_STATE-data.sql"
      sqlite3 -readonly "$DB_DATABASE" \
        "SELECT m.name, p.cid, p.name, p.type, p.\"notnull\", p.dflt_value, p.pk FROM sqlite_schema m JOIN pragma_table_info(m.name) p WHERE m.type='table' ORDER BY m.name, p.cid; SELECT name, tbl_name, sql FROM sqlite_schema WHERE type='index' ORDER BY name;" \
        > "$CYCLE_DIRECTORY/$CYCLE_STATE-structure.txt"
    done
    cmp "$CYCLE_DIRECTORY/before-data.sql" "$CYCLE_DIRECTORY/after-data.sql"
    cmp "$CYCLE_DIRECTORY/before-structure.txt" "$CYCLE_DIRECTORY/after-structure.txt"
    sqlite3 -readonly "$DB_DATABASE" \
      'PRAGMA quick_check; PRAGMA foreign_key_check;'
    sqlite3 -readonly "$DB_DATABASE" \
      "SELECT count(*) FROM sqlite_schema m JOIN pragma_foreign_key_list(m.name) f WHERE m.type='table' AND f.on_delete='CASCADE';"
  done
  printf 'Копия для проверки: %s\n' "$CYCLE_DIRECTORY"
)
```

Для каждого шага ожидаются `ok` и отсутствие нарушений FK. Число
каскадных правил после последовательных шагов — `0`, `11`, `0`. Сверьте
строки/ID, `sqlite_sequence`, колонки и индексы с копией до шага; журнал
`migrations` должен отражать выполненный переход. Автоматические
проверки выше доказывают сохранность этих данных и отказ удаления
связанных родителей. При исправлении миграции начните весь цикл с новой
копии исходного backup.

### 10.2. Браузерная проверка

На запущенных frontend и API выполните из `frontend`:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 \
  npm run test:e2e -- e2e/catalog-brand.spec.ts --reporter=line
```

Браузерные проверки используют реальные API, штатные координаты
Playwright и ширины 320/768/1280. После миграции также проверьте API и
вход оператора; испытание reset выполняйте на копии, сохраняя рабочие
данные.
