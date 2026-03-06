# Автотека — monorepo (frontend + backend + deploy)

**Актуально по коду на 2026‑03‑06.**

## Что это

Монорепозиторий:

- `frontend/` — клиентский SPA‑макет (Vue/Vite)
- `backend/` — Laravel 12 + MoonShine 4 (admin panel)
- `deploy/` — всё, что относится к деплою
  (compose/nginx/systemd/скрипты/метрики)

Документация по устройству текущего фронта:

- [IMPLEMENTATION](docs/foundations/IMPLEMENTATION.md)
- [USER_MANUAL](docs/foundations/USER_MANUAL.md)
- [IMPLEMENTATION](docs/foundations/IMPLEMENTATION.md)

Деплой:

- [DEPLOY](deploy/DEPLOY.md)

## Запуск frontend локально

Из `frontend/`:

```bash
cd frontend
npm i
cp .env.example .env
npm run dev
```

Переменные окружения frontend:

- `VITE_API_BASE_URL` — базовый URL backend API, по умолчанию
  `http://127.0.0.1:8000/api/v1`

Сборка/превью:

```bash
cd frontend
npm run build
npm run preview
```

## Запуск backend локально

Из `backend/`:

```bash
cd backend
composer install
cp example.env .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=AdminUserSeeder
php artisan serve
```

Админка MoonShine:

- URL: `http://127.0.0.1:8000/admin/login`
- Логин/пароль по умолчанию: `admin@example.com` / `admin12345`
- Рекомендуется переопределить `MOONSHINE_ADMIN_*` в `.env`

## Проверки данных и ассетов (frontend)

```bash
cd frontend
npm run check:data
```

## E2E тестирование UI (Playwright)

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
npm run test:e2e:headed
```

## Общий линт репозитория

Из корня:

```bash
npm i
npm run lint
```
