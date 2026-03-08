# Э4 — тест-кейсы для frontend/README.md

## Область

- Документ-источник: `frontend/README.md`
- Цель: проверить тестами проверяемые утверждения документа
- Формат трассировки:
  `frontend/README.md -> утверждение -> тест-кейс -> каталог тестов`

## Тест-кейсы

### TC-FRONTEND-README-001

- Утверждение: frontend реализован на Vue 3 + Vite.
- Проверка:
  1. Проверить `frontend/package.json` и lock-файл.
  2. Убедиться в наличии зависимостей `vue` (major 3) и `vite`.
- Ожидаемый результат: проект использует Vue 3 и Vite.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FRONTEND-README-002

- Утверждение: front office покрывает каталог магазинов, карточку
  магазина, выбор города/категорий/фишки, переключение темы и runtime
  theme editor.
- Проверка:
  1. Проверить наличие соответствующих UI-страниц/компонентов/сторов.
  2. Выполнить online e2e и offline UI(mock)-потоки по сценариям.
- Ожидаемый результат: все заявленные пользовательские сценарии
  доступны в UI.
- Тип: automated
- Каталог тестов: `frontend/tests` + `frontend/e2e` +
  `frontend/ui-mock` + `system-tests`

### TC-FRONTEND-README-003

- Утверждение: быстрый запуск — `npm install`, `cp example.env .env`,
  `npm run dev`.
- Проверка:
  1. Проверить наличие `frontend/example.env`.
  2. Выполнить шаги быстрого запуска в чистом окружении.
  3. Проверить, что dev-server стартует без ошибки.
- Ожидаемый результат: инструкция запуска воспроизводима.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FRONTEND-README-004

- Утверждение: доступны команды `dev`, `build`, `preview`, `test`,
  `test:api:online`, `test:e2e`, `test:ui:mock`, `check:data`.
- Проверка:
  1. Проверить наличие скриптов в `frontend/package.json`.
  2. Выполнить каждую команду и проверить exit code 0.
- Ожидаемый результат: все основные скрипты объявлены и исполняются.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FRONTEND-README-005

- Утверждение: доступны дополнительные data/media команды:
  `validate:mocks`, `check:unused-assets`, `enrich:mocks`,
  `images:regen`, `images:moonshine`, `materialize:shop-media`,
  `sync:backend-media`.
- Проверка:
  1. Проверить наличие скриптов в `frontend/package.json`.
  2. Выполнить smoke-прогон каждой команды (без разрушительных
     изменений).
- Ожидаемый результат: все перечисленные команды присутствуют и
  запускаются.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FRONTEND-README-006

- Утверждение: основные маршруты: `/` (каталог) и `/shop/:code`
  (карточка магазина).
- Проверка:
  1. Проверить декларации маршрутов в frontend router.
  2. Выполнить online e2e-навигацию на `/` и `/shop/<валидный-code>`.
- Ожидаемый результат: оба маршрута существуют и отдают
  соответствующие экраны.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FRONTEND-README-007

- Утверждение: API-конфигурация берётся из `VITE_API_BASE_URL` в
  `frontend/.env`; `frontend/example.env` используется как шаблон.
- Проверка:
  1. Проверить наличие ключа `VITE_API_BASE_URL` в
     `frontend/example.env`.
  2. Проверить чтение переменной через `import.meta.env` в коде.
  3. Проверить успешные API-запросы при заданном env.
- Ожидаемый результат: переменная объявлена и реально используется
  приложением.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-FRONTEND-README-008

- Утверждение: для same-origin схемы корректно значение
  `VITE_API_BASE_URL=/api/v1`.
- Проверка:
  1. Запустить приложение с `VITE_API_BASE_URL=/api/v1`.
  2. Выполнить online e2e-сценарий с сетевыми запросами к API.
  3. Проверить, что запросы идут на `/api/v1/*`.
- Ожидаемый результат: фронтенд корректно работает с same-origin
  API-префиксом.
- Тип: automated
- Каталог тестов: `frontend/tests` + `system-tests`

### TC-FRONTEND-README-009

- Утверждение: раздел "Что читать дальше" ссылается на существующие
  документы: `../README.md`, `../docs/foundations/USER_MANUAL.md`,
  `../docs/foundations/ADMIN_MANUAL.md`,
  `../docs/foundations/IMPLEMENTATION.md`.
- Проверка: проверить существование всех файлов по относительным
  путям.
- Ожидаемый результат: все ссылки валидны.
- Тип: automated
- Каталог тестов: `system-tests`

## Условно проверяемые утверждения

- Дата актуальности (`2026-03-07`) не проверяется runtime-тестом.
- Для этого нужен process-check: соответствие дате последней ревизии и
  артефактам Э3/Э4.
