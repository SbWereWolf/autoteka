# Autoteka (front) → Модель данных и “серверная основа” (backend/BFF)

**Дата:** 2026‑03‑04  
**Проект:** клиентский макет каталога магазинов автозапчастей (Vue
3).  
**Цель документа:** описать, какие данные реально потребляет фронтенд,
какие справочники и “общесайтовые” настройки существуют, и из каких
объектов должен состоять бэкенд, чтобы быть **точной моделью**
текущего фронта (с возможностью роста до зрелой системы).

---

## 0) Коротко: что фронту нужно от бэка

Фронт сейчас читает данные из моков:

- `src/mocks/dicts.json` — справочники и темы
- `src/mocks/shops.json` — список магазинов (полные карточки)
- `src/state.ts` — глобальное состояние + сохранение выбора в
  `localStorage`
- `src/utils/sortShops.ts` — алгоритм сортировки магазинов

Чтобы заменить моки на API **без переписывания UI**, бэкенд должен
отдавать:

- справочники (`cities`, `categories`, `features`, `defaultFeature`,
  опционально `themes`)
- список магазинов (в каталоге используется фильтр по городу +
  сортировка по выбранным категориям/фишке)
- карточку магазина по `id`

---

## 1) Как устроены данные на фронте (as‑is)

### 1.1 Источники данных

- **Справочники/темы:** `src/mocks/dicts.json`
- **Магазины:** `src/mocks/shops.json` (импортируется как
  `src/mocks/shops`)
- **Глобальное состояние:** `src/state.ts`
- **UI‑параметры:** `src/config/ui.ts`

### 1.2 Что хранится в `localStorage`

Ключи (см. `src/state.ts`):

| Ключ                  | Что хранится                      |
| --------------------- | --------------------------------- |
| `autoteka_theme`      | `themeId` (например, `a-neutral`) |
| `autoteka_city`       | `cityId` (например, `barnaul`)    |
| `autoteka_categories` | `string[]` выбранных категорий    |
| `autoteka_feature`    | строка выбранной фишки            |

На чтении применяется “санитайзинг” (проверка, что значения существуют
в справочниках), иначе используются fallback‑значения.

---

## 2) Что реально выводит UI (и значит требуется от API)

### 2.1 Каталог (`src/pages/CatalogPage.vue`)

Фронт делает:

1. фильтрует магазины по городу

```ts
shops.filter((s) => s.city === state.cityId);
```

1. сортирует результат по правилам
   `sortShopsByRules({ selectedCategories, selectedFeature })`

2. выводит плитки `ShopTile` и счётчик `{{ sorted.length }} шт.`

**Минимально необходимые поля магазина для каталога:**

- `id` (переход на `/shop/:id`)
- `name` (заголовок плитки)
- `city` (фильтр)
- `categories: string[]` (участвуют в сортировке)
- `features: string[]` (участвуют в сортировке)
- `thumbUrl?: string` (опциональная картинка плитки)

### 2.2 Карточка магазина (`src/pages/ShopPage.vue`)

Фронт:

- ищет магазин по `id` в массиве `shops`
- показывает `name`
- показывает `workHours` (как многострочный текст)
- показывает `description`
- показывает `contacts[]` с логикой формирования ссылок
- показывает кнопку “Перейти на сайт” если `siteUrl` не пустой
- показывает галерею: берёт `galleryImages` если массив, иначе пустое
  состояние

**Поля магазина, которые должны быть на бэке:**

- `id, name, city`
- `categories: string[]`, `features: string[]`
- `workHours: string`
- `description: string`
- `contacts: Array<{type: string; value: string}>`
- `siteUrl: string`
- `thumbUrl?: string`
- `galleryImages?: string[]`

---

## 3) Справочники (Dictionary / Reference Data)

Содержимое `src/mocks/dicts.json`:

### 3.1 City

```ts
type City = {
  id: string; // ключ, используется в shop.city и state.cityId
  name: string; // отображаемое имя
  isDefault?: boolean; // город по умолчанию при первом запуске
};
```

### 3.2 Category / Feature

На фронте это **просто строки**:

- `categories: string[]`
- `features: string[]`
- `defaultFeature: string` (должна существовать внутри `features[]`)

Важно: совпадение по строкам, **без нормализации** (опечатки = разные
значения).

### 3.3 Theme (UI‑конфиг)

Темы используются для применения CSS‑класса `.theme-<id>`.

```ts
type ThemeMeta = {
  id: string; // например, "a-neutral"
  label: string; // текст в UI
  style: string; // "A" | "B" | "C" (как мета)
  palette: string; // "Neutral" | "Accent" (как мета)
  icon: string; // эмодзи
};
```

**Рекомендация:** темы — это скорее _презентационный конфиг_, их
можно:

- оставить фронту (CSS‑токены живут в `src/styles/themes.css`), или
- отдавать бэком как часть конфигурации приложения (если захотите
  централизованное управление / A/B).

---

## 4) Контакты: типы и правила ссылок

Тип контакта — строка `Contact.type` (на фронте нет enum).

Фронтовая логика (`ShopPage.vue`):

- `phone` → `tel:` (с очисткой пробелов/скобок/дефисов)
- `email` → `mailto:`
- `telegram` и `whatsapp` → значение считается URL (открывается в
  новой вкладке, если начинается с `http`)
- `address` → просто текст (пока без карты)

Рекомендуемый серверный enum для валидации:

```ts
type ContactType =
  | "phone"
  | "email"
  | "telegram"
  | "whatsapp"
  | "address"
  | "text";
```

---

## 5) Алгоритм сортировки (важно для совместимости)

Файл: `src/utils/sortShops.ts`

Смысл:

1. Делим все магазины на A/B:

- **A**: есть хотя бы 1 совпадение по выбранным категориям
- **B**: иначе

1. Внутри каждой группы делим на “с выбранной фишкой / без”:

- `hasSelectedFeature(shop) => shop.features.includes(selectedFeature)`

1. Итоговый порядок:

- **A1**: есть категория + есть фишка
- **A2**: есть категория + нет фишки
- **B1**: нет категории + есть фишка
- **B2**: нет категории + нет фишки

Бэкенд может:

- оставить сортировку на фронте (как сейчас), или
- перенести сортировку на сервер (но тогда контракт должен явно
  фиксировать правила и тесты).

---

## 6) Что является “общесайтовым конфигом”, а не доменными сущностями

### 6.1 Сейчас точно “конфиг”

- темы (`themes[]`), т.к. это CSS‑токены/визуальное оформление
- параметры UI‑поведения (не бизнес‑данные):
  - `uiConfig.overscroll.thresholdPx` (см. `src/config/ui.ts`)
  - `uiConfig.overscroll.holdMs`
  - `uiConfig.overscroll.cooldownMs`
  - `uiConfig.gallery.swipeThresholdPx`
  - `uiConfig.gallery.transitionMs`

### 6.2 Может стать конфигом (если убрать хардкод)

- `appName` (в UI сейчас “Автотека”)
- дефолтный город (`defaultCityId` либо `cities.isDefault`)
- тексты пустых состояний/лейблы контактов (это ближе к i18n/контенту)

---

## 7) Из каких объектов должен состоять бэкенд (точная модель)

### 7.1 Доменные сущности

#### Shop (как на фронте, `src/types/shop.ts`)

```ts
export type Contact = {
  type: string;
  value: string;
};

export type Shop = {
  id: string;
  name: string;
  city: string; // cityId
  categories: string[];
  features: string[];
  workHours: string; // многострочный текст
  description: string;
  contacts: Contact[];
  siteUrl: string;
  thumbUrl?: string;
  galleryImages?: string[];
};
```

### 7.2 Справочники

- `City`
- `Category` (на старте может быть просто `string`)
- `Feature` (на старте может быть просто `string`)
- _(опционально)_ `ThemeMeta` (как конфиг)
- _(опционально)_ `ContactType` (enum/справочник для валидации)

### 7.3 Конфиг приложения (site‑level)

- `defaultFeature`
- _(опционально)_ `defaultCityId` или `isDefault` в `City`
- _(опционально)_ `themes[]` (если решите хранить централизованно)

---

## 8) Варианты хранения в БД (быстро vs правильно)

### Вариант A: “1:1 с фронтом” (быстрый старт)

- Таблица `shops` содержит `categories` и `features` как JSON‑массивы
  строк
- `contacts` тоже можно хранить как JSON, либо отдельной таблицей

**Плюсы:** минимум кода и миграций.  
**Минусы:** консистентность строк нужно держать валидацией.

### Вариант B: нормализованная модель (надёжно для роста)

Таблицы (набросок):

- `cities(id, name, is_default)`
- `categories(id, name)`
- `features(id, name, is_default)`
- `shops(id, name, city_id, work_hours, description, site_url, thumb_url)`
- `shop_categories(shop_id, category_id)`
- `shop_features(shop_id, feature_id)`
- `shop_contacts(id, shop_id, type, value, sort_order)`
- `shop_media(id, shop_id, url, kind, sort_order)` — для thumb/gallery

API при этом всё равно может отдавать `categories: string[]` и
`features: string[]` (по `name`), чтобы фронт не менять.

---

## 9) Набросок контракта API (чтобы заменить моки)

### 9.1 Справочники

`GET /api/dicts`

```json
{
  "cities": [
    { "id": "barnaul", "name": "Барнаул", "isDefault": true }
  ],
  "categories": ["Отечественные запчасти", "…"],
  "features": ["самая быстрая доставка", "…"],
  "defaultFeature": "самая быстрая доставка",
  "themes": [
    {
      "id": "a-neutral",
      "label": "A • Neutral",
      "style": "A",
      "palette": "Neutral",
      "icon": "🌤️"
    }
  ]
}
```

> `themes` можно не отдавать (оставить на фронте), если не нужно
> управлять темами с сервера.

### 9.2 Каталог

`GET /api/shops?cityId=<id>`

Опции:

- **Просто:** отдавать список `Shop` полностью (как моки).
- **Экономнее:** отдавать карточки
  `{ id, name, thumbUrl, categories, features, city }` и подгружать
  детали отдельно.

### 9.3 Карточка

`GET /api/shops/<id>` → полный `Shop`

---

## 10) Минимальные правила валидации (чтобы не ломать UI)

1. `shop.city` должен существовать в `dicts.cities[].id`
2. `shop.categories[]` должны быть подмножеством `dicts.categories[]`
3. `shop.features[]` должны быть подмножеством `dicts.features[]`
4. `dicts.defaultFeature` должен существовать в `dicts.features[]`
5. `shop.id` уникален
6. `shop.siteUrl` может быть пустым — UI корректно показывает “Сайт
   недоступен”
7. `galleryImages` может отсутствовать/быть пустым — UI показывает
   empty‑state

---

## 11) Чего **не требуется** для точного соответствия текущему фронту

- Пользователи/авторизация (выборы живут в localStorage)
- CRUD/админка (в ТЗ явно “не входит” для макета)
- Метрики/аналитика
- Заказы/оплаты/склад/доставка (в модели пока нет)

> Но при росте системы админка/CRUD логично появится: ресурсы `Shop`,
> `City`, `Category`, `Feature`, `Media`, `Contact` + роли
> “оператор/админ”.

---

## 12) Практичный next-step (если идти в реализацию)

1. Поднять BFF слой, который отдаёт `/api/dicts`, `/api/shops`,
   `/api/shops/:id`
2. Перевести фронт с импортов моков на fetch (без изменения
   компонентов)
3. Добавить серверную валидацию/тесты консистентности справочников ↔
   магазинов
4. Только потом решать, нормализовать ли БД или оставить JSON‑поля на
   старте
