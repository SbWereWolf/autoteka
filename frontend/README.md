# Frontend Автотеки

**Актуально по коду на 2026-06-10.**

Frontend реализован на Vue 3 + Vite и отвечает за front office:

- каталог магазинов (мобильный и десктоп-канон);
- страницу магазина с медиа-галереей, контактами и действиями;
- bottom-sheet акций на мобиле, sticky-шапку с выбором города на десктопе;
- offline UI mock-тесты и online e2e для живого контура;
- promo-first загрузку карточки магазина и promo-секцию.

Брейкпоинт мобайл↔десктоп — `64rem` (1024px), `useIsDesktop`.

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

- `test:ui:mock` — offline UI-тесты на заглушках: поднимается только
  frontend, API перехватывается в Playwright. Дефолтный вьюпорт — мобильный
  `390×844`; десктоп-кейсы ставят вьюпорт per-test (`1280×800`, `1440×900`).
- `test:e2e` — online e2e для установленного контура frontend+backend
  без API-моков.

Для разработки используйте последовательный цикл:

1. сначала `npm run test:ui:mock`,
2. затем `npm run test:e2e` только на готовом живом контуре.

Для online-запусков:

```bash
# API integration (Vitest)
API_BASE_URL=http://127.0.0.1/api/v1 npm run test:api:online

# online e2e (Playwright)
PLAYWRIGHT_BASE_URL=http://127.0.0.1 npm run test:e2e
```

## Основные маршруты

- `/` — каталог (`CatalogPage`);
- `/shop/:code` — страница магазина (`ShopPage`).

## Мобильный канон (`<64rem`)

- **Каталог:** верхняя панель (гамбургер → дровер фильтров с выбором города
  и категориями-чипами `CategoryChips`), грид тайлов магазинов (`ShopTile`),
  фон-паттерн. Внизу — бар «Акции» (`CatalogOffersBar`), открывающий
  bottom-sheet акций (`CatalogOffersSheet`) вместо сортировки.
- **Карточка магазина:** full-bleed hero-галерея (свайп/стрелки/точки,
  `GalleryCarousel`), кнопки «Назад» и «Поделиться» поверх hero, контент-«шит»
  (имя, бейджи, слоган/описание, контакты «иконка + текст», «Время работы»),
  нижний action-бар (Маршрут + телефон/Telegram/WhatsApp/сайт/поделиться,
  `ShopContactActions`).

## Десктоп-канон (`≥64rem`)

- **Sticky-шапка** (`TopBar`): логотип + город-pill с поповером (`CityPill`),
  band ≤1600; на каталоге и на странице магазина.
- **Каталог:** sticky-sidebar фильтров (категории) + контентная колонка
  с тулбаром (счётчик + активные чипы + сорт-дропдаун,
  `CatalogToolbar` / `CatalogSortDropdown`); адаптивная сетка 3 кол. /
  4 кол. с `1440px`; состояния empty/error — центрированный
  `DesktopState` (`CatalogState`).
- **Магазин:** две колонки (галерея + описание + промо слева; sticky
  `ds-card` справа: контакты + действия Маршрут/иконки), контейнер ≤1120.

## Composables

В `src/composables/` — переиспользуемая логика, чтобы `pages/` оставались
тонкими оболочками над шаблоном и навигацией:

- `useCatalogCityShops` — загрузка/сортировка выдачи каталога по городу;
- `useCatalogOffers` — промо для bottom-sheet акций (магазины выдачи с
  feature «Акции»; параллельные запросы, кэш на жизнь страницы);
- `useShopPageLoader` — карточка магазина: параллелит
  `GET /shop/{code}` и `GET /shop/{code}/promotion`, ранний рендер
  promo, ограниченный retry для transient promo-ошибок, без отдельной
  ошибки promo пользователю;
- `useShopContactRows` — строки контактов (десктоп/мобайл) и primary-действия
  для баров;
- `useShareLink` — `navigator.share` + clipboard-фолбэк + озвучка;
- `useFocusTrap`, `useIsDesktop`, `useAnnouncer`, `useGalleryVideoAudioState`.

## API-конфигурация

Используется `VITE_API_BASE_URL` из `frontend/.env`;
`frontend/example.env` — шаблон. Для same-origin:

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

### Режимы frontend в dev/debug

#### `FRONTEND_MODE=source`

Используйте для обычной разработки UI:

- работает Vite dev server;
- изменения в исходниках отражаются сразу;
- доступен hot reload.

#### `FRONTEND_MODE=bundle-watch`

Используйте, когда нужна отладка собранного frontend:

- работает `vite build --watch`;
- nginx отдаёт `frontend/dist`;
- при `VITE_BUILD_SOURCEMAP=true` доступен mapping bundle на исходники.
