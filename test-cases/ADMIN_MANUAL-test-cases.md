# Э4 — тест-кейсы для docs/foundations/ADMIN_MANUAL.md

## Область

- Документ-источник: `docs/foundations/ADMIN_MANUAL.md`
- Цель: проверить тестами проверяемые утверждения документа
- Формат трассировки:
  `ADMIN_MANUAL.md -> утверждение -> тест-кейс -> каталог тестов`

## Тест-кейсы

### TC-ADMIN-MANUAL-001

- Утверждение: theme editor включается/выключается через
  `localStorage.autoteka_theme_editor_enabled`.
- Проверка:
  1. Установить `true`, перезагрузить страницу.
  2. Установить `false`, перезагрузить страницу.
  3. Проверить видимость кнопки `CSS переменные`.
- Ожидаемый результат: поведение соответствует значению в
  localStorage.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-ADMIN-MANUAL-002

- Утверждение: кнопка `CSS переменные` в `TopBar`, редактор доступен
  на `/` и `/shop/:code`, скрыт на mobile breakpoint.
- Проверка: e2e-проход по маршрутам и брейкпоинтам desktop/mobile.
- Ожидаемый результат: на desktop редактор доступен на двух страницах,
  на mobile скрыт.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-ADMIN-MANUAL-003

- Утверждение: editor-состояние хранится в ключах
  `autoteka_theme_editor_enabled`, `autoteka_theme_overrides_v1`,
  `autoteka_theme`.
- Проверка:
  1. Изменить тему/переменные через UI.
  2. Проверить соответствующие ключи в localStorage.
- Ожидаемый результат: все три ключа используются по назначению.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-ADMIN-MANUAL-004

- Утверждение: значения CSS применяются в `.app` как inline
  properties, валидация возможна через `CSS.supports`.
- Проверка:
  1. Установить валидное значение и проверить применение стиля.
  2. Установить невалидное значение и проверить отказ применения.
- Ожидаемый результат: валидные значения применяются, невалидные
  отбрасываются.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-ADMIN-MANUAL-005

- Утверждение: MoonShine login по умолчанию:
  `http://127.0.0.1:8000/admin/login`, `admin@example.com` /
  `admin12345`.
- Проверка:
  1. Выполнить `db:seed --class=AdminUserSeeder`.
  2. Проверить вход на `/admin/login` дефолтной учёткой.
- Ожидаемый результат: вход с дефолтной учёткой успешен.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-ADMIN-MANUAL-006

- Утверждение: production-учётка задаётся через
  `MOONSHINE_ADMIN_NAME`, `MOONSHINE_ADMIN_EMAIL`,
  `MOONSHINE_ADMIN_PASSWORD`.
- Проверка:
  1. Задать значения в `backend/.env`.
  2. Пересидировать admin и проверить вход с новыми данными.
- Ожидаемый результат: учётка берётся из `MOONSHINE_ADMIN_*`.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-ADMIN-MANUAL-007

- Утверждение: в MoonShine зарегистрированы ресурсы `MoonShineUser`,
  `MoonShineUserRole`, `City`, `Category`, `Feature`, `ContactType`,
  `Shop`.
- Проверка:
  1. Проверить регистрацию ресурсов в backend-коде.
  2. Проверить отображение сущностей в меню админки.
- Ожидаемый результат: все перечисленные ресурсы присутствуют.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-ADMIN-MANUAL-008

- Утверждение: после правок в back office магазин корректно
  отображается во front office, включая контакты, preview/gallery и
  `siteUrl`.
- Проверка: e2e-сценарий "создать/обновить магазин в админке ->
  проверить карточку во frontend".
- Ожидаемый результат: данные и медиа отображаются корректно.
- Тип: automated
- Каталог тестов: `system-tests`

### TC-ADMIN-MANUAL-009

- Утверждение: команды frontend-скриптов доступны в
  `frontend/package.json` (без удалённых мок/data-media команд).
- Проверка:
  1. Проверить отсутствие удалённых команд.
- Ожидаемый результат: удалённые команды отсутствуют.
- Тип: automated
- Каталог тестов: `frontend/tests`

### TC-ADMIN-MANUAL-010

- Утверждение: backend-команда
  `autoteka:media:update-generated-paths-to-png` обновляет пути
  `generated/*.svg` -> `generated/*.png` и подготавливает
  mirror-файлы.
- Проверка:
  1. Подготовить тестовые данные с `.svg` путями.
  2. Запустить artisan-команду.
  3. Проверить замену путей и создание mirror-артефактов.
- Ожидаемый результат: конвертация путей и mirror выполняются.
- Тип: automated
- Каталог тестов: `backend/tests`

### TC-ADMIN-MANUAL-011

- Утверждение: env-настройки frontend/backend/server соответствуют
  разделу 6 (`VITE_API_BASE_URL`, `APP_URL`, `DB_*`,
  `MOONSHINE_ADMIN_*`, `/etc/autoteka/deploy.env`,
  `/etc/autoteka/telegram.env`).
- Проверка:
  1. Проверить наличие и чтение ключей в соответствующих env-файлах.
  2. Проверить использование ключей в runtime.
- Ожидаемый результат: ключи существуют и задействованы в работе.
- Тип: automated
- Каталог тестов: `infrastructure/tests` + `backend/tests` + `frontend/tests`

### TC-ADMIN-MANUAL-012

- Утверждение: в `infrastructure/` присутствуют скрипты `install.sh`,
  `watch-changes.sh`, `deploy.sh`, `server-watchdog.sh`,
  `metrics-export.sh`, `server-maintenance.sh`, `uninstall.sh`.
- Проверка: проверить наличие всех перечисленных файлов.
- Ожидаемый результат: набор серверных скриптов полный.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-ADMIN-MANUAL-013

- Утверждение: `uninstall.sh` поддерживает режимы `soft`, `purge`,
  `nuke` и safety-границы для `--rm-root`/`--rm-etc`.
- Проверка:
  1. Проверить ветки режима и флаги в `$INFRA_ROOT/bootstrap/uninstall.sh`.
  2. На стенде проверить side effects по каждому режиму.
- Ожидаемый результат: логика удаления соответствует документу.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-ADMIN-MANUAL-014

- Утверждение: минимальный регламент после изменений включает проверки
  front/back office, `systemctl`, `docker compose ps`, логи и
  `/metrics`.
- Проверка: сформировать integration checklist test, который
  последовательно выполняет описанные шаги.
- Ожидаемый результат: регламент выполняется полностью и без
  пропусков.
- Тип: automated
- Каталог тестов: `system-tests`

## Условно проверяемые утверждения

- Роли "контент-администратор" и "технический администратор" как
  организационные зоны ответственности проверяются process-check, а не
  runtime-тестами.
- Дата актуализации (`2026-03-07`) требует process-check по артефактам
  Э3/Э4.
