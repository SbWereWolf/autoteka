# Э4 — тест-кейсы для README.md

## Область

- Документ-источник: `README.md`
- Цель: проверить тестами каждое проверяемое утверждение документа
- Формат трассировки:
  `README.md -> утверждение -> тест-кейс -> каталог тестов`

## Тест-кейсы

### TC-README-001

- Утверждение: в репозитории есть каталоги `deploy/`, `frontend/`, `backend/`.
- Проверка:
  1. Проверить существование каталогов в корне репозитория.
  2. Убедиться, что это именно директории.
- Ожидаемый результат: все три каталога существуют и доступны.
- Тип: automated
- Каталог тестов: `system-tests`

### TC-README-002

- Утверждение: существует карта документации с файлами:
  - `docs/foundations/ADMIN_MANUAL.md`
  - `deploy/DEPLOY.md`
  - `docs/foundations/USER_MANUAL.md`
  - `docs/foundations/CLERC_MANUAL.md`
  - `docs/foundations/IMPLEMENTATION.md`
  - `backend/README.md`
  - `frontend/README.md`
- Проверка: проверить наличие каждого файла по указанному пути.
- Ожидаемый результат: каждый файл существует.
- Тип: automated
- Каталог тестов: `system-tests`

### TC-README-003

- Утверждение: для frontend локальный запуск включает команды
  `npm i`, `cp example.env .env`, `npm run dev`.
- Проверка:
  1. В `frontend/package.json` есть скрипт `dev`.
  2. Файл `frontend/example.env` существует.
  3. Установка зависимостей (`npm i`) завершается без ошибки.
- Ожидаемый результат:
  - скрипт `dev` присутствует;
  - `example.env` присутствует;
  - команда установки выполняется успешно.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-README-004

- Утверждение: существует переменная `VITE_API_BASE_URL` и для
  same-origin допустимо значение `/api/v1`.
- Проверка:
  1. В `frontend/example.env` есть ключ `VITE_API_BASE_URL`.
  2. В frontend-конфигурации значение этого ключа читается из env
     (например, через `import.meta.env`).
  3. Запуск e2e/smoke с `VITE_API_BASE_URL=/api/v1`
     не ломает запросы к API.
- Ожидаемый результат:
  - ключ объявлен в шаблоне env;
  - приложение использует env-значение;
  - при `/api/v1` запросы идут на same-origin API-префикс.
- Тип: automated
- Каталог тестов: `frontend/tests` + `system-tests`

### TC-README-005

- Утверждение: для frontend доступны команды `npm run build`,
  `npm run preview`, `npm run test`.
- Проверка:
  1. В `frontend/package.json` есть скрипты `build`, `preview`, `test`.
  2. Каждая команда завершается с exit code 0 в чистом окружении.
- Ожидаемый результат: все скрипты существуют и исполняются успешно.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-README-006

- Утверждение: для backend локальный запуск включает `composer install`,
  `cp example.env .env`, `php artisan key:generate`,
  `php artisan migrate`, `php artisan db:seed --class=AdminUserSeeder`,
  `php artisan serve`.
- Проверка:
  1. Файл `backend/example.env` существует.
  2. В `backend/database/seeders` есть `AdminUserSeeder`.
  3. Команды artisan из инструкции выполняются последовательно
     (на тестовой БД) без ошибки.
- Ожидаемый результат: шаги запуска backend воспроизводимы.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-README-007

- Утверждение: вход в back office MoonShine доступен по URL `/admin/login`.
- Проверка:
  1. Поднять backend-приложение локально.
  2. Выполнить HTTP GET `/admin/login`.
  3. Проверить, что возвращается страница логина (200 OK).
- Ожидаемый результат:
  маршрут `/admin/login` существует и отдаёт форму входа.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-README-008

- Утверждение: локальные учётные данные MoonShine берутся из
  `backend/.env`, ключи `MOONSHINE_ADMIN_*`.
- Проверка:
  1. В `backend/example.env` присутствуют `MOONSHINE_ADMIN_*`.
  2. После `db:seed --class=AdminUserSeeder` пользователь с этими данными
     может пройти аутентификацию в `/admin/login`.
- Ожидаемый результат: сидер создаёт валидную учётку согласно env.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-README-009

- Утверждение: шаблоны env существуют:
  `frontend/example.env`, `backend/example.env`.
- Проверка: проверить наличие обоих файлов.
- Ожидаемый результат: оба шаблона присутствуют в репозитории.
- Тип: automated
- Каталог тестов: `system-tests`

### TC-README-010

- Утверждение: server-side env-файлы для deploy:
  `/etc/autoteka/deploy.env` и `/etc/autoteka/telegram.env`.
- Проверка:
  1. На целевом сервере проверить наличие обоих файлов.
  2. Проверить права чтения для пользователя, под которым выполняются
     deploy/watchdog/maintenance скрипты.
- Ожидаемый результат: оба файла существуют и доступны для чтения.
- Тип: automated (server integration)
- Каталог тестов: `deploy/tests`

## Непроверяемые/условно проверяемые утверждения

- Утверждение о том, что `tasks/` и `logs/` являются временными и
  незначимыми артефактами, относится к процессу/политике проекта.
- Для него рекомендуется policy-check (document compliance), а не
  runtime-тест. Отдельный тип проверки можно оформить в `system-tests`
  как документарную валидацию.
