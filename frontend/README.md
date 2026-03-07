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
npm run test:e2e
npm run check:data
```

Дополнительные data/media команды:

- `npm run validate:mocks`
- `npm run check:unused-assets`
- `npm run enrich:mocks`
- `npm run images:regen`
- `npm run images:moonshine`
- `npm run materialize:shop-media`
- `npm run sync:backend-media`

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
