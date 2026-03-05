# Autoteka: Migration Plan to API Contract v1 (Mock-first, no network)

**Дата:** 2026-03-04  
**Цель:** перейти от прямого чтения моков в компонентах к чтению через
**API-контракт v1**, не подключая сеть на первом этапе.  
**Важно:** на этапе перехода **никаких fallback на старые поля**. Если
нового поля нет, это должно **ломаться сразу** (тестами и валидатором
данных).

---

## 0) Термины и артефакты

### Текущие моки (legacy)

- `dicts.json`:
  - `cities: [{id,name,isDefault?}]`
  - `categories: string[]`
  - `features: string[]`
  - `defaultFeature: string`
  - `themes?: ...`
- `shops.json`:
  - `city` (строка)
  - `categories: string[]`
  - `features: string[]`
  - `contacts: {type,value}[]`
  - прочие поля карточки

### Новые моки под API-контракт v1 (target DTO)

- `city-list.json`: `City[]` где `City = {id,name,sort}`
- `category-list.json`: `Category[]` где `Category = {id,name,sort}`
- `feature-list.json`: `Feature[]` где `Feature = {id,name,sort}`
- `shops.json` расширяется (старые поля остаются, но перестают
  читаться):
  - `cityId: string`
  - `categoryIds: string[]`
  - `featureIds: string[]`
  - `contacts` остаётся в моках как “источник” для имитации POST (см.
    этап Contacts)

---

## 1) Глобальные правила миграции

1. **Без fallback.**  
   После переключения на новые поля (`cityId/categoryIds/featureIds`)
   старые (`city/categories/features`) больше нигде не используются.

2. **Дефолты через порядок.**
   - дефолтный город = первый элемент `city-list` после сортировки
     (`sort ASC, id ASC`)
   - дефолтная фича = первый элемент `feature-list` после сортировки

3. **Настройки презентации остаются на фронте.**  
   `theme`, выбор города/категорий/фичи в `localStorage` (как сейчас).
   Но значения должны стать **ID** (где применимо).

4. **Переход без сети.**  
   Все “запросы” имитируются через `ApiClient`, который читает моки и
   возвращает `Promise`.

---

## 2) Этапы (Stages) с критериями готовности

> На каждом этапе обязательны:  
> ✅ `npm run build` / `typecheck`  
> ✅ `npm run test` (unit)  
> ✅ `npm run test:e2e` (smoke)  
> ✅ `npm run check:mocks` (проверка консистентности)

---

### Stage 0 — Baseline & страховочные тесты

**Цель:** зафиксировать текущую функциональность, чтобы дальше
рефакторить без страха.

**Действия:**

- добавить unit-тесты на сортировку (см. раздел 3)
- добавить e2e smoke (см. раздел 4)
- добавить `check:mocks` в CI (пусть пока проверяет legacy формат
  минимально)

**Готово, если:**

- тесты проходят на текущем коде без изменений UI-логики

---

### Stage 1a — Обогащаем моки (генерация/добавление новых полей), старые поля сохраняем

**Цель:** подготовить данные в новом формате, **не меняя чтение в
приложении**.

**Действия с моками:**

1. Сгенерировать `city-list.json` из `dicts.json.cities`:
   - добавить `sort` (если нет: `sort = index*10`)
2. Сгенерировать `category-list.json` из
   `dicts.json.categories: string[]`:
   - `id` (на гипотезе допустимо `id = исходная строка`)
   - `name = исходная строка`
   - `sort = index*10`
3. Сгенерировать `feature-list.json` из
   `dicts.json.features: string[]`:
   - `id/name/sort` по аналогии
4. Расширить `shops.json` новыми полями:
   - `cityId = city`
   - `categoryIds = categories.map(name → id)`
   - `featureIds = features.map(name → id)`
   - **старые поля остаются** (до конца миграции), но позже перестают
     читаться

**Готово, если:**

- UI работает как раньше (код ещё читает legacy)
- `check:mocks` проходит уже по “новым” файлам и полям (см. раздел 5)

---

### Stage 1b — Переключаем чтение Shops на новые поля (**без fallback**)

**Цель:** приложение начинает использовать **только**
`cityId/categoryIds/featureIds` из shop-моков.

**Действия в коде:**

- `CatalogPage` и сортировка используют:
  - `shop.cityId`
  - `shop.categoryIds`
  - `shop.featureIds`
- `ShopPage` получает те же новые поля

**Важно:** если каких-то новых полей в моках нет, приложение/тесты
должны упасть.

**Готово, если:**

- unit + e2e проходят
- `check:mocks` подтверждает наличие всех новых полей

---

### Stage 2 — Перевод state на ID-шники и подключение новых справочников (city/category/feature)

**Цель:** UI выбирает и хранит **ID**, а отображает `name` через
справочник.

**Действия:**

- `CitySelect` читает `city-list.json`
- `CategoryChips` читает `category-list.json`
- `FeatureSelect` читает `feature-list.json`
- `state` хранит:
  - `cityId: string`
  - `selectedCategoryIds: string[]`
  - `selectedFeatureId: string`

**Дефолты:**

- город = первый из city-list (после сортировки)
- фича = первый из feature-list (после сортировки)
- категории по умолчанию = `[]`

**Готово, если:**

- UI отображает названия корректно
- выбранные значения сохраняются/восстанавливаются из `localStorage`
  (как ID)

---

### Stage 3 — Отображение “все категории и фичи магазина” в карточке магазина

**Цель:** ShopPage показывает полный список категорий и фич магазина,
маппингом `id → name`.

**Действия:**

- В `ShopPage` добавить блоки:
  - **Категории:** `categoryIds` магазина → `name` из `category-list`
  - **Фичи:** `featureIds` магазина → `name` из `feature-list`

**Готово, если:**

- e2e проверяет, что эти блоки отображаются и не пустые (для тестового
  магазина)

---

### Stage 4 — Контакты через “acceptable-contact-types” (контакты выносим из ShopPage)

**Цель:** ShopPage перестаёт читать `shop.contacts` напрямую.

**Действия:**

- “GET shop/:id” в переходном режиме возвращает **ShopPublic без
  contacts**
- “POST acceptable-contact-types” возвращает контакты, сгруппированные
  по типам:
  - запрос: `["phone","email","telegram","whatsapp","address"]`
  - ответ: `{ "phone": ["..."], "email": ["..."] }`
- Источник данных остаётся в моках: `shops.json.contacts` (для
  генерации ответа POST)

**Готово, если:**

- ShopPage делает 2 логических обращения: `getShop` +
  `postAcceptableContactTypes`
- unit-тест проверяет фильтрацию и группировку контактов

---

### Stage 5 — Вводим ApiClient (без сети) и переводим всё чтение на сигнатуры API v1

**Цель:** компоненты/страницы больше не импортируют моки напрямую.

**Действия:**

- создать интерфейс `ApiClient` с методами 1:1:
  - `getCityList()`
  - `getCategoryList()`
  - `getFeatureList()`
  - `getCityShops(cityId, {q,page,perPage})`
  - `getShop(shopId)`
  - `postAcceptableContactTypes(shopId, types[])`
- реализация `MockApiClient` читает JSON и возвращает
  `Promise.resolve(...)`
- поиск/пагинация реализованы в памяти (см. требования ниже)

**Готово, если:**

- ни один компонент/страница не читает `src/mocks/*` напрямую
- “контракт сигнатур” совпадает с документом `API Contract v1`

---

### Stage 6 — Ошибки и качество данных (минимально полезное)

**Цель:** подготовить UI к реальным ошибкам сервера и к “битым
данным”, не раздувая сложность.

**Действия:**

- добавить UI-состояния:
  - loading / empty / error
  - 404 на shop/city → заглушка + кнопка “назад”
- добавить dev-only проверку входных данных (если хочется):
  - при старте приложения логировать найденные несоответствия (но
    основной стоп-кран — `check:mocks`)

**Готово, если:**

- e2e включает сценарий 404 и проверяет заглушку

---

## 3) Unit Test Cases (минимальный набор)

> Формат: **Given / When / Then**.

### UT-01: сортировка каталога по правилам

- Given: список shops с разными `categoryIds/featureIds`
- When: выбраны `selectedCategoryIds=[A,B]`, `selectedFeatureId=F`
- Then: порядок соответствует группам A1/A2/B1/B2 (как в
  `sortShops.ts`)
- Проверка: `result.map(s=>s.id)` равно ожидаемому массиву

### UT-02: маппинг id → name (категории)

- Given: `category-list` и магазин с `categoryIds`
- When: мапим ID к name для рендера
- Then: каждый ID преобразован в корректное имя, неизвестные ID:
  - либо фильтруются
  - либо показываются как `[unknown:<id>]` (выбрать один вариант и
    зафиксировать)

### UT-03: маппинг id → name (фичи)

Аналогично UT-02.

### UT-04: acceptable-contact-types фильтрация/группировка

- Given: contacts
  `[ {type:"phone",value:"1"}, {type:"email",value:"a"}, {type:"vk",value:"x"} ]`
- When: acceptableTypes `["phone","email"]`
- Then: ответ `{ phone:["1"], email:["a"] }`, “vk” игнорируется

### UT-05: MockApiClient пагинация

- Given: 50 shops
- When: `getCity(cityId,{page:2, perPage:10})`
- Then: `items.length=10`, `total=50`, `page=2`, корректные элементы

### UT-06: MockApiClient поиск

- Given: shops с именами
- When: `q="мир"`
- Then: возвращаются только совпадающие (case-insensitive substring по
  `name`)

---

## 4) E2E Smoke Test Cases (минимальный набор)

### E2E-01: старт приложения и дефолты

- Открыть `/`
- Ожидание:
  - выбран город = первый из `city-list` (по sort)
  - выбранная фича = первая из `feature-list` (по sort)
  - каталог отрисован (0+ магазинов)

### E2E-02: смена города

- Выбрать другой город в `CitySelect`
- Ожидание:
  - список магазинов обновился
  - счётчик количества соответствует `items.length`

### E2E-03: открыть карточку магазина

- Клик по плитке магазина → `/shop/:id`
- Ожидание:
  - отображается `name`
  - отображаются **категории** и **фичи** (по справочнику)
  - контакты отображены (получены через “POST
    acceptable-contact-types” в мок-клиенте)

### E2E-04: 404 магазин

- Открыть `/shop/nonexistent`
- Ожидание:
  - заглушка “не найдено”
  - кнопка “назад” возвращает в каталог

---

## 5) Требования к скрипту проверки консистентности моков (`check:mocks`)

### 5.1 Входные файлы

- `city-list.json`
- `category-list.json`
- `feature-list.json`
- `shops.json`
- (опционально) legacy `dicts.json` — только на время миграции

### 5.2 Правила валидации (must)

**Списки (`*-list.json`):**

1. каждый элемент имеет `id: string`, `name: string`, `sort: number`
2. `id` уникален в пределах списка
3. `sort` конечное число (не NaN)
4. список детерминированно сортируем: проверка, что `sort`
   присутствует у всех (сам порядок файла можно не требовать)

**Магазины (`shops.json`):** 5) у каждого shop есть `id: string`
(уникальный) 6) есть `cityId: string` 7) есть `categoryIds: string[]`
и `featureIds: string[]` (могут быть пустыми, но поле должно
существовать) 8) `cityId` существует в `city-list.id` 9) каждый
`categoryId` существует в `category-list.id` 10) каждый `featureId`
существует в `feature-list.id` 11) медиа:

- если `thumbUrl` задан, это строка
- если `galleryImages` задан, это массив строк

1. (контакты в моках как источник):

- если `contacts` есть, это массив `{type:string,value:string}`
- пустые `value` запрещены или допускаются (выбрать правило и
  зафиксировать)

### 5.3 Поведение скрипта

- На ошибке: печатает **понятный отчёт**: файл, JSON-path, описание,
  пример значения
- Возвращает **ненулевой exit code** (ломает CI)
- Не модифицирует файлы (это именно **check**)
- Запуск: `npm run check:mocks`

### 5.4 Опционально (nice-to-have)

- `--strict` (запрещать неизвестные поля, проверять url-формат)
- `--stats` (сводка: сколько городов/категорий/фич/магазинов)

---

## 6) Требования к генератору обогащения моков (`enrich:mocks`) (Stage 1a)

> Это отдельный скрипт от `check:mocks`.

**Задача:**

- из legacy моков создать/обновить:
  - `city-list.json`, `category-list.json`, `feature-list.json`
  - добавить `cityId/categoryIds/featureIds` в `shops.json`

**Свойства:**

- детерминированность (одинаковый вход → одинаковый выход)
- идемпотентность (повторный запуск не “портит” данные)
- не удаляет legacy поля (только добавляет новые)

Запуск: `npm run enrich:mocks`

---

## 7) Рекомендуемые npm scripts (пример)

- `enrich:mocks` — генерация/обогащение данных
- `check:mocks` — консистентность
- `test` — unit
- `test:e2e` — smoke

В CI: `enrich:mocks` (опционально, если коммитим результат) →
`check:mocks` → `test` → `test:e2e` → `build`

---

## 8) Definition of Done

- Все чтения данных в приложении идут через `ApiClient` методами,
  соответствующими API v1
- Компоненты/страницы не импортируют моки напрямую
- `check:mocks` проходит
- unit + e2e проходят
- Нет fallback на старые поля (если новые поля отсутствуют, тесты
  падают)
