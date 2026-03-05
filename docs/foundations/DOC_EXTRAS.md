# Дополнительные разделы документации

**Дата актуализации: 2026-03-03.**

## 1) Архитектура и потоки данных (as‑is)

### Модули и роли

- `frontend/src/mocks/*` — источник данных (справочники + магазины)
- `frontend/src/state.ts` — единое глобальное состояние (без
  Pinia/Vuex)
- `frontend/src/utils/*` — чистые утилиты (localStorage, сортировка)
- `frontend/src/router/*` — маршрутизация
- `frontend/src/pages/*` — страницы (Catalog/Shop)
- `frontend/src/components/*` — UI‑компоненты (меню, плитки, карусель)
- `frontend/src/styles/*` — токены темы + примитивы UI + фон‑паттерн
- `frontend/public/*` — ассеты (обои и картинки магазинов)

### Поток: меню → состояние → каталог

1. Пользователь меняет город/категории/фишку в `HamburgerMenu`
2. Компоненты вызывают `setCity/toggleCategory/setFeature`
3. `CatalogPage` читает `state.*`, фильтрует по городу и сортирует
   через `sortShopsByRules`
4. Сетка `ShopTile` перерисовывается

### Поток: карточка → внешний переход

1. `ShopPage` получает `code` из URL и ищет объект в `shops.json`
2. По кнопке или overscroll выполняется
   `window.location.href = siteUrl`

---

## 2) Гайд «как добавить/изменить X» (без бэкенда)

### Добавить город

1. `frontend/src/mocks/city-list.json`: добавить объект
   `{ "code": "new-city", "name": "Новый город", "sort": 999 }`
2. Для магазинов этого города в `frontend/src/mocks/shops.json`
   поставить `cityCode: "new-city"`
3. Если хотите дефолт — поставить `isDefault: true` (желательно ровно
   у одного города).

### Добавить категорию/фишку

1. Добавить запись в `category-list.json` или `feature-list.json`
2. В `shops.json`: использовать **точно такую же строку** в
   `categoryCodes[]`/`featureCodes[]`
3. Дефолтная фишка берётся как первая запись `feature-list` по `sort`.

### Добавить тему

1. `theme-list.json`: добавить объект темы с новым `id`
2. `frontend/src/styles/themes.css`: добавить блок
   `.theme-<id> { ... }`
3. (Опционально) добавить новый файл обоев в `frontend/public/bg/*` и
   сослаться на него через `--app-bg-image`.

### Добавить магазин

1. `shops.json`: добавить объект с полями
   `code/name/cityCode/categoryCodes/featureCodes/workHours/description/contacts/siteUrl`
2. Картинки:
   - положить файлы в `frontend/public/generated/*`
   - указать `thumbUrl: "/generated/xxx.png"` и (если нужно)
     `galleryImages: ["/generated/a.png", ...]`
3. Проверить, что `code` уникален и что карточка открывается по
   `/shop/<code>`.

### Добавить новый тип контакта (требует кода)

Тут уже нужна правка `frontend/src/pages/ShopPage.vue`: правила
формирования ссылки/label/target для нового `contact.type`.

---

## 3) Известные долги/расхождения (по коду)

- CI пока не запускает `npm run check:data` автоматически в PR.
- Ручной smoke-тест UI остаётся обязательным после крупных правок.
- Есть документация с пересекающимся содержимым (`README.md`,
  `IMPLEMENTATION.md`, `DOC_EXTRAS.md`) — нужен единый процесс
  синхронизации.

---

## 4) Набросок контракта будущего API (предложение)

Эти пункты можно начать описывать уже сейчас, чтобы заменить моки
API‑вызовами без изменения UI.

### 4.1. Справочники

- `GET /api/dicts` → `cities, categories, features`  
  Темы можно оставить фронтенд‑конфигом (CSS), либо тоже отдавать
  (если нужны A/B тесты).

### 4.2. Каталог

- `GET /api/shops?cityCode=<code>` → список карточек (минимальный
  набор: `code,name,thumbUrl,categoryCodes,featureCodes`)
  - важно: сортировка сейчас на фронте — можно оставить фронтовой,
    либо переносить на бэк.

### 4.3. Карточка

- `GET /api/shops/<code>` → полная карточка
  (`description, contacts, workHours, siteUrl, galleryImages`)

> Продуктовое решение, которое нужно уточнять: какие поля должны быть
> «истиной» (бэк) и какие останутся фронтовыми (темы, декоративные
> паттерны, тексты по умолчанию и т.д.).

---

## 5) Чек‑лист качества (можно внедрять без уточнений)

### Доступность (a11y)

- меню закрывается по Escape и возвращает фокус (уже есть)
- у интерактивных элементов видимый `:focus-visible` (есть)
- проверить `aria-label` у иконок/кнопок, если добавятся
- проверить контраст `--text`/`--surface-*` (особенно для accent тем)

### Производительность

- изображения: `loading="lazy"` и `decoding="async"` (частично есть)
- избегать тяжёлых CSS‑фильтров на больших областях (не поднимать
  saturate/brightness слишком высоко)
- держать размер `frontend/public/generated/*` под контролем (скрипт
  проверки)

---

## 6) Автоматизация проверок (можно сделать без продуктовых решений)

- `npm run validate:mocks` — проверка консистентности моков и наличия
  файлов
- `npm run check:unused-assets` — проверка лишних/пропущенных файлов в
  `frontend/public/generated/*`
- `npm run check:data` — агрегатор (`validate:mocks` +
  `check:unused-assets`)

(Команды уже доступны в `package.json`; следующий шаг — подключить их
в CI.)
