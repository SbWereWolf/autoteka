# Frontend Автотеки

**Актуально по коду на 2026-03-26.**

Frontend реализован на Vue 3 + Vite и отвечает за front office:

- каталог магазинов;
- overlay-меню с выбором города и категорий;
- страницу магазина;
- offline UI mock-тесты и online e2e для живого контура.
- promo-first загрузку карточки магазина и promo-секцию.

Система тем и runtime theme editor из публичного интерфейса удалены.

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
npm run test:unit
npm run test:api:online
npm run test:e2e
npm run test:ui:mock
```

Где:

- `test:e2e` — online e2e для установленного контура frontend+backend
  без API-моков;
- `test:ui:mock` — offline UI-тесты на заглушках, где поднимается только
  frontend и API перехватывается в Playwright.

Для разработки используйте последовательный цикл:

1. сначала `npm run test:ui:mock`,
2. затем `npm run test:e2e` только на готовом живом контуре.

Для online-запусков используйте:

```bash
# API integration (Vitest)
API_BASE_URL=http://127.0.0.1/api/v1 npm run test:api:online

# online e2e (Playwright)
PLAYWRIGHT_BASE_URL=http://127.0.0.1 npm run test:e2e
```

## Основные маршруты

- `/` — каталог;
- `/shop/:code` — страница магазина.

## Composables

В `src/composables/` — переиспользуемая логика страниц (загрузка данных
каталога, контактные строки карточки магазина и т.п.), чтобы `pages/`
оставались тонкими оболочками над шаблоном и навигацией.

Для карточки магазина используется `useShopPageLoader.ts`:

- параллелит `GET /shop/{code}` и `GET /shop/{code}/promotion`;
- допускает ранний рендер promo-секции;
- не показывает пользователю отдельную ошибку promo;
- применяет ограниченный retry только для transient promo ошибок.

## API-конфигурация

Используется `VITE_API_BASE_URL` из `frontend/.env`. Файл
`frontend/example.env` используется как шаблон для создания
`frontend/.env`.

Для same-origin схемы:

```text
VITE_API_BASE_URL=/api/v1
```

Promotion route:

```text
GET /api/v1/shop/{code}/promotion
```

## Что читать дальше

- `../README.md` — карта проекта и документации.
- `../docs/manual/USER_MANUAL.md` — пользовательские сценарии.
- `../docs/manual/ADMIN_MANUAL.md` — администрирование магазина.
- `../docs/foundations/IMPLEMENTATION.md` — техническая реализация.
