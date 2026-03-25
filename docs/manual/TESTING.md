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
- Сам `swap-env`: он либо проверяет состояние (`validate`),
  либо явно сохраняет (`save`) / загружает (`load`) артефакты
  текущей среды.
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

- Unit/UI mock режимы во frontend запускаются из `frontend` и
  используют свои test-конфиги frontend без обязательного поднятия
  backend.
- Для текущего проекта последовательные прогоны являются дефолтом:
  parallel-варианты не использовать в dev-цикле, пока повторные замеры
  не покажут реальный выигрыш по wall-clock.

## 3. Матрица режимов запуска

Перед запуском тестов убедитесь, что у вас актуальные образы для
контейнеров Docker. Если до запуска тестов уже есть запущенные
контейнеры, то удалите их, для каждого теста (где используется Docker)
следует создавать новый набор контейнеров, после тестирования
контейнеры следует удалять.

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
вида `vitest: not found`, `playwright: not found` или `swap-env ...
frontend-node-modules: different`, это означает не кодовую, а env
проблему. В таком случае сначала восстановить frontend env через
`pwsh scripts/swap-env.ps1 load`.

Для `frontend/ui-mock` текущий стабильный browser profile —
`chromium`. Навигация в mock-suite намеренно ждёт
`domcontentloaded`, а не полный `load`, потому что это устраняет
ложные timeout-падения dev-server harness при первом открытии страницы
и не ослабляет сами UI-assertions.

Если `npm --prefix system-tests run test:quick-dev` или
`test:ui-headless-dev` зависают на dev-runtime, а `docker logs
autoteka-dev-frontend` показывает `Cannot find package
'vite-plugin-vue-devtools'`, проблема не в UI-коде, а в stale docker
volume `/workspace/frontend/node_modules`. В этом случае надо
пересобрать dev frontend image и дать entrypoint заново выполнить
`npm ci` для container-local зависимостей.

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
(`TC-UI-USER-002/005/006/010`) текущий стабильный профиль —
`chromium` + `waitForBaseUrlReady()` + увеличенный timeout. Это нужно,
чтобы тесты проверяли реальный UI/runtime, а не случайную фазу
cold-start dev web/frontend после `docker compose`.

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
- Playwright: `cd system-tests && npm install && npx playwright install firefox`
- Зависимости для браузеров в WSL (при ошибке «Host system is missing
  dependencies»): `sudo apt-get install -y libxdamage1 libgtk-3-0
  libgdk-pixbuf-2.0-0 libpango-1.0-0 libatk1.0-0 libcairo2 libasound2
  libpangocairo-1.0-0 libcairo-gobject2`
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
   `backend/database/database.test.sqlite` и отдельный
   `RUN_INSTANCE`.

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

7. **Очистка после тестирования**:
   ```bash
   autoteka uninstall nuke --force --rm-etc --prune-images --prune-volumes
   # При необходимости: --rm-root для удаления AUTOTEKA_ROOT
   ```

### 8.4 Типичные проблемы

- **docker.service не найден** — Docker Desktop; install.sh пропускает
  systemctl, docker compose работает.
- **INFRA_ROOT/OPTIONS_FILE unbound** — задайте переменные
  перед install или передайте `--infra-root=` / `--autoteka-root=`.
- **system-tests/.env отсутствует** — выполните
  `bash scripts/swap-env.sh load -t system-tests-env`.
- **Playwright: Executable doesn't exist** — выполните
  `npx playwright install firefox` в `system-tests`.

## 9. Quick verify cache

`scripts/agent/verify.ps1 -TestProfile minimal` использует локальный
кэш quick-проверок по хэшам `src`-деревьев.

- Кэш хранится в `/.runtime/verify/minimal-src-cache.json`.
- Frontend quick-блок учитывает только `frontend/src`.
- Backend quick-блок `ShopAPI` учитывает
  `backend/apps/ShopAPI/app` и `backend/packages/SchemaDefinition/src`.
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
