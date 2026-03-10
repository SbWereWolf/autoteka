# Документация по реализации

**Дата актуализации: 2026-03-09.**

Документ описывает текущее устройство системы по коду: front office,
backend, back office и deployment-контур.

Связанные документы:

- [DEPLOY](../../deploy/DEPLOY.md) — эксплуатационный deploy-контур
  для админов.
- [ADMIN_MANUAL](../manual/ADMIN_MANUAL.md) — практические runbook
  инструкции.

## 1. Архитектура

Система разделена на 3 backend-модуля (плюс frontend и
deploy-обвязка):

- `backend/apps/ShopAPI` — Laravel 12 приложение, обслуживает публичный
  API;
- `backend/apps/ShopOperator` — Laravel 12 + MoonShine 4 для back
  office;
- `backend/packages/SchemaDefinition` — composer path-package со
  схемой/enum/миграционной базой, которую используют оба приложения.

Дополнительно:

- `frontend/` — Vue 3 + Vite SPA для front office;
- `deploy/` — docker/nginx/systemd-обвязка, автодеплой и
  техобслуживание.

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

Front office умеет работать в двух режимах:

- через `MockApiClient` и файлы `frontend/src/mocks/*`;
- через `HttpApiClient` и backend API.

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

`apps/ShopOperator` содержит MoonShine-панель и админские CRUD
ресурсы (`City/Category/Feature/ContactType/Shop`, пользователи и
роли).

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

Production (`deploy/runtime/docker-compose.yml`):

- `php` (`autoteka-php`) — backend runtime;
- `web` (`vue-app`) — nginx + frontend build + proxy;
- отдельные volume для `database`, `storage`, admin `public/vendor`.

Dev (`deploy/runtime/docker-compose.dev.yml`):

- `php` (`autoteka-dev-php`) — backend в режиме разработки;
- `frontend` (`autoteka-dev-frontend`) — Vite runtime;
- `web` (`autoteka-dev-web`) — nginx для source/bundle-watch режимов.

### 4.2. Dockerfile и entrypoint пути

- PHP образ: `deploy/runtime/docker/docker/php/Dockerfile` (targets:
  `dev`, `prod`).
- Dev nginx: `deploy/runtime/docker/docker/dev/nginx/Dockerfile`.
- Prod nginx: `deploy/runtime/docker/docker/prod/nginx/Dockerfile`.
- Entry points PHP:
  - `deploy/runtime/docker/docker/php/dev-entrypoint.sh`
  - `deploy/runtime/docker/docker/php/prod-entrypoint.sh`

Оба PHP-entrypoint подготавливают окружение для двух приложений
`apps/ShopAPI` и `apps/ShopOperator` (env, cache/bootstrap каталоги,
storage symlink).

Для `prod-docker` исходники и конфигурация baked-in в образах, поэтому
после любого изменения в исходниках или конфигурации требуется
пересборка production-образов и rollout новых контейнеров.

### 4.3. Лог-файлы backend модулей

- `backend/apps/ShopAPI/storage/logs/laravel.log`
- `backend/apps/ShopOperator/storage/logs/laravel.log`

В deploy/runtime эти пути соответствуют:

- `/var/www/backend/apps/ShopAPI/storage/logs/laravel.log`
- `/var/www/backend/apps/ShopOperator/storage/logs/laravel.log`

MoonShine media и shop-изображения фактически читаются из корня
`backend/storage/app/public` (runtime:
`/var/www/backend/storage/app/public`). Поэтому для инфраструктурного
backup покрывается весь корень `backend/storage` (ops-механика описана
в [DEPLOY](../../deploy/DEPLOY.md)).

## 5. Deploy и operations (границы документа)

Низкоуровневые сценарии развёртывания, systemd/timers, backup/restore,
watchdog/maintenance и серверные runbook-процедуры описаны в
`deploy/DEPLOY.md` и `docs/manual/ADMIN_MANUAL.md`.

Здесь они упоминаются только как граница ответственности.

## 6. Служебные процессы в коде

Код deploy-контура разложен по областям ответственности: `bootstrap`,
`runtime`, `repair`, `maintenance`, `observability`, `lib`.

Файлы systemd units и timers находятся в репозитории в
`deploy/runtime/systemd/`,
`deploy/observability/infrastructure/systemd/` и
`deploy/maintenance/systemd/`; `install.sh` собирает их и
устанавливает в systemd:

- `deploy/runtime/systemd/autoteka.service` — основной unit для
  запуска контейнеров через `docker compose up -d`
- `deploy/runtime/systemd/watch-changes.service` — unit для
  автодеплоя, запускает `watch-changes.sh`
- `deploy/runtime/systemd/watch-changes.timer` — timer для автодеплоя
  (каждые 5 минут)
- `deploy/observability/infrastructure/systemd/server-watchdog.service`
  — unit для watchdog-проверок
- `deploy/observability/infrastructure/systemd/server-watchdog.timer`
  — timer для watchdog (каждые 2 минуты)
- `deploy/maintenance/systemd/server-maintenance.service` — unit для
  maintenance-операций
- `deploy/maintenance/systemd/server-maintenance.timer` — timer для
  maintenance (ежедневно в 03:15)

`watch-changes.service` запускает `watch-changes.sh`, а не rollout
напрямую: watcher обновляет рабочую копию и стартует новый процесс
`deploy.sh` для раскатки текущего `HEAD`.

Подробности о параметрах units и timers см.
[DEPLOY.md §6.1](../../deploy/DEPLOY.md#61-systemd).

### 6.3. Env и source of truth

- `/etc/autoteka/deploy.env` — источник `AUTOTEKA_ROOT`, `BRANCH`,
  `REMOTE`, `HTTP_PORT`
- `/etc/autoteka/telegram.env` — optional Telegram secrets
- `backend/.env` — backend runtime config

## 7. Проверки

### Frontend

- `npm run validate:mocks`
- `npm run check:unused-assets`
- `npm run check:data`
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
