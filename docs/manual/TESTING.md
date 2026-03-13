# TESTING

Документ фиксирует, как в проекте запускать тесты в изолированных
режимах, какие env/config используются, и как выбирать профиль под
конкретную задачу отладки.

## 1. Базовое правило изоляции env/config

- У тестов свои env-файлы и свои конфиги.
- Тестовые раннеры не должны зависеть от runtime `.env` рабочих
  приложений.
- Линтинг использует активный `lint/.env`.
- Перед запуском verify/linters active `lint/.env` должно быть
  синхронизировано с env-specific storage текущей среды через
  `scripts/swap-env.ps1` / `scripts/swap-env.sh`.
- Сам `swap-env` больше не выполняет авто-переключение: он либо
  проверяет состояние (`validate`), либо явно сохраняет (`save`) /
  загружает (`load`) артефакты текущей среды.

## 2. Где какие env и конфиги

### 2.1 Backend (phpunit)

- Основной конфиг тестов: `backend/apps/ShopOperator/phpunit.xml`.
- Локальный файл переменных для тестового окружения:
  `backend/apps/ShopOperator/testing.env`.
- Файл `testing.env` предназначен только для тестового контура.

### 2.2 System tests (Vitest + Playwright)

- Конфиг раннера: `system-tests/scripts/run-vitest.mjs`.
- Конфиг Vitest: `system-tests/vitest.config.ts`.
- Базовый URL задаётся:
  - через `BASE_URL` в окружении;
  - или через CLI-override: `--base-url=http://127.0.0.1:8081`
    (приоритетнее env).

### 2.3 Frontend независимые тесты

- Unit/UI mock режимы во frontend запускаются из `frontend` и
  используют свои test-конфиги frontend без обязательного поднятия
  backend.

## 3. Матрица режимов запуска

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
npm run test
npm run test:ui:mock
```

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

## 6. Что покрыто тест-кейсами сейчас (high-level)

- `system-tests/cases`:
  - API endpoint тесты `TC-API-ENDPOINTS-001..030`;
  - smoke/health/readme/manual кейсы.
- `system-tests/ui`:
  - `USER-UI` сценарии (`TC-UI-USER-*`);
  - `CLERC-UI` сценарии (`TC-UI-CLERC-*`);
  - `ADMIN-UI` сценарии управления пользователями
    (`TC-UI-ADMIN-USERS-*`).

## 7. Рекомендуемый дев-цикл (только DEV, как основной)

До завершения расширения покрытия выполнять в первую очередь:

1. `npm --prefix system-tests run test:quick-dev`
2. `npm --prefix system-tests run test:ui-headless-dev`

PROD профили выполнять точечно как финальный предрелизный прогон.
