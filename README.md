# Автотека — monorepo

**Актуально по коду на 2026-03-06.**

## Что в репозитории

- `frontend/` — front office на Vue/Vite.
- `backend/` — backend на Laravel 12 с MoonShine 4 для back office.
- `deploy/` — инфраструктура развёртывания, автодеплоя, наблюдаемости
  и техобслуживания.

## Карта документации

- [IMPLEMENTATION](docs/foundations/IMPLEMENTATION.md) — техническое
  устройство системы as-is.
- [USER_MANUAL](docs/foundations/USER_MANUAL.md) — работа с front
  office для обычного пользователя.
- [ADMIN_MANUAL](docs/foundations/ADMIN_MANUAL.md) — редактор темы,
  back office, серверные настройки и служебные скрипты.
- [DEPLOY](deploy/DEPLOY.md) — развёртывание, наблюдаемость,
  диагностика поломок и техническое обслуживание.
- [backend/README](backend/README.md) — быстрый вход в backend-зону.

## Локальный запуск

### Front office

```bash
cd frontend
npm i
npm run dev
```

Переменная окружения:

- `VITE_API_BASE_URL` — базовый URL backend API. Для same-origin
  схемы используйте `/api/v1`.

Дополнительные команды:

```bash
cd frontend
npm run build
npm run preview
npm run check:data
npm run test
```

### Backend и back office

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed --class=AdminUserSeeder
php artisan serve
```

Back office MoonShine:

- URL: `http://127.0.0.1:8000/admin/login`
- Логин по умолчанию: `admin@example.com`
- Пароль по умолчанию: `admin12345`
- Production-значения нужно задавать через `MOONSHINE_ADMIN_*` в
  `backend/.env`

## Рабочие env-файлы

- `frontend/.env` — runtime-конфиг frontend сборки.
  Подробности: [ADMIN_MANUAL §6.1](docs/foundations/ADMIN_MANUAL.md),
  [DEPLOY §5](deploy/DEPLOY.md).
- `backend/.env` — runtime-конфиг Laravel backend.
  Подробности: [ADMIN_MANUAL §6.2](docs/foundations/ADMIN_MANUAL.md),
  [DEPLOY §5.3](deploy/DEPLOY.md).
- `/etc/autoteka/deploy.env` — server-side deployment config для
  `AUTOTEKA_ROOT`, `BRANCH`, `REMOTE`, `HTTP_PORT`.
  Подробности: [DEPLOY §5.1](deploy/DEPLOY.md).
- `/etc/autoteka/telegram.env` — server-side Telegram config для
  deploy/watchdog/maintenance уведомлений.
  Подробности: [DEPLOY §5.2](deploy/DEPLOY.md),
  [ADMIN_MANUAL §6.3](docs/foundations/ADMIN_MANUAL.md).

## Основные проверки

Из `frontend/`:

```bash
npm run check:data
npm run test:e2e
```

Из корня:

```bash
npm i
npm run lint
```

## Что читать в зависимости от задачи

- Нужно понять устройство frontend/backend: `IMPLEMENTATION`.
- Нужно пользоваться сайтом как клиент: `USER_MANUAL`.
- Нужно работать с админкой, theme editor или служебными скриптами:
  `ADMIN_MANUAL`.
- Нужно развернуть систему или расследовать инцидент: `DEPLOY`.
