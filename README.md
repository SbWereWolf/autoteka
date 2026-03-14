# Автотека — картотека магазинов автомобильной тематики

## Что в репозитории

- `docs/` — постоянная документация по эксплуатации, использованию и
  разработке.
- `infrastructure/` — install/uninstall, docker compose, systemd,
  watchdog и maintenance.
- `frontend/` — клиентское приложение, его сборка и frontend-тесты.
- `backend/` — серверные Laravel-модули и связанные PHP-пакеты
  (тесты).
- `test-cases/` — трассировка документации и требований в тест-кейсы и
  checklists.
- `system-tests/` — системные quick/ui тесты, включая `USER-UI` и
  `CLERC-UI`.
- `operational/` — журнал текущей работы для LLM-агентов.
- `backup/` — временные локальные резервные копии.
- `inbox/` — временные файлы вложений для диалога с LLM-агентом.
- `logs/` — (логи, журналы) временные локальные журналы работ.
- `tasks/` — (задачи) временные одноразовые рабочие инструкции.

## Терминология системы

- Приложений в системе три:
  - клиентское приложение;
  - серверное приложение;
  - приложение для развёртывания и обслуживания установленной Системы
    (скрипты/infra в `infrastructure/`).
- Клиентское приложение состоит из двух модулей:
  - редактор тем оформления;
  - модуль каталога (front office).
- Серверные модули:
  - `ShopAPI` (путь в репозитории: `backend/apps/ShopAPI`) - API для
    клиентского приложения;
  - `ShopOperator` (путь: `backend/apps/ShopOperator`) - GUI для
    работы с картотекой магазинов (back oficce);
  - `SchemaDefinition` (путь: `backend/packages/SchemaDefinition`) -
    модуль источник истины о схеме БД.

## Временные оперативные файлы

Каталоги `tasks/`, `logs/`, `inbox/` используются только как временные
оперативные файлы для текущих работ и диагностики.

Для длительного использования этой кодовой базы они не являются
значимыми артефактами и не должны рассматриваться как часть постоянной
истории проекта.

## Карта документации

### Обслуживание

- [ADMIN_MANUAL](docs/manual/ADMIN_MANUAL.md) — серверные настройки и
  служебные скрипты;
- [DEPLOY](infrastructure/DEPLOY.md) — развёртывание, наблюдаемость,
  диагностика поломок и техническое обслуживание;

### Использование

- [USER_MANUAL](docs/manual/USER_MANUAL.md) — работа с front office
  для получения информации картотеки;
- [CLERC_MANUAL](docs/manual/CLERC_MANUAL.md) — работа с данными
  картотеки: способы ввода и редактирования (+требования качества);

### Разработка

- [IMPLEMENTATION](docs/foundations/IMPLEMENTATION.md) — техническое
  устройство системы as-is.
- [TESTING](docs/manual/TESTING.md) — режимы и правила запуска тестов
  (изолированные env/config, quick/ui профили, локальные и docker
  сценарии).
- [backend/README](backend/README.md) — вход в backend-зону;
- [frontend/README.md](frontend/README.md) — вход во frontend-зону;

## Локальный запуск

### Front office

```bash
cd frontend
npm i
cp example.env .env
npm run dev
```

Переменная окружения:

- `VITE_API_BASE_URL` — базовый URL backend API. Для same-origin схемы
  используйте `/api/v1`.

Дополнительные команды:

```bash
cd frontend
npm run build
npm run preview
npm run test
npm run test:api:online
npm run test:ui:mock   # offline UI на mock-данных
npm run test:e2e       # online e2e (нужен backend)
```

### Переключение настроек работу между Windows и WSL

В Системе есть платформенно зависимые настройки:

- пути к файлам SQLite
- node js модули для тестирования с использованием браузера
- инструменты автоматического форматирования текстовых файлов
- путь к версии PHP для локального запуска тестов (не docker container)

Чтобы все эти инструменты уживались в одном проекте, для переключения
между ними разработан скрипт `swap-env`.

Для начала определите, подходят ли ваши файлы текущей среде выполнения:

```powershell
pwsh ./scripts/swap-env.ps1
``` 

Если нет, то загрузите ранее созданный набор файлов

```powershell
pwsh ./scripts/swap-env.ps1 load
```

Если у вас нет набора файлов для текущей среды выполнения, то создайте
его обычным образом и запишите для будущего использования:

```powershell
pwsh ./scripts/swap-env.ps1 save
```

### Backend и back office

```bash
cd backend
composer install
cp example.env .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=AdminUserSeeder
php artisan serve
```

вход в back office MoonShine:

- URL: `/admin/login`
- Локальные значения учётки берутся из `backend/.env` (создаётся из
  `backend/example.env`) -> `MOONSHINE_ADMIN_*`

Архитектурный инвариант backend:

- backend разделён на 2 runtime-модуля:
  - `backend/apps/ShopAPI` — модуль `ShopAPI` (выдаёт данные по
    запросу);
  - `backend/apps/ShopOperator` — модуль `DatabaseOperator` редактор
    для базы данных.
- общий пакет схемы данных:
  - `backend/packages/SchemaDefinition` — модуль `SchemaDefinition`.
- логи пишутся в 2 отдельных файла:
  - `backend/apps/ShopAPI/storage/logs/laravel.log`;
  - `backend/apps/ShopOperator/storage/logs/laravel.log`.

### Dev runtime с выбором php target (override)

Запуск dev-runtime c `php` target = `dev`:

```powershell
docker compose -f .\deploy\runtime\docker-compose.dev.yml -f .\deploy\runtime\docker-compose.dev.target-dev.yml up --build -d
```

Запуск dev-runtime c `php` target = `prod` (локальный smoke-тест
prod-сборки backend):

```powershell
docker compose -f .\deploy\runtime\docker-compose.dev.yml -f .\deploy\runtime\docker-compose.dev.target-prod.yml up --build -d
```

Остановка контейнеров (пример для dev target):

```powershell
docker compose -f .\deploy\runtime\docker-compose.dev.yml -f .\deploy\runtime\docker-compose.dev.target-dev.yml down
```

Важно: при явном использовании `-f` override-файлы не подхватываются
автоматически, их нужно перечислять в команде явно.

Важно: dev/prod рантаймы используют разные теги образов
(`autoteka/runtime-php:dev|prod`, `autoteka/runtime-web:dev|prod`),
чтобы сборка одного профиля не перетирала другой профиль.

После пересборки dev-runtime, если API отвечает `500` из-за пустой БД
(`no such table`), выполните миграции/seed в DatabaseOperator:

Создать учётную запись админа

```powershell
docker exec autoteka-dev-php sh -lc "cd /workspace/backend/apps/ShopOperator && php artisan migrate --force && php artisan db:seed --class=AdminUserSeeder --force"
```

## Шаблоны env и рабочие env-файлы

- `frontend/example.env` — шаблон frontend-конфига. Локально:
  `cp frontend/example.env frontend/.env`. Подробности:
  [ADMIN_MANUAL §6.1](docs/manual/ADMIN_MANUAL.md),
  [DEPLOY §5](infrastructure/DEPLOY.md).
- `backend/example.env` — шаблон Laravel-конфига. Локально:
  `cp backend/example.env backend/.env`. Подробности:
  [ADMIN_MANUAL §6.2](docs/manual/ADMIN_MANUAL.md),
  [DEPLOY §5.3](infrastructure/DEPLOY.md).
- `/etc/autoteka/deploy.env` — server-side deployment config для
  `AUTOTEKA_ROOT`, `BRANCH`, `REMOTE`, `HTTP_PORT`. Подробности:
  [DEPLOY §5.1](infrastructure/DEPLOY.md).
- `/etc/autoteka/telegram.env` — server-side Telegram config для
  rollout/watchdog/maintenance уведомлений. Подробности:
  [DEPLOY §5.2](infrastructure/DEPLOY.md),
  [ADMIN_MANUAL §6.3](docs/manual/ADMIN_MANUAL.md).

## Профили тестирования

Из корня монорепозитория доступны два явных профиля:

- `npm run test:profile:offline` — offline-проверки (frontend unit+UI
  mock, backend phpunit + real-db, system/deploy tests).
- `npm run test:profile:installation-e2e` — проверка конкретной
  инсталляции с online API/e2e интеграцией frontend+backend.

Для online-проверок используйте явные переменные окружения:

```bash
# frontend API integration tests
API_BASE_URL=http://127.0.0.1/api/v1 npm --prefix frontend run test:api:online

# frontend online e2e
PLAYWRIGHT_BASE_URL=http://127.0.0.1 npm --prefix frontend run test:e2e
```
