# Автотека — monorepo (frontend + backend + deploy)

**Актуально по коду на 2026‑03‑05.**

## Что это

Монорепозиторий:

- `frontend/` — клиентский SPA‑макет (Vue/Vite)
- `backend/` — заготовка под будущий Laravel + MoonShine
- `deploy/` — всё, что относится к деплою (compose/nginx/systemd/скрипты/метрики)

Документация по устройству текущего фронта:

- [IMPLEMENTATION](docs/foundations/IMPLEMENTATION.md)
- [USER_MANUAL](docs/foundations/USER_MANUAL.md)
- [DOC_EXTRAS](docs/foundations/DOC_EXTRAS.md)

Деплой:

- [DEPLOY](deploy/DEPLOY.md)

## Запуск frontend локально

Из `frontend/`:

```bash
cd frontend
npm i
npm run dev
```

Сборка/превью:

```bash
cd frontend
npm run build
npm run preview
```

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
