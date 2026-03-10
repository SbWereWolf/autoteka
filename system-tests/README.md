# system-tests

Единый набор системных тест-кейсов для quick и UI профилей.

## Профили запуска

- `quick-local`: без Docker, HTTP к локальному серверу (например
  `php artisan serve`).
- `quick-dev`: без браузера, против Docker DEV окружения.
- `ui-headless-dev`: Playwright headless против Docker DEV окружения.
- `ui-headless-prod`: Playwright headless против Docker PROD
  окружения.
- `ui-headed-local`: Playwright с видимым браузером против локального
  окружения.
- `ui-headed-prod`: Playwright с видимым браузером против Docker PROD
  окружения.

## Базовый запуск

```bash
cd system-tests
npm install
npm test
```

`npm test` эквивалентен `test:quick-local`.

## Запуск по профилям

```bash
npm run test:quick-local
npm run test:quick-dev
npm run test:ui-headless-dev
npm run test:ui-headless-prod
npm run test:ui-headed-local
npm run test:ui-headed-prod
```

## BASE_URL: env + CLI override

По умолчанию используется `BASE_URL` из окружения.

Пример через env:

```bash
BASE_URL=http://127.0.0.1:8081 npm run test:quick-local
```

Пример CLI override (имеет приоритет над env):

```bash
npm run test:quick-local -- --base-url=http://127.0.0.1:8081
```

## Структура

- `cases/` — общий каталог тест-кейсов для всех профилей.
- `ui/` — UI-кейсы (Playwright) для headless/headed профилей.
- `scripts/run-vitest.mjs` — раннер профилей и нормализация runtime
  env.

## Что уже покрыто сейчас

- `TC-HTTP-SMOKE-001`:
  - quick-профили выполняют реальный HTTP-запрос к `BASE_URL`;
  - проверяется, что сервис отвечает статусом `< 500`.
- `TC-UI-SMOKE-001`:
  - ui-профили запускают Playwright (`headless/headed` по профилю);
  - проверяется, что страница открывается и имеет непустой `title`.
