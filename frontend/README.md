# Frontend Автотеки

**Актуально по коду на 2026-03-07.**

Frontend реализован на Vue 3 + Vite и отвечает за front office:

- каталог магазинов;
- карточку магазина;
- выбор города, категорий и фишки;
- переключение темы и runtime theme editor.

## Быстрый запуск

```bash
cd frontend
npm install
cp example.env .env
npm run dev
```

## Основные команды

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:api:online
npm run test:e2e
npm run test:ui:mock
npm run check:data
```

Где:

- `test:e2e` — online e2e для установленного контура frontend+backend
  (без API-моков; нужен работающий backend).
- `test:ui:mock` — offline UI-тесты на mock-данных (поднимается только
  frontend, API перехватывается в Playwright).

Для online-запусков используйте:

```bash
# API integration (Vitest)
API_BASE_URL=http://127.0.0.1/api/v1 npm run test:api:online

# online e2e (Playwright)
PLAYWRIGHT_BASE_URL=http://127.0.0.1 npm run test:e2e
```

Дополнительные data/media команды:

- `npm run check:unused-assets`
- `npm run images:regen`

## Основные маршруты

- `/` — каталог;
- `/shop/:code` — карточка магазина.

## API-конфигурация

Используется `VITE_API_BASE_URL` из `frontend/.env`. Файл
`frontend/example.env` используется как шаблон для создания
`frontend/.env`.

Для same-origin схемы (production/deploy):

```text
VITE_API_BASE_URL=/api/v1
```

## Что читать дальше

- `../README.md` — карта проекта и документации.
- `../docs/foundations/USER_MANUAL.md` — пользовательские сценарии.
- `../docs/foundations/ADMIN_MANUAL.md` — администрирование и theme
  editor.
- `../docs/foundations/IMPLEMENTATION.md` — техническая реализация.
