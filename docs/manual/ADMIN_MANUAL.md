# Руководство администратора

**Дата актуализации: 2026-03-10.**

Документ описывает:

- как запускать рабочие контуры и выполнять повседневные операции;
- как чинить, обслуживать и диагностировать систему.

## 0. Навигация По Документам

- `docs/foundations/IMPLEMENTATION.md` — архитектура и кодовая
  реализация для разработчиков.
- `infrastructure/DEPLOY.md` — deploy-процессы, install/backup/restore,
  systemd/compose и эксплуатационный контур для админов.
- `docs/manual/ADMIN_MANUAL.md` (этот документ) — практические
  инструкции по развёртыванию установки, регулярному обслуживанию и
  устранению аварий.

Система разделена на 3 backend-модуля:

- `backend/apps/ShopAPI` — API;
- `backend/apps/ShopOperator` — back office (MoonShine);
- `backend/packages/SchemaDefinition` — общий schema/package модуль.

## 1. Зоны ответственности

### Контент-администратор

Работает с back office:

- города;
- категории;
- фишки;
- типы контактов;
- магазины;
- theme editor.

### Технический администратор

Работает с:

- административные пользователи и роли;
- переменными окружения;
- генерацией и валидацией данных и медиа;
- автодеплоем, watchdog, metrics и техобслуживанием.

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
- редактор управляет palette, interactive, typography, layout, catalog
  и shop vars;
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

- URL в local dev/runtime: `http://127.0.0.1:8081/admin/login`
- URL в production: `/admin/login`
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

- Команды генерации/материализации мок-медиа удалены из актуального
  контура.

## 5. Служебные команды backend

Примеры backend-операций:

- `cd backend/apps/ShopOperator && php artisan migrate`
- `cd backend/apps/ShopOperator && php artisan db:seed --class=AdminUserSeeder`
- `cd backend/apps/ShopAPI && php artisan test`
- `cd backend/apps/ShopOperator && php artisan test`

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

- `/etc/autoteka/options.env` — `AUTOTEKA_ROOT`, `INFRA_ROOT`, `BRANCH`,
  `REMOTE`, `HTTP_PORT` (см. [DEPLOY](../../infrastructure/DEPLOY.md)).
  Скрипты берут пути только из env или аргументов, не из расположения.
- `/etc/autoteka/telegram.env` — Telegram-уведомления watchdog (см.
  [DEPLOY](../../infrastructure/DEPLOY.md)). Каждое уведомление содержит hash
  и subject коммита в блоке version.

**Шаблоны в репозитории:**

- `$INFRA_ROOT/prod.env` — шаблон для production. Перед install создайте
  `$INFRA_ROOT/.env` копированием: `cp -n "$INFRA_ROOT/prod.env" "$INFRA_ROOT/.env"`.
  install.sh копирует .env в `/etc/autoteka/options.env`. После установки
  изменяйте только options.env.
- `$INFRA_ROOT/bootstrap/config/telegram.example.env` — шаблон для
  `/etc/autoteka/telegram.env`. Содержит `TELEGRAM_TOKEN`, `TELEGRAM_CHAT`,
  `TELEGRAM_LOG_FILE`. В options.env — только `TELEGRAM_ENV_FILE`.

## 7. Запуск и рабочие инструкции администратора

### 7.1. Политика env-файлов

В git хранятся только шаблоны:

- `backend/example.env`;
- `frontend/example.env`;
- `$INFRA_ROOT/prod.env`;
- `$INFRA_ROOT/dev.env`;
- `$INFRA_ROOT/bootstrap/config/telegram.example.env`.

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
cp -n ./infrastructure/prod.env ./infrastructure/.env
# при необходимости отредактировать .env
chmod +x ./infrastructure/bootstrap/install.sh
set -a
source ./infrastructure/prod.env
set +a
sudo -E ./infrastructure/bootstrap/install.sh
autoteka deploy
```

`INFRA_ROOT` и `AUTOTEKA_ROOT` обязательны: задайте их через env,
загрузку из файла (`set -a; source prod.env; set +a; sudo -E ...`) или
аргументы `--infra-root=` и `--autoteka-root=`. См. [DEPLOY § Контракты
путей](../../infrastructure/DEPLOY.md#контракты-путей).

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
docker compose -f $INFRA_ROOT/runtime/docker-compose.yml ps
```

Подробности:

- первичная установка —
  [DEPLOY §4](../../infrastructure/DEPLOY.md#4-развёртывание-с-нуля);
- переменные окружения —
  [DEPLOY §5](../../infrastructure/DEPLOY.md#5-настройки-окружения);
- что именно делает `install.sh` —
  [DEPLOY §3](../../infrastructure/DEPLOY.md#3-что-делает-installsh).

### 7.3. Как запустить local dev / debug

Базовый dev-runtime с `php` target = `dev`:

```powershell
docker compose -f $env:INFRA_ROOT\runtime\docker-compose.dev.yml -f $env:INFRA_ROOT\runtime\docker-compose.dev.target-dev.yml up --build -d
```

Локальный smoke runtime с `php` target = `prod`:

```powershell
docker compose -f $env:INFRA_ROOT\runtime\docker-compose.dev.yml -f $env:INFRA_ROOT\runtime\docker-compose.dev.target-prod.yml up --build -d
```

Остановить dev/debug-контур:

```powershell
docker compose -f $env:INFRA_ROOT\runtime\docker-compose.dev.yml -f $env:INFRA_ROOT\runtime\docker-compose.dev.target-dev.yml down
```

Переcобрать контейнеры:

```powershell
docker compose -f $env:INFRA_ROOT\runtime\docker-compose.dev.yml -f $env:INFRA_ROOT\runtime\docker-compose.dev.target-dev.yml build
```

Открыть shell в backend-контейнере:

```powershell
docker exec autoteka-dev-php sh
```

По умолчанию приложение доступно по адресу `http://127.0.0.1:8081`.
Адрес и порты управляются через
`$INFRA_ROOT/dev.env` и локальный `$INFRA_ROOT/.env`.

Подробности по локальным runtime-командам и env:

- [README: Dev runtime с выбором php target](../../README.md#dev-runtime-с-выбором-php-target-override);
- [DEPLOY](../../infrastructure/DEPLOY.md).

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
docker compose -f $INFRA_ROOT/runtime/docker-compose.yml ps
```

Проверить контейнеры local dev/debug:

```bash
cd "$INFRA_ROOT"
docker compose -f runtime/docker-compose.dev.yml ps
```

Посмотреть логи web:

```bash
cd "$INFRA_ROOT"
docker compose -f runtime/docker-compose.dev.yml logs -f web
```

Посмотреть логи php:

```bash
cd "$INFRA_ROOT"
docker compose -f runtime/docker-compose.dev.yml logs -f php
```

Сделать dry-run проверки и ремонта production:

```bash
autoteka watchdog --dry-run
autoteka repair-runtime --dry-run
```

Точечные команды ремонта:

```bash
autoteka repair-health nginx
autoteka repair-health php
autoteka repair-health backend
autoteka repair-health admin
autoteka repair-infra
autoteka health-reset all
```

Подробные сценарии диагностики и починки:

- [DEPLOY §7.1](../../infrastructure/DEPLOY.md#71-сайт-недоступен);
- [DEPLOY §7.2](../../infrastructure/DEPLOY.md#72-backendapi-не-отвечает);
- [DEPLOY §7.3](../../infrastructure/DEPLOY.md#73-контейнер-unhealthy-или-missing);
- [DEPLOY §7.5](../../infrastructure/DEPLOY.md#75-не-обновляется-metrics);
- [DEPLOY §7.6](../../infrastructure/DEPLOY.md#76-не-приходят-telegram-уведомления).

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
[DEPLOY §8](../../infrastructure/DEPLOY.md#8-техническое-обслуживание),
[DEPLOY §9](../../infrastructure/DEPLOY.md#9-удаление-установленной-системы) и
[DEPLOY §10](../../infrastructure/DEPLOY.md#10-резервное-копирование-и-восстановление-deploy-настроек).
Архитектурный контекст модулей см. в
[IMPLEMENTATION](../foundations/IMPLEMENTATION.md).

## 8. Серверные скрипты deploy

Ниже перечислены скрипты и основной способ запуска. Полное поведение,
диагностика, аварийные сценарии и ограничения описаны в
`infrastructure/DEPLOY.md`.

- `$INFRA_ROOT/bootstrap/install.sh` или `autoteka up`/`autoteka deploy`
  после установки — начальная установка и подготовка сервера.
- `$INFRA_ROOT/runtime/watch-changes.sh` или `autoteka watch-changes` —
  ручной запуск проверки remote и автодеплоя.
- `$INFRA_ROOT/runtime/deploy.sh` или `autoteka deploy` — ручная раскатка
  текущего локального `HEAD`.
- `$INFRA_ROOT/repair/repair-runtime.sh` или `autoteka repair-runtime` —
  тяжёлая починка runtime и smoke-check backend/admin/API.
- `$INFRA_ROOT/repair/repair-health.sh` или
  `autoteka repair-health <domain>` — точечная починка одного
  health-домена.
- `$INFRA_ROOT/repair/health-reset.sh` или `autoteka health-reset <target>`
  — сброс incident state и Telegram dedup lock'ов.
- `$INFRA_ROOT/repair/repair-infra.sh` или `autoteka repair-infra` —
  восстановление таймеров и инфраструктурного состояния watchdog.
- `$INFRA_ROOT/observability/infrastructure/server-watchdog.sh` или
  `autoteka watchdog` — проверка здоровья и bounded auto-remediation.
- `$INFRA_ROOT/observability/application/metrics-export.sh` — экспорт
  метрик из логов в `/metrics/data.json`.
- `$INFRA_ROOT/maintenance/server-maintenance.sh` или
  `autoteka maintenance` — периодическое техобслуживание.
- `$INFRA_ROOT/maintenance/storage-backup.sh` или `autoteka backup-storage`
  — backup `backend/storage` и `database.sqlite`.
- `$INFRA_ROOT/maintenance/backup.sh` или `autoteka backup` — backup
  runtime-конфигурации и секретов.
- `$INFRA_ROOT/maintenance/restore.sh` или `autoteka restore <archive>` —
  восстановление runtime-конфига и сброс runtime health-state.
- `$INFRA_ROOT/bootstrap/uninstall.sh` или `autoteka uninstall <mode>` —
  удаление установленной системы.

Куда смотреть за подробностями:

- install/bootstrap —
  [DEPLOY §3](../../infrastructure/DEPLOY.md#3-что-делает-installsh) и
  [DEPLOY §4](../../infrastructure/DEPLOY.md#4-развёртывание-с-нуля);
- диагностика и repair —
  [DEPLOY §7](../../infrastructure/DEPLOY.md#7-диагностика-поломок);
- maintenance —
  [DEPLOY §8](../../infrastructure/DEPLOY.md#8-техническое-обслуживание);
- uninstall —
  [DEPLOY §9](../../infrastructure/DEPLOY.md#9-удаление-установленной-системы);
- backup/restore —
  [DEPLOY §10](../../infrastructure/DEPLOY.md#10-резервное-копирование-и-восстановление-deploy-настроек).

## 9. Backup, restore и uninstall

Основные команды администратора:

- `autoteka backup` — backup runtime-настроек и секретов;
- `autoteka backup-storage` — backup `backend/storage` и
  `database/database.sqlite`;
- `autoteka restore <archive>` — restore runtime-настроек;
- `autoteka uninstall <mode>` — удаление установленной системы.

Быстрые примеры:

```bash
sudo autoteka backup
sudo autoteka backup-storage
sudo autoteka restore /root/autoteka-backup-YYYYMMDD-HHMMSS.tar.gz
sudo autoteka uninstall soft
```

Подробности:

- backup/restore —
  [DEPLOY §10](../../infrastructure/DEPLOY.md#10-резервное-копирование-и-восстановление-deploy-настроек);
- uninstall —
  [DEPLOY §9](../../infrastructure/DEPLOY.md#9-удаление-установленной-системы).

## 10. Минимальный регламент администратора

После изменений в данных:

1. проверить front office;
2. проверить back office preview;
3. при необходимости выполнить профильные проверки данных/медиа по
   актуальному регламенту команды;
4. при необходимости проверить backend API и MoonShine login.

После изменений в инфраструктуре:

1. проверить `systemctl status`;
2. проверить `docker compose ps`;
3. проверить логи rollout/watchdog/maintenance;
4. проверить `/metrics`.

Если выполнялись backup/restore/uninstall/repair-сценарии,
дополнительно:

1. проверить `autoteka watchdog --dry-run`;
2. проверить `curl -i http://127.0.0.1/healthcheck`;
3. проверить `curl -i http://127.0.0.1/admin/login`.

## 11. Healthcheck и диагностика

Полная матрица healthcheck, incident phases, repair-команд и кодов
ошибок вынесена в
[DEPLOY §7](../../infrastructure/DEPLOY.md#7-диагностика-поломок).

### 11.1. Набор проверок

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

### 11.2. Как реагирует watchdog

Для `nginx`, `php`, `backend`, `admin`:

- первая неуспешная проверка → `DEGRADED`, отправляется alert;
- вторая подряд неуспешная → запускается автопочинка;
- если автопочинка не помогла → ставится cooldown;
- после cooldown делается ещё одна и последняя попытка;
- если и она не помогла → домен переводится в `manual_required`, новых
  авто-починок нет.

Для `api` автопочинка не выполняется: после повторного сбоя watchdog
только фиксирует `MANUAL_REQUIRED`.

### 11.3. Что делать руками

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

Подробности:

- ручные команды —
  [DEPLOY §7.3.3](../../infrastructure/DEPLOY.md#733-ручные-команды);
- repair-infra —
  [DEPLOY §7.5.2](../../infrastructure/DEPLOY.md#752-repair-infra--починка-инфраструктуры);
- коды ошибок —
  [DEPLOY §7.7](../../infrastructure/DEPLOY.md#77-коды-сообщений-причины-и-способы-исправления).

### 11.4. Локальные файлы состояния

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
