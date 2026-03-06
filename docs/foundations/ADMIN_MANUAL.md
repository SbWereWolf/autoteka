# Руководство администратора

**Дата актуализации: 2026-03-06.**

Документ описывает:

- работу с front office в части редактора темы оформления;
- работу с back office на MoonShine;
- серверные настройки, служебные скрипты и проверки.

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
- `npm run materialize:shop-media` — материализация медиа магазинов;
- `npm run sync:backend-media` — синхронизация generated media в
  backend.

Использовать эти команды нужно после массовых правок моков,
изображений или структуры данных каталога.

## 5. Служебные команды backend

Примеры backend-операций:

- `php artisan migrate`
- `php artisan db:seed --class=AdminUserSeeder`
- `php artisan test`

Специальная команда:

- `php artisan app:update-generated-media-paths-to-png`

Она обновляет пути `generated/*.svg` на `generated/*.png` и
подготавливает mirror-файлы для preview в MoonShine.

## 6. Важные настройки окружения

### 6.1. Frontend

- `frontend/.env`
- `VITE_API_BASE_URL`

Для production и deploy-контра используйте same-origin значение
`/api/v1`.

Если `frontend/.env` отсутствует при сборке web-контейнера, deploy
создаст его из `frontend/example.env`.

### 6.2. Backend

- `backend/.env`
- `APP_URL`
- `DB_*`
- `MOONSHINE_ADMIN_*`

Если `backend/.env` отсутствует, контейнер `php` может создать его из
`backend/example.env`.

### 6.3. Серверные env-файлы

- `/etc/autoteka/deploy.env` — `AUTOTEKA_ROOT`, `BRANCH`, `REMOTE`,
  `HTTP_PORT`
- `/etc/autoteka/telegram.env` — Telegram-уведомления watchdog

## 7. Серверные скрипты deploy

В каталоге `deploy/` находятся:

- `install.sh` — bootstrap новой установки;
- `watch-changes.sh` — git polling, update рабочей копии и запуск rollout;
- `deploy.sh` — ручной rollout текущего `HEAD`;
- `server-watchdog.sh` — self-healing и экспорт метрик;
- `metrics-export.sh` — преобразование логов метрик в JSON;
- `server-maintenance.sh` — ежедневное безопасное техобслуживание;
- `uninstall.sh` — удаление установленной системы.

Развёртывание и эксплуатация подробно описаны в `deploy/DEPLOY.md`.

## 8. Что делает uninstall.sh

`deploy/uninstall.sh` предназначен для удаления deployment-инсталляции
системы.

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

## 9. Минимальный регламент администратора

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
