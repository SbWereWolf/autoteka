# Э4 — тест-кейсы для backend/README.md

## Область

- Документ-источник: `backend/README.md`
- Цель: проверить тестами проверяемые утверждения документа
- Формат трассировки:
  `backend/README.md -> утверждение -> тест-кейс -> каталог тестов`

## Тест-кейсы

### TC-BACKEND-README-001

- Утверждение: backend реализован на Laravel 12.
- Проверка:
  1. Проверить `backend/composer.json`.
  2. Убедиться, что зависимость `laravel/framework`
     зафиксирована на major 12.
- Ожидаемый результат: проект использует Laravel 12.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-BACKEND-README-002

- Утверждение: backend обслуживает API front office.
- Проверка:
  1. Проверить наличие API-роутов в `backend/routes/api.php`.
  2. Выполнить HTTP-запрос к одному из публичных API-эндпоинтов.
- Ожидаемый результат: API-роуты объявлены и отвечают корректно.
- Тип: automated
- Каталог тестов: `backend/tests` + `system-tests`

### TC-BACKEND-README-003

- Утверждение: back office работает на MoonShine 4.
- Проверка:
  1. Проверить `backend/composer.json` на пакет MoonShine.
  2. Проверить, что версия пакета относится к major 4.
  3. Проверить, что маршрут логина back office доступен.
- Ожидаемый результат: MoonShine 4 подключён и маршрут доступен.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-BACKEND-README-004

- Утверждение: быстрый запуск backend выполняется по шагам:
  `composer install`, `cp example.env .env`, `artisan key:generate`,
  `artisan migrate`, `artisan db:seed --class=AdminUserSeeder`,
  `artisan serve`.
- Проверка:
  1. Проверить наличие `backend/example.env`.
  2. Проверить наличие `AdminUserSeeder`.
  3. Выполнить шаги запуска на тестовой БД.
- Ожидаемый результат: все шаги выполняются без ошибок.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-BACKEND-README-005

- Утверждение: для быстрой проверки гипотез используется
  `php artisan tinker`.
- Проверка:
  1. Выполнить `php artisan tinker --execute="echo 1;"`.
  2. Проверить успешное завершение процесса.
- Ожидаемый результат: tinker запускается и исполняет выражение.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-BACKEND-README-006

- Утверждение: можно работать с БД через
  `Illuminate\Support\Facades\DB` в tinker.
- Проверка:
  1. Запустить tinker с выражением,
     использующим `DB::connection()->getPdo()`.
  2. Проверить, что соединение с БД устанавливается.
- Ожидаемый результат: facade `DB` доступен и рабочий.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-BACKEND-README-007

- Утверждение: API base — `/api/v1`.
- Проверка:
  1. Проверить префикс роутов в `backend/routes/api.php`.
  2. Выполнить HTTP-запрос к endpoint с префиксом `/api/v1`.
- Ожидаемый результат: API обслуживается под префиксом `/api/v1`.
- Тип: automated
- Каталог тестов: `backend/tests` + `system-tests`

### TC-BACKEND-README-008

- Утверждение: MoonShine login доступен по
  `http://127.0.0.1:8000/admin/login`.
- Проверка:
  1. Запустить `php artisan serve` на `127.0.0.1:8000`.
  2. Выполнить HTTP GET `/admin/login`.
  3. Проверить код ответа 200 и наличие формы входа.
- Ожидаемый результат: страница логина доступна.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-BACKEND-README-009

- Утверждение: initial admin по умолчанию:
  `admin@example.com` / `admin12345`.
- Проверка:
  1. Выполнить `db:seed --class=AdminUserSeeder`.
  2. Проверить аутентификацию с указанными значениями.
- Ожидаемый результат:
  вход в back office с дефолтной учёткой успешен.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-BACKEND-README-010

- Утверждение: production-значения админа задаются через:
  `MOONSHINE_ADMIN_NAME`, `MOONSHINE_ADMIN_EMAIL`,
  `MOONSHINE_ADMIN_PASSWORD`.
- Проверка:
  1. Проверить наличие ключей в `backend/example.env`.
  2. Подставить тестовые значения в `backend/.env`.
  3. Выполнить сидирование и проверить вход с новыми значениями.
- Ожидаемый результат:
  учётные данные админа берутся из env-переменных.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-BACKEND-README-011

- Утверждение: в разделе "Что читать дальше" указаны существующие файлы:
  `../docs/foundations/IMPLEMENTATION.md`,
  `../docs/foundations/ADMIN_MANUAL.md`,
  `../deploy/DEPLOY.md`.
- Проверка: проверить наличие целевых файлов по относительным путям.
- Ожидаемый результат: все ссылки ведут на существующие файлы.
- Тип: automated
- Каталог тестов: `system-tests`

## Условно проверяемые утверждения

- Фраза "актуально по коду на 2026-03-07" не имеет
  прямой machine-check проверки.
- Рекомендуется process-check:
  наличие последней даты ревизии и связанного отчёта Э3/Э4.
