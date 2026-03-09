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

Важно: поля `category_links`, `feature_links`, `contact_entries`,
`gallery_entries`, `schedule_entries`, `schedule_note_text` в `Shop` —
виртуальные поля формы MoonShine. Они не являются колонками таблицы
`shop`; хранение выполняется через pivot/related таблицы
(`shop_category`, `shop_feature`, `shop_contact`,
`shop_gallery_image`, `shop_schedule`, `shop_schedule_note`).

## 5. Deploy-контур

### 5.1. Compose

`deploy/runtime/docker-compose.yml` поднимает:

- `php` — backend в контейнере `autoteka-php`;
- `web` — nginx в контейнере `vue-app`.

`web`:

- публикует `HTTP_PORT`;
- имеет healthcheck;
- монтирует `deploy/observability/application/metrics` в `/metrics`;
- раздаёт frontend, public media из `/storage/*` и проксирует backend.

**Dockerfile'ы:**

- `deploy/nginx/Dockerfile` — multi-stage build для frontend:
  - Build stage: `node:20-alpine` для сборки Vue/Vite приложения.
    Копирование `package*.json` перед исходниками для кеширования
    слоёв Docker. Создание `.env` из `example.env`, если отсутствует
    (критично для сборки, т.к. Vite требует `.env`).
  - Runtime stage: `nginx:alpine` для раздачи статики. Копирование
    собранного frontend из build stage в `/usr/share/nginx/html`.
    Копирование `deploy/nginx/nginx.conf` в
    `/etc/nginx/conf.d/default.conf`.
- `deploy/php/Dockerfile` — образ PHP-FPM для backend:
  - Базовый образ: `php:8.2-fpm-alpine`. Версия PHP влияет на
    совместимость с Laravel и расширениями. FPM нужен для работы с
    nginx через FastCGI.
  - Установка зависимостей: `bash`, `git`, `unzip`, `sqlite`,
    `sqlite-dev`, `icu-dev`, `oniguruma-dev`, `libxml2-dev`.
    Отсутствие пакетов приведёт к ошибкам при работе приложения.
  - PHP расширения: `pdo`, `pdo_sqlite` (работа с БД), `intl`
    (интернационализация), `mbstring` (работа со строками), `xml`
    (парсинг XML). Отсутствие расширений приведёт к ошибкам Laravel.
  - Composer: копирование из `composer:2`. Нужен для установки
    зависимостей Laravel. Версия влияет на совместимость с
    `composer.json`.
  - Рабочая директория: `/var/www/backend`. Должна совпадать с путями
    в `docker-compose.yml` и `nginx.conf`. Неправильный путь — ошибки
    при работе приложения.
  - Entrypoint: `deploy/php/entrypoint.sh` подготавливает окружение
    (создаёт директории, устанавливает права, создаёт `.env` из
    шаблона) и запускает PHP-FPM. Без entrypoint контейнер не
    подготовит права и не создаст `.env`.

**Конфиг nginx:**

- `deploy/nginx/nginx.conf` — конфиг nginx для web-контейнера. Раздаёт
  frontend, проксирует `/api/v1` и `/admin` в backend через FastCGI,
  отдаёт `/storage/*` и `/metrics/data.json`. Подробности см.
  [DEPLOY.md §11](../deploy/DEPLOY.md#11-конфигурация-nginx).

### 5.2. systemd units и timers

Deploy-контур разложен по областям ответственности: `bootstrap`,
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
[DEPLOY.md §6.1](../deploy/DEPLOY.md#61-systemd).

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

`deploy/bootstrap/uninstall.sh` удаляет deployment-инсталляцию системы
в режимах `soft`, `purge` и `nuke`.

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
