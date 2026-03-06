# Backend Автотеки

**Актуально по коду на 2026-03-06.**

Backend реализован на Laravel 12 и используется для:

- API front office;
- back office на MoonShine 4;
- хранения и редактирования справочников и магазинов.

## Быстрый запуск

```bash
cd backend
composer install
cp example.env .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=AdminUserSeeder
php artisan serve
```

## Основные URL

- API base: `http://127.0.0.1:8000/api/v1`
- MoonShine login: `http://127.0.0.1:8000/admin/login`

## Initial admin

По умолчанию:

- email: `admin@example.com`
- password: `admin12345`

Production-значения задаются через:

- `MOONSHINE_ADMIN_NAME`
- `MOONSHINE_ADMIN_EMAIL`
- `MOONSHINE_ADMIN_PASSWORD`

## Что читать дальше

- `../docs/foundations/IMPLEMENTATION.md` — устройство backend и API.
- `../docs/foundations/ADMIN_MANUAL.md` — работа с back office и
  служебными командами.
- `../deploy/DEPLOY.md` — развёртывание и эксплуатация.
