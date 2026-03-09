# Руководство администратора

**Дата актуализации: 2026-03-09.**

Документ описывает:

- работу с front office в части редактора темы оформления;
- работу с back office на MoonShine;
- как запускать рабочие контуры и выполнять повседневные операции;
- как чинить, обслуживать и диагностировать систему.

## 0. Навигация По Документам

- `docs/foundations/IMPLEMENTATION.md` — архитектура и кодовая
  реализация для разработчиков.
- `deploy/DEPLOY.md` — deploy-процессы, install/backup/restore,
  systemd/compose и эксплуатационный контур для админов.
- `docs/manual/ADMIN_MANUAL.md` (этот документ) — практические
  инструкции по развёртыванию установки, регулярному обслуживанию и
  устранению аварий.

Система разделена на 3 backend-модуля:

- `backend/apps/API` — API;
- `backend/apps/DatabaseOperator` — back office (MoonShine);
- `backend/packages/SchemaDefinition` — общий schema/package модуль.

## 1. Зоны ответственности

### Контент-администратор

Работает с back office:

- города;
- категории;
- фишки;
- типы контактов;
- магазины;
- административные пользователи и роли.

### Технический администратор

Работает с:

- theme editor;
- переменными окружения;
- генерацией и валидацией данных и медиа;
- автодеплоем, watchdog, metrics и техобслуживанием.

## 2. Front office: редактор темы оформления

Редактор темы предназначен для runtime-настройки CSS-переменных
активной темы без правки исходных CSS-файлов.

### 2.1. Как включить

В dev-среде редактор обычно доступен автоматически.

В stage/prod:

```js
localStorage.setItem("autoteka_theme_editor_enabled", "true");
location.reload();
```

Чтобы скрыть редактор:

```js
localStorage.setItem("autoteka_theme_editor_enabled", "false");
location.reload();
```

### 2.2. Где находится

- кнопка `CSS переменные` расположена в `TopBar`;
- редактор доступен на страницах каталога и карточки магазина;
- на мобильных брейкпоинтах редактор скрыт.

### 2.3. Как пользоваться

1. Откройте front office.
2. Нажмите `CSS переменные`.
3. Измените нужное значение.
4. Для сброса одной переменной используйте `↺`.
5. Для полного сброса текущей темы используйте `Сбросить тему`.
6. Для экспорта используйте `Скопировать JSON`.

### 2.4. Где хранится состояние

- `autoteka_theme_editor_enabled` — признак включения редактора;
- `autoteka_theme_overrides_v1` — overrides по темам;
- `autoteka_theme` — активная тема пользователя.

### 2.5. Диагностика

Если редактор не виден:

- проверьте ширину экрана;
- проверьте `localStorage.autoteka_theme_editor_enabled`;
- убедитесь, что открыта страница `/` или `/shop/:code`.

Если значение не применяется:

- проверьте формат через `CSS.supports`;
- проверьте, что на корневом `.app` появляются inline CSS properties;
- при необходимости удалите `autoteka_theme_overrides_v1`.

## 3. Back office MoonShine

### 3.1. Вход

По умолчанию:

- URL: `http://127.0.0.1:8000/admin/login`
- login: `admin@example.com`
- password: `admin12345`

Учетная запись initial admin создаётся сидером `AdminUserSeeder`. Для
production нужно задавать:

- `MOONSHINE_ADMIN_NAME`
- `MOONSHINE_ADMIN_EMAIL`
- `MOONSHINE_ADMIN_PASSWORD`

### 3.2. Какие сущности доступны в админке

В MoonShine зарегистрированы:

- `MoonShineUser`
- `MoonShineUserRole`
- `City`
- `Category`
- `Feature`
- `ContactType`
- `Shop`

### 3.3. Что редактируется в back office

#### Город

- код города;
- отображаемое название;
- порядок сортировки;
- активность в пользовательском выборе.

#### Категория и фишка

- идентификатор;
- название;
- порядок сортировки;
- активность.

#### Тип контакта

- идентификатор;
- название;
- порядок сортировки;
- активность.

#### Магазин

- код и название;
- город;
- описание;
- режим работы;
- сайт;
- категории;
- фишки;
- контакты;
- галерея;
- изображения preview.

При сохранении магазина часть поведения нормализуется на backend,
включая генерацию кода и нормализацию URL.

### 3.4. Что проверять после правок в back office

- магазин открывается во front office;
- карточка попадает в каталог нужного города;
- контакты корректно отображаются;
- preview и gallery-картинки доступны;
- `siteUrl` ведёт на валидный адрес.

Если картинка в браузере пустая, а запрос к `/storage/*` возвращает
`200 text/html`, проблема не в данных магазина, а в серверной раздаче
public media.

## 4. Служебные скрипты frontend

Основные команды из `frontend/package.json`:

- `npm run validate:mocks` — проверка справочников, ссылок и файлов;
- `npm run check:unused-assets` — проверка лишних и пропущенных медиа;
- `npm run check:data` — агрегатор проверок данных;
- `npm run images:regen` — генерация изображений магазинов;
- `npm run images:moonshine` — подготовка изображений для MoonShine;
- `npm run enrich:mocks` — обогащение мок-данных;
- `npm run materialize:shop-media` — материализация медиа магазинов.

Использовать эти команды нужно после массовых правок моков,
изображений или структуры данных каталога.

## 5. Служебные команды backend

Примеры backend-операций:

- `cd backend/apps/DatabaseOperator && php artisan migrate`
- `cd backend/apps/DatabaseOperator && php artisan db:seed --class=AdminUserSeeder`
- `cd backend/apps/API && php artisan test`
- `cd backend/apps/DatabaseOperator && php artisan test`

Специальная команда:

- `php artisan autoteka:media:fix-shops-paths`

Переносит медиа в `shops/thumbs/` и `shops/gallery/`, обновляет пути в
БД. Используйте при путях `generated/*` или `shops/*/generated/*`.

## 6. Важные настройки окружения

### 6.1. Frontend

- `frontend/.env`
- `VITE_API_BASE_URL`

Для production и deploy-контра используйте same-origin значение
`/api/v1`.

Если `frontend/.env` отсутствует при сборке production web-контейнера,
deploy создаст его из `frontend/example.env`.

### 6.2. Backend

- `backend/.env`
- `APP_URL`
- `DB_*`
- `MOONSHINE_ADMIN_*`

Если `backend/.env` отсутствует, контейнер `php` может создать его из
`backend/example.env`.

### 6.3. Серверные env-файлы

- `/etc/autoteka/deploy.env` — `AUTOTEKA_ROOT`, `BRANCH`, `REMOTE`,
  `HTTP_PORT` (см.
  [DEPLOY §5.1](../../deploy/DEPLOY.md#51-etcautotekadeployenv))
- `/etc/autoteka/telegram.env` — Telegram-уведомления watchdog (см.
  [DEPLOY §5.2](../../deploy/DEPLOY.md#52-etcautotekatelegramenv))

**Шаблоны в репозитории:**

- `deploy/bootstrap/config/deploy.example.env` — шаблон для
  `/etc/autoteka/deploy.env`. Устанавливается `install.sh` при первом
  запуске, если файл отсутствует. Содержит параметры `AUTOTEKA_ROOT`,
  `BRANCH`, `REMOTE`, `HTTP_PORT`, `STORAGE_BACKUP_DIR`,
  `STORAGE_BACKUP_RETENTION_DAYS`. Подробности см.
  [DEPLOY §5.5](../../deploy/DEPLOY.md#55-deployconfigdeployexampleenv).
- `deploy/bootstrap/config/telegram.example.env` — шаблон для
  `/etc/autoteka/telegram.env`. Устанавливается `install.sh`
  опционально, если файл отсутствует. Содержит `TELEGRAM_TOKEN` и
  `TELEGRAM_CHAT`. Подробности см.
  [DEPLOY §5.6](../../deploy/DEPLOY.md#56-deployconfigtelegramenvexample).

## 7. Запуск и рабочие инструкции администратора

### 7.1. Политика env-файлов

В git хранятся только шаблоны:

- `backend/example.env`;
- `frontend/example.env`;
- `deploy/bootstrap/config/deploy.example.env`;
- `deploy/bootstrap/config/dev.example.env`;
- `deploy/bootstrap/config/telegram.example.env`.

Рабочие env-файлы:

- называются `.env`;
- не хранятся в git;
- создаются копированием соответствующего `example.env`.

### 7.2. Как запустить production-процедуру

Первичный bootstrap и первая раскатка на сервере:

```bash
apt update && apt install -y git
mkdir -p /opt/vue-app
cd /opt/vue-app
git clone <YOUR_REPO_URL> .
chmod +x ./deploy/bootstrap/install.sh
sudo ./deploy/bootstrap/install.sh
autoteka deploy
```

Повторная ручная раскатка текущего `HEAD`:

```bash
autoteka deploy
```

Проверка состояния production-контура:

```bash
systemctl status autoteka.service
systemctl status watch-changes.timer
systemctl status server-watchdog.timer
systemctl status server-maintenance.timer
docker compose -f deploy/runtime/docker-compose.yml ps
```

### 7.3. Как запустить local dev / debug

Из корня репозитория:

```bash
cd deploy
cp bootstrap/config/dev.example.env .env
docker compose -f runtime/docker-compose.dev.yml up --build
```

Запуск в фоне:

```bash
docker compose -f runtime/docker-compose.dev.yml up --build -d
```

Остановить dev/debug-контур:

```bash
docker compose -f runtime/docker-compose.dev.yml down
```

Переcобрать контейнеры:

```bash
docker compose -f runtime/docker-compose.dev.yml build
```

Открыть shell в backend-контейнере:

```bash
docker compose -f runtime/docker-compose.dev.yml exec php sh
```

По умолчанию приложение доступно по адресу `http://127.0.0.1:8081`.
Адрес и порты управляются через `deploy/.env`.

### 7.4. Режимы frontend в dev/debug

#### `FRONTEND_MODE=source`

Используйте для обычной разработки UI:

- работает Vite dev server;
- изменения в исходниках отражаются сразу;
- доступен hot reload.

#### `FRONTEND_MODE=bundle-watch`

Используйте, когда нужна отладка собранного frontend:

- работает `vite build --watch`;
- nginx отдаёт `frontend/dist`;
- при `VITE_BUILD_SOURCEMAP=true` доступен mapping bundle на
  исходники.

### 7.5. Как чинить и диагностировать контейнерный контур

Проверить контейнеры production:

```bash
docker compose -f deploy/runtime/docker-compose.yml ps
```

Проверить контейнеры local dev/debug:

```bash
cd deploy
docker compose -f runtime/docker-compose.dev.yml ps
```

Посмотреть логи web:

```bash
docker compose -f deploy/runtime/docker-compose.dev.yml logs -f web
```

Посмотреть логи php:

```bash
docker compose -f deploy/runtime/docker-compose.dev.yml logs -f php
```

Сделать dry-run проверки и ремонта production:

```bash
autoteka watchdog --dry-run
autoteka repair-runtime --dry-run
```

### 7.6. Как обслуживать систему

Запустить backup:

```bash
autoteka backup
```

Запустить restore:

```bash
autoteka restore <backup-path>
```

Запустить storage+database backup вручную:

```bash
autoteka backup-storage
```

Запустить maintenance вручную:

```bash
sudo systemctl start server-maintenance.service
```

Подробности по смыслу и ограничениям deploy-скриптов см. в
[DEPLOY](../../deploy/DEPLOY.md). Архитектурный контекст модулей см. в
[IMPLEMENTATION](../foundations/IMPLEMENTATION.md).

## 8. Серверные скрипты deploy

В каталоге `deploy/` находятся:

- `install.sh` — bootstrap новой установки;
- `watch-changes.sh` — git polling, update рабочей копии и запуск
  rollout;
- `deploy.sh` — ручной rollout текущего `HEAD`;
- `repair-runtime.sh` — ручное восстановление runtime и smoke-check
  `/up`, `/api/v1/category-list`, `/admin/login`;
- `repair-health.sh` — точечная автопочинка health-domain (`nginx`,
  `php`, `backend`, `admin`);
- `health-reset.sh` — ручной сброс active incident state и Telegram
  dedup lock'ов по домену;
- `repair-infra.sh` — восстановление таймеров и базового состояния
  watchdog;
- `server-watchdog.sh` — healthcheck системы, bounded auto-remediation
  и экспорт метрик;
- `metrics-export.sh` — преобразование логов метрик в JSON;
- `server-maintenance.sh` — ежедневное безопасное техобслуживание;
- `storage-backup.sh` — backup `backend/storage` +
  `database/database.sqlite` с ротацией старых архивов;
- `backup.sh` — резервное копирование deploy-настроек (env, systemd,
  docker, fail2ban, logrotate);
- `restore.sh` — восстановление из резервной копии;
- `uninstall.sh` — удаление установленной системы.

Развёртывание и эксплуатация подробно описаны в `deploy/DEPLOY.md`.

## 9. Что делает uninstall.sh

`deploy/bootstrap/uninstall.sh` предназначен для удаления
deployment-инсталляции системы.

Режимы:

- `soft` — остановить и отключить сервисы/таймеры, выполнить
  `docker compose down`;
- `purge` — дополнительно удалить app-unit'ы, logrotate, app logs и
  runtime-state;
- `nuke` — дополнительно удалить системные конфиги, установленные
  `install.sh`, с backup в `/root/uninstall-backup-*`.

Границы безопасности:

- shared server packages вроде `docker`, `git`, `fail2ban` не
  удаляются;
- репозиторий удаляется только при явном `--rm-root`;
- `/etc/autoteka/*` удаляется только при явном `--rm-etc`.

## 10. Минимальный регламент администратора

После изменений в данных:

1. проверить front office;
2. проверить back office preview;
3. запустить `npm run check:data`, если менялись данные или медиа;
4. при необходимости проверить backend API и MoonShine login.

После изменений в инфраструктуре:

1. проверить `systemctl status`;
2. проверить `docker compose ps`;
3. проверить логи deploy/watchdog/maintenance;
4. проверить `/metrics`.

## 11. Healthcheck и диагностика

### 10.1. Набор проверок

Система использует пять health-domain:

- `nginx` — docker healthcheck контейнера `web` через
  `GET /healthcheck`;
- `php` — docker healthcheck контейнера `php` через FPM
  `ping.path=/fpm-ping`;
- `backend` — `GET /up`;
- `admin` — `GET /admin/login`;
- `api` — `GET /api/v1/category-list`.

Порядок проверки и реакции иерархический:

1. `nginx`
2. `php`
3. `backend`
4. `admin` и `api` (независимо друг от друга, только если `backend`
   healthy)

### 10.2. Как реагирует watchdog

Для `nginx`, `php`, `backend`, `admin`:

- первая неуспешная проверка → `DEGRADED`, отправляется alert;
- вторая подряд неуспешная → запускается автопочинка;
- если автопочинка не помогла → ставится cooldown;
- после cooldown делается ещё одна и последняя попытка;
- если и она не помогла → домен переводится в `manual_required`, новых
  авто-починок нет.

Для `api` автопочинка не выполняется: после повторного сбоя watchdog
только фиксирует `MANUAL_REQUIRED`.

### 10.3. Что делать руками

Проверить текущее состояние:

```bash
autoteka watchdog --dry-run
autoteka repair-runtime --dry-run
```

Сбросить только один инцидент без лечения:

```bash
autoteka health-reset admin
```

Сбросить все активные health incidents:

```bash
autoteka health-reset all
```

После ручной починки обычно ничего сбрасывать не нужно: если проверка
снова стала green, `server-watchdog` сам удалит state и lock-файлы
этого домена и отправит сообщение `...RECOVERED`.

### 10.4. Локальные файлы состояния

Watchdog хранит active incident state в каталоге:

```text
/var/lib/server-watchdog/health/
```

Для каждого домена используются файлы вида:

- `nginx.fail_count`
- `nginx.phase`
- `nginx.cooldown_until`
- `nginx.repair_attempts`
- `nginx.active_since`

Telegram dedup lock'и хранятся отдельно в:

```text
/tmp/autoteka-telegram-locks/
```

Состояние одного домена не должно очищать lock'и соседнего домена.
