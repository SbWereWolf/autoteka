# Документация по реализации

**Дата актуализации: 2026-03-09.**

Документ описывает текущее устройство системы по коду: front office,
backend, back office и deployment-контур.

Связанные документы:

- [DEPLOY](../../infrastructure/DEPLOY.md) — эксплуатационный deploy-контур
  для админов.
- [ADMIN_MANUAL](../manual/ADMIN_MANUAL.md) — практические runbook
  инструкции.

## 1. Архитектура

Система разделена на 3 backend-модуля (плюс frontend и
deploy-обвязка):

- `backend/apps/ShopAPI` — Laravel 12 приложение, обслуживает
  публичный API;
- `backend/apps/ShopOperator` — Laravel 12 + MoonShine 4 для back
  office;
- `backend/packages/SchemaDefinition` — composer path-package со
  схемой/enum/миграционной базой, которую используют оба приложения.

Дополнительно:

- `frontend/` — Vue 3 + Vite SPA для front office;
- `INFRA_ROOT` — docker/nginx/systemd-обвязка, автодеплой и
  техобслуживание.

---

### 1.1. Требования к исполнению разработки LLM-агентом

#### 1.1.1. Спецификация работы LLM-агента

Агент обязан выполнять требования главы "1.1. Требования к разработке
в исполнении LLM-агентом" буквально. Запрещено ослаблять их, заменять
«разумным эквивалентом», трактовать как советы, игнорировать частично
или переставлять обязательные шаги местами, если документ прямо не
допускает такого изменения порядка.

#### 1.1.2. Нормативные слова

Термины ниже имеют жёсткий смысл:

- **обязан** — требование обязательно к исполнению;
- **запрещено** — действие недопустимо;
- **не имеет права** — действие недопустимо до выполнения указанного
  условия;
- **может** — действие допустимо, но не обязательно;
- **если / то** — обязательное условное правило;
- **только если** — исключение, вне которого действие запрещено.

Если формулировка допускает две трактовки, агент обязан выбрать более
строгую трактовку.

### 1.1.3. Требования разработке layout and design

Требования стандартов и практик:

- Web standards W3C:
  - Landmarks (скелет страницы),
  - Заголовки: порядок и структура,
  - Кнопки vs ссылки,
  - Формы: must-have атрибуты;
- Web standards WHATWG;
- WCAG:
  - Контраст текста (SC 1.4.3),
  - Контраст НЕ-текста (SC 1.4.11 Non-text Contrast),
  - Размеры клика/тапа (SC 2.5.8 Target Size),
  - Фокус: видимый, не перекрыт, “достаточно жирный”:
    - (A) Focus Visible (2.4.7),
    - (AA) Focus Not Obscured (2.4.11),
    - (AA) Focus Appearance (2.4.13);
  - Подсказки/tooltip и “контент по ховеру/фокусу” (SC 1.4.13);
- ARIA Authoring Practices (WAI-ARIA):
  - First rule of ARIA,
  - Не делаем `div role=button`, если можно `button`,
  - Modal dialog (паттерн APG);

Агент обязан разрабатывать решения с соблюдением этих требований.
Запрещено нарушать эти требования, агент может предложить пользователю
разработать решение с нарушением этих требований на этапе планирования
с явным указанием на нарушение.

### 1.1.4. Требования разработке frontend

Стек:

- Vue 3.5+ Composition API + Vite 5+;
- Tailwind CSS 4.2+;
- HTML5, CSS3 vars;

Агент обязан разрабатывать решения внутри этого стека. Запрещено
выходить за границы этого стека. Агент может на этапе планирования
предложить пользователю другое общепринятое решение за границами этого
стека с явным указанием на выход за границы.

### 1.1.5. Требования разработке backend

Подходы к разработке:

- TDD сначала пишем тест реализации, потом код реализации;
- OOP объединяем данные и способы их обработки в классы;
- DDD разделяем классы по предметным областям;
- Clean Code разделяем классы (неймспейсы) на слои;
- SOLID;
- KISS код должен быть линейным, элементарным, без самокопирования;

Стек:

- MoonShine 4.8+;
- Laravel 12+;
- PHP 8.2+;
- SQLite 3.5+;

Агент обязан разрабатывать с этими подходами и внутри этого стека.
Запрещено выходить за границы этого стека. Агент может на этапе
планирования предложить пользователю другое общепринятое решение за
границами этого стека с явным указанием на выход за границы.

### 1.1.5. Требования разработке deploy and maintenance

Стек:

- Ubuntu 24+;
- Bash;
- Docker & Docker compose;

Агент обязан разрабатывать внутри этого стека. Запрещено выходить за
границы этого стека. Агент может на этапе планирования предложить
пользователю другое общепринятое решение за границами этого стека с
явным указанием на выход за границы.

---

## 2. Front office

### 2.1. Основные страницы

- `/` — каталог магазинов;
- `/shop/:code` — карточка магазина.

### 2.2. Основные компоненты

- `TopBar.vue` — верхняя панель, открытие меню и theme editor;
- `HamburgerMenu.vue` — меню с городом, категориями и фишкой;
- `CitySelect.vue` — выбор города;
- `CategoryChips.vue` — выбор категорий;
- `FeatureSelect.vue` — выбор фишки;
- `ShopTile.vue` — плитка магазина;
- `GalleryCarousel.vue` — карусель изображений;
- `OverscrollOpenLink.vue` — переход на внешний сайт по overscroll;
- `CssVarsEditor.vue` и `CssVarsEditorVarRow.vue` — редактор темы.

### 2.3. Состояние приложения

`frontend/src/state.ts` хранит:

- `theme`
- `menuOpen`
- `themeEditorOpen`
- `themeEditorEnabled`
- `cityCode`
- `selectedCategoryIds`
- `selectedFeatureId`
- справочники `cities`, `categories`, `features`

Ключи `localStorage`:

- `autoteka_theme`
- `autoteka_city`
- `autoteka_categories`
- `autoteka_feature`
- `autoteka_theme_editor_enabled`
- `autoteka_theme_overrides_v1`

### 2.4. Источник данных

- через `HttpApiClient` backend API.

Базовый URL API задаётся через `VITE_API_BASE_URL`.

По умолчанию:

```text
/api/v1
```

В production deploy-контуре frontend и API работают как same-origin,
поэтому отдельный CORS-слой в nginx не требуется.

### 2.5. Алгоритм каталога

- по городу каталог фильтруется;
- по выбранным категориям и фишке плитки сортируются;
- пользовательские настройки сохраняются между перезагрузками.

### 2.6. Theme editor

Theme editor применяет CSS overrides runtime через inline properties
на корневом `.app` и не меняет исходные CSS-файлы.

## 3. Backend

### 3.1. Модуль API (`apps/ShopAPI`)

Модуль API публикует маршруты с префиксом `/api/v1`:

- `GET /city-list`
- `GET /category-list`
- `GET /feature-list`
- `GET /city/{code}`
- `GET /shop/{code}`
- `POST /shop/{code}/acceptable-contact-types`

### 3.2. Контракты DTO для frontend

`HttpApiClient` ожидает:

- `city-list` — массив городов с `code`, `title`, `sort`;
- `category-list` и `feature-list` — массивы с `id`, `title`, `sort`;
- `city/{code}` — объект города и список карточек каталога;
- `shop/{code}` — детальную карточку магазина;
- `acceptable-contact-types` — ответ по допустимым каналам связи.

Frontend нормализует `number|string` идентификаторы к `string`.

### 3.3. Модуль админки (`apps/ShopOperator`)

`apps/ShopOperator` содержит MoonShine-панель и админские CRUD ресурсы
(`City/Category/Feature/ContactType/Shop`, пользователи и роли).

`ShopResource` использует `SaveShopResourceHandler`.

### 3.4. Общие данные и модели

Ключевые модели домена:

- `City`
- `Category`
- `Feature`
- `ContactType`
- `Shop`
- `ShopContact`
- `ShopGalleryImage`
- `ShopSchedule`
- `ShopScheduleNote`

Дополнительно:

- `User`
- MoonShine users и roles

### 3.5. Виртуальные поля Shop в back office

Поля `category_links`, `feature_links`, `contact_entries`,
`gallery_entries`, `schedule_entries`, `schedule_note_text` в `Shop` —
виртуальные поля MoonShine-формы.

Они не являются колонками таблицы `shop`; хранение выполняется через
pivot/related таблицы (`shop_category`, `shop_feature`,
`shop_contact`, `shop_gallery_image`, `shop_schedule`,
`shop_schedule_note`).

### 3.6. Полезные backend-concerns

- генерация стабильного `code`;
- нормализация `siteUrl`;
- форматирование рабочих часов;
- вспомогательные колонки и table name wrappers.

## 4. Runtime-контур в коде

### 4.1. Compose

Production (`$INFRA_ROOT/runtime/docker-compose.yml`):

- `php` (`autoteka-php`) — backend runtime;
- `web` (`vue-app`) — nginx + frontend build + proxy;
- отдельные volume для `database`, `storage`, admin `public/vendor`.

Dev (`$INFRA_ROOT/runtime/docker-compose.dev.yml`):

- `php` (`autoteka-dev-php`) — backend в режиме разработки;
- `frontend` (`autoteka-dev-frontend`) — Vite runtime;
- `web` (`autoteka-dev-web`) — nginx для source/bundle-watch режимов.

### 4.2. Dockerfile и entrypoint пути

- PHP образ: `$INFRA_ROOT/runtime/docker/docker/php/Dockerfile` (targets:
  `dev`, `prod`).
- Dev nginx: `$INFRA_ROOT/runtime/docker/docker/dev/nginx/Dockerfile`.
- Prod nginx: `$INFRA_ROOT/runtime/docker/docker/prod/nginx/Dockerfile`.
- Entry points PHP:
  - `$INFRA_ROOT/runtime/docker/docker/php/dev-entrypoint.sh`
  - `$INFRA_ROOT/runtime/docker/docker/php/prod-entrypoint.sh`

Оба PHP-entrypoint подготавливают окружение для двух приложений
`apps/ShopAPI` и `apps/ShopOperator` (env, cache/bootstrap каталоги,
storage symlink).

Для `prod-docker` исходники и конфигурация baked-in в образах, поэтому
после любого изменения в исходниках или конфигурации требуется
пересборка production-образов и rollout новых контейнеров.

### 4.3. Лог-файлы backend модулей

- `backend/apps/ShopAPI/storage/logs/laravel.log`
- `backend/apps/ShopOperator/storage/logs/laravel.log`

В runtime-контуре эти пути соответствуют:

- `/var/www/backend/apps/ShopAPI/storage/logs/laravel.log`
- `/var/www/backend/apps/ShopOperator/storage/logs/laravel.log`

MoonShine media и shop-изображения фактически читаются из корня
`backend/storage/app/public` (runtime:
`/var/www/backend/storage/app/public`). Поэтому для инфраструктурного
backup покрывается весь корень `backend/storage` (ops-механика описана
в [DEPLOY](../../infrastructure/DEPLOY.md)).

## 5. Deploy и operations (границы документа)

Низкоуровневые сценарии развёртывания, systemd/timers, backup/restore,
watchdog/maintenance и серверные runbook-процедуры описаны в
`infrastructure/DEPLOY.md` и `docs/manual/ADMIN_MANUAL.md`.

Здесь они упоминаются только как граница ответственности.

## 6. Служебные процессы в коде

Код deploy-контура разложен по областям ответственности: `bootstrap`,
`runtime`, `repair`, `maintenance`, `observability`, `lib`.

Файлы systemd units и timers находятся в репозитории в
`$INFRA_ROOT/runtime/systemd/`,
`$INFRA_ROOT/observability/infrastructure/systemd/` и
`$INFRA_ROOT/maintenance/systemd/`; `install.sh` собирает их и
устанавливает в systemd:

- `$INFRA_ROOT/runtime/systemd/autoteka.service` — основной unit для
  запуска контейнеров через `docker compose up -d`
- `$INFRA_ROOT/runtime/systemd/watch-changes.service` — unit для
  автодеплоя, запускает `watch-changes.sh`
- `$INFRA_ROOT/runtime/systemd/watch-changes.timer` — timer для автодеплоя
  (каждые 5 минут)
- `$INFRA_ROOT/observability/infrastructure/systemd/server-watchdog.service`
  — unit для watchdog-проверок
- `$INFRA_ROOT/observability/infrastructure/systemd/server-watchdog.timer`
  — timer для watchdog (каждые 2 минуты)
- `$INFRA_ROOT/maintenance/systemd/server-maintenance.service` — unit для
  maintenance-операций
- `$INFRA_ROOT/maintenance/systemd/server-maintenance.timer` — timer для
  maintenance (ежедневно в 03:15)

`watch-changes.service` запускает `watch-changes.sh`, а не rollout
напрямую: watcher обновляет рабочую копию и стартует новый процесс
`deploy.sh` для раскатки текущего `HEAD`.

Подробности о параметрах units и timers см.
[DEPLOY.md §6.1](../../infrastructure/DEPLOY.md#61-systemd).

### 6.3. Env и source of truth

- `/etc/autoteka/deploy.env` — источник `AUTOTEKA_ROOT`, `BRANCH`,
  `REMOTE`, `HTTP_PORT`
- `/etc/autoteka/telegram.env` — optional Telegram secrets
- `backend/.env` — backend runtime config

## 7. Проверки

### Frontend

- `npm run test`
- `npm run test:e2e`

### Backend (модульно)

- `cd backend/apps/ShopAPI && php artisan test`
- `cd backend/apps/ShopOperator && php artisan test`
- миграции/seed: `backend/apps/ShopOperator`

### Monorepo

- `npm run lint`

## 8. Известные ограничения

- В репозитории нет полноценного CI-пайплайна, который автоматически
  запускает все frontend/backend/deploy проверки.
- Theme editor зависит от `localStorage` и runtime CSS overrides.
- Часть пользовательского поведения сохраняется локально в браузере,
  поэтому диагностика UI должна учитывать localStorage.
- Deployment-контур ориентирован на Debian/Ubuntu и systemd.

## Актуализация front office по mobile-first layout

- `TopBar.vue` использует 3-колоночный grid и центрирует заголовок
  между burger и правой control-group.
- `HamburgerMenu.vue` содержит выбор города и категорий; выбор фишки
  вынесен из меню.
- `CatalogPage.vue` рендерит `CatalogFeatureStickySelect.vue` внутри
  каталожного shell; sticky control управляет `selectedFeatureId`.
- `ShopTile.vue` центрирует название магазина без подложки и считает
  размер через container units.
- `ShopPage.vue` использует высоту hero-gallery через CSS vars,
  overlay режима работы внизу по центру и переносит `ShopMetaBadges`
  между описанием и контактами.
- runtime theme editor работает с группами `palette`, `interactive`,
  `typography`, `layout`, `catalog`, `shop`; для sticky feature
  control добавлена отдельная переменная
  `--catalog-feature-sticky-top`.
