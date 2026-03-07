# Документация по реализации

**Дата актуализации: 2026-03-07.**

Документ описывает текущее устройство системы по коду: front office,
backend, back office и deployment-контур.

## 1. Архитектура

Монорепозиторий состоит из трёх основных зон:

- `frontend/` — Vue 3 + Vite SPA для front office;
- `backend/` — Laravel 12 API и MoonShine 4 для back office;
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

## 3. Backend API

### 3.1. Маршруты

Backend публикует API с префиксом `/api/v1`:

- `GET /city-list`
- `GET /category-list`
- `GET /feature-list`
- `GET /city/{code}`
- `GET /shop/{code}`
- `POST /shop/{code}/acceptable-contact-types`

### 3.2. DTO и маппинг

`HttpApiClient` ожидает:

- `city-list` — массив городов с `code`, `title`, `sort`;
- `category-list` и `feature-list` — массивы с `id`, `title`, `sort`;
- `city/{code}` — объект города и список карточек каталога;
- `shop/{code}` — детальную карточку магазина;
- `acceptable-contact-types` — ответ по допустимым каналам связи.

Frontend нормализует `number|string` идентификаторы к `string`.

### 3.3. Данные и модели

Ключевые модели backend:

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

### 3.4. Полезные backend-concerns

- генерация стабильного `code`;
- нормализация `siteUrl`;
- форматирование рабочих часов;
- вспомогательные колонки и table name wrappers.

## 4. Back office MoonShine

MoonShine используется как административный интерфейс для управления
данными каталога и пользователями админки.

Зарегистрированные resources:

- `MoonShineUserResource`
- `MoonShineUserRoleResource`
- `CityResource`
- `CategoryResource`
- `FeatureResource`
- `ContactTypeResource`
- `ShopResource`

`ShopResource` использует `SaveShopResourceHandler`.

## 5. Deploy-контур

### 5.1. Compose

`deploy/docker-compose.yml` поднимает:

- `php` — backend в контейнере `autoteka-php`;
- `web` — nginx в контейнере `vue-app`.

`web`:

- публикует `HTTP_PORT`;
- имеет healthcheck;
- монтирует `deploy/metrics` в `/metrics`;
- раздаёт frontend, public media из `/storage/*` и проксирует backend.

### 5.2. systemd units и timers

Устанавливаются:

- `autoteka.service`
- `autoteka-deploy.service`
- `autoteka-deploy.timer`
- `server-watchdog.service`
- `server-watchdog.timer`
- `server-maintenance.service`
- `server-maintenance.timer`

`autoteka-deploy.service` запускает `watch-changes.sh`, а не rollout
напрямую: watcher обновляет рабочую копию и стартует новый процесс
`deploy.sh` для раскатки текущего `HEAD`.

### 5.3. Env и source of truth

- `/etc/autoteka/deploy.env` — источник `AUTOTEKA_ROOT`, `BRANCH`,
  `REMOTE`, `HTTP_PORT`
- `/etc/autoteka/telegram.env` — optional Telegram secrets
- `backend/.env` — backend runtime config

## 6. Служебные процессы

### 6.1. Watchdog

`server-watchdog.sh`:

- читает load average, RAM usage и состояние healthcheck контейнера;
- пишет строки в `/var/log/server-metrics.log`;
- экспортирует JSON через `metrics-export.sh`;
- делает self-healing в три стадии:
  - restart container;
  - restart compose unit;
  - reboot сервера с cooldown.

### 6.2. Maintenance

`server-maintenance.sh` ежедневно выполняет:

- `apt clean`;
- `journalctl --vacuum-size=100M`;
- `docker image prune -f`;
- `docker builder prune -f`;
- `docker container prune -f`;
- cleanup `/tmp`;
- исправление прав для logrotate status.

### 6.3. Uninstall

`deploy/uninstall.sh` удаляет deployment-инсталляцию системы в режимах
`soft`, `purge` и `nuke`.

## 7. Проверки

### Frontend

- `npm run validate:mocks`
- `npm run check:unused-assets`
- `npm run check:data`
- `npm run test`
- `npm run test:e2e`

### Backend

- `php artisan test`
- `php artisan migrate`
- `php artisan db:seed --class=AdminUserSeeder`

### Monorepo

- `npm run lint`

## 8. Известные ограничения

- В репозитории нет полноценного CI-пайплайна, который автоматически
  запускает все frontend/backend/deploy проверки.
- Theme editor зависит от `localStorage` и runtime CSS overrides.
- Часть пользовательского поведения сохраняется локально в браузере,
  поэтому диагностика UI должна учитывать localStorage.
- Deployment-контур ориентирован на Debian/Ubuntu и systemd.
