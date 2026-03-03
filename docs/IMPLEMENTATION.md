# Документация по реализации (по коду)

**Дата актуализации: 2026-03-03.**  
Документ предназначен для использования, сопровождения и дальнейшего
развития макета.

---

## 1. Сущности и компоненты

### 1.1. Сущности (модели данных)

#### City

Файл: `src/mocks/dicts.json`

- `id: string` — ключ (используется в `shop.city` и `state.cityId`)
- `name: string` — отображаемое имя
- `isDefault?: boolean` — какой город выбирать при первом запуске

**Влияние:** фильтрация каталога.

#### Category / Feature

Файл: `src/mocks/dicts.json`

- `categories: string[]`
- `features: string[]`

**Влияние:** только сортировка (не фильтрация).  
**Важно:** совпадение по строкам, без нормализации.

#### Theme

Файл: `src/mocks/dicts.json`, CSS: `src/styles/themes.css`

- `id: string` → класс `.theme-<id>`
- `label: string` → текст в UI
- `style/palette/icon` → мета‑инфо для UI

**Влияние:** набор CSS‑переменных. Значение темы сохраняется в
`localStorage`.

#### Shop

Файлы: `src/mocks/shops.json`, тип: `src/types/shop.ts`

Ключевые поля (фактическое использование):

- `id, name, city`
- `categories: string[]`, `features: string[]`
- `workHours: string`, `description: string`
- `contacts: Array<{type:string;value:string}>`
- `siteUrl: string`
- `thumbUrl?: string`
- `galleryImages?: string[]` — если непусто, включается карусель

---

### 1.2. Компоненты (Vue)

#### `TopBar.vue`

- фиксированная верхняя панель
- кнопка открытия меню
- `ThemeSwitcher`

#### `HamburgerMenu.vue`

- overlay + панель
- закрытие: overlay/крестик/Escape
- возврат фокуса на исходный элемент
- внутри: `CitySelect`, `CategoryChips`, `FeatureSelect`

#### `CitySelect.vue`

- `<select>` города
- `setCity(cityId)` обновляет `state.cityId`
- значение сохраняется в `localStorage` (ключ `autoteka_city`)

#### `CategoryChips.vue`

- кнопки‑чипсы
- `toggleCategory(cat)` обновляет `state.selectedCategories`
- влияет на сортировку
- список выбранных категорий сохраняется в `localStorage`
  (`autoteka_categories`)

#### `FeatureSelect.vue`

- кастомный dropdown
- `setFeature(feature)` обновляет `state.selectedFeature`
- влияет на сортировку
- выбранная фишка сохраняется в `localStorage` (`autoteka_feature`)

#### `ShopTile.vue`

- плитка магазина (квадрат)
- `thumbUrl` опционален, иначе декоративный градиент
- `loading="lazy"`/`decoding="async"` для изображений

#### `GalleryCarousel.vue`

- поддерживает `items` как `string[]` (URL) или как объектные элементы
- свайп (pointer events), prev/next
- использует параметры из `src/config/ui.ts`

#### `OverscrollOpenLink.vue`

- переход на внешний URL, если пользователь «дотянул вниз» в конце
  страницы
- работает для touch и wheel
- использует параметры из `src/config/ui.ts`

---

## 2. Сигнатуры функций/методов и формат данных

### 2.1. Глобальное состояние

Файл: `src/state.ts`

- `state.theme: ThemeId`
- `state.menuOpen: boolean`
- `state.cityId: string`
- `state.selectedCategories: string[]`
- `state.selectedFeature: string`

Методы:

- `setTheme(themeId)`
- `setCity(cityId)`
- `toggleCategory(cat)`
- `setFeature(feature)`

Сохранение:

- `autoteka_theme`
- `autoteka_city`
- `autoteka_categories`
- `autoteka_feature`

При чтении применяются проверки и fallback:

- `sanitizeTheme`
- `sanitizeCity`
- `sanitizeCategories`
- `sanitizeFeature`

### 2.2. Сортировка

Файл: `src/utils/sortShops.ts`

```ts
sortShopsByRules({
  shops,
  selectedCategories,
  selectedFeature
}) => Shop[]
```

Правила:

- A = есть выбранная категория
- B = иначе
- 1 = есть выбранная фишка
- 2 = иначе
- итог: A1 → A2 → B1 → B2

### 2.3. Storage helpers

Файл: `src/utils/storage.ts`

- `loadLocal(key, fallback)`
- `saveLocal(key, value)`

---

## 3. Use cases (фактические)

1. Открыть приложение → каталог выбранного по умолчанию города.
2. Открыть/закрыть меню (overlay/крестик/Escape) → фокус возвращается.
3. Выбрать город → фильтруется каталог и сохраняется после
   перезагрузки.
4. Выбрать категории/фишку → меняется порядок плиток по алгоритму и
   сохраняется после перезагрузки.
5. Открыть магазин → `/shop/:id`.
6. В карточке: кнопка «Перейти на сайт» → переход.
7. В карточке: «доскролл вниз» → переход (touch/wheel).
8. Переключить тему → сохраняется и восстанавливается из
   `localStorage`.

---

## 4. Страницы и возможности

### `/` Каталог

- список магазинов выбранного города
- сортировка по выбранным категориям/фишке
- переход в карточку магазина

### `/shop/:id` Карточка магазина

- название, режим работы, описание
- галерея (если есть `galleryImages`)
- контакты (часть кликабельна)
- переход на сайт кнопкой и overscroll

---

## 5. Настройки без правки «системной/бизнес логики»

### 5.1. Мок‑данные

- `src/mocks/dicts.json`
- `src/mocks/shops.json`

### 5.2. Темизация

- `src/styles/themes.css` — CSS‑переменные на уровне темы
- `src/styles/tailwind.css` — базовые утилиты/классы UI

### 5.3. Брейкпоинты

- `tailwind.config.js` — screens `xs/sm/3xl/7xl`

### 5.4. UI-конфиг

- `src/config/ui.ts` — параметры overscroll и карусели
  (`uiConfig.overscroll.*`, `uiConfig.gallery.*`)

### 5.5. Ассеты

- `public/bg/*` — фоны стилей
- `public/generated/*` — изображения для плиток/галерей

---

## 6. Жёстко заданные значения (нельзя поменять без кода)

- Алгоритм сортировки: `src/utils/sortShops.ts`
- Роуты: `src/router/index.ts`
- Hover‑полифилл и селекторы: `src/main.ts`

---

## 7. Какие данные замоканы и как их менять

- Справочники: `src/mocks/dicts.json`
- Магазины: `src/mocks/shops.json`
- Картинки: `public/generated/*` (проверяются командой
  `npm run check:unused-assets`)

---

## 8. Проверки данных и ассетов

- `npm run validate:mocks`:
  - `shops[].city` в `dicts.cities[].id`
  - `shops[].categories[]` в `dicts.categories[]`
  - `shops[].features[]` в `dicts.features[]`
  - `dicts.defaultFeature` в `dicts.features[]`
  - `dicts.themes[].id` ↔ `.theme-<id>` в `src/styles/themes.css`
  - существование ссылок из `thumbUrl/galleryImages` (если заданы)
- `npm run check:unused-assets`:
  - отсутствие лишних/пропущенных файлов в `public/generated`
- `npm run check:data`:
  - агрегатор (`validate:mocks` + `check:unused-assets`)

---

## 9. Известные ограничения/долги (по текущей реализации)

- Нет CI-пайплайна для автоматического запуска `check:data` в PR.
- Ручной smoke-тест UI остаётся обязательным после крупных правок.
