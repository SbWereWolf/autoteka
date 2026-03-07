# Автотека — картотека магазинов автомобильной тематики

## Что в репозитории

- `deploy/` — инфраструктура развёртывания, автодеплоя, наблюдаемости
  и техобслуживания;
- `frontend/` — frontend на Vue3/Vite для front office;
- `backend/` — backend на Laravel 12 с MoonShine 4 для back office;

## Временные оперативные файлы

Каталоги `tasks/` и `logs/` используются только как временные
оперативные файлы для текущих работ и диагностики.

Для длительного использования этой кодовой базы они не являются
значимыми артефактами и не должны рассматриваться как часть постоянной
истории проекта.

## Карта документации

### Обслуживание

- [ADMIN_MANUAL](docs/manual/ADMIN_MANUAL.md) — редактор для тем
  оформления, организация работы back office, серверные настройки и
  служебные скрипты;
- [DEPLOY](deploy/DEPLOY.md) — развёртывание, наблюдаемость,
  диагностика поломок и техническое обслуживание;

### Использование

- [USER_MANUAL](docs/manual/USER_MANUAL.md) — работа с front
  office для получения информации картотеки;
- [CLERC_MANUAL](docs/manual/CLERC_MANUAL.md) — работа с данными
  картотеки: способы ввода и редактирования (+требования качества);

### Разработка

- [IMPLEMENTATION](docs/foundations/IMPLEMENTATION.md) — техническое
  устройство системы as-is.
- [backend/README](backend/README.md) — быстрый вход в backend-зону;
- [frontend/README.md](frontend/README.md) - вход во frontend-зону;

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

## Шаблоны env и рабочие env-файлы

- `frontend/example.env` — шаблон frontend-конфига. Локально:
  `cp frontend/example.env frontend/.env`. Подробности:
  [ADMIN_MANUAL §6.1](docs/manual/ADMIN_MANUAL.md),
  [DEPLOY §5](deploy/DEPLOY.md).
- `backend/example.env` — шаблон Laravel-конфига. Локально:
  `cp backend/example.env backend/.env`. Подробности:
  [ADMIN_MANUAL §6.2](docs/manual/ADMIN_MANUAL.md),
  [DEPLOY §5.3](deploy/DEPLOY.md).
- `/etc/autoteka/deploy.env` — server-side deployment config для
  `AUTOTEKA_ROOT`, `BRANCH`, `REMOTE`, `HTTP_PORT`. Подробности:
  [DEPLOY §5.1](deploy/DEPLOY.md).
- `/etc/autoteka/telegram.env` — server-side Telegram config для
  deploy/watchdog/maintenance уведомлений. Подробности:
  [DEPLOY §5.2](deploy/DEPLOY.md),
  [ADMIN_MANUAL §6.3](docs/manual/ADMIN_MANUAL.md).
