# Руководство администратора

**Дата актуализации: 2026-03-26.**

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

Работает с back office (его работа описана в 
[CLERK_MANUAL](docs/manual/CLERK_MANUAL.md)):

- города;
- категории;
- фишки;
- типы контактов;
- магазины;
- качеством данных, которые видит front office.

### Технический администратор

Работает с:

- административные пользователи и роли;
- переменными окружения;
- генерацией и валидацией данных и медиа;
- автодеплоем, watchdog, metrics и техобслуживанием.



---

## 3. Учётные записи администраторов MoonShine

Раздел относится к встроенным сущностям MoonShine: **пользователи** и
**роли**. В меню они находятся в системной группе (название
зависит от перевода MoonShine, при английской локали — например
**Admins**, **Roles**).

### 3.1. Список администраторов

На странице списка доступны:

- **Фильтры:** по роли и по E-mail.
- **Выбор колонок** таблицы (column selection).
- Колонки включают **Обновлён** (дата и время обновления записи).

### 3.2. Создание нового администратора (пошагово)

1. Откройте ресурс пользователей MoonShine в меню.
2. Нажмите действие **создания** новой записи (кнопка с иконкой «плюс»
   или подпись вроде **Add** / **Create** при английской локали).
3. Вкладка **основной информации** (название вкладки зависит от перевода):
  - **Роль** — выберите существующую роль (**обязательное поле**).
    При необходимости можно создать роль из связанного интерфейса
    (**creatable**).
  - **Имя** — например: `Иван Оператор` (**обязательно**).
  - **Email** — например: `operator@example.com` (**обязательно**,
    уникальный).
  - **Аватар** — по желанию (форматы: jpeg, jpg, png, gif).
4. Вкладка **пароля**:
  - При **создании** пользователя пароль **обязателен**; укажите пароль
    и **повтор** в двух полях (требования — как у
    `Password::defaults()` в Laravel).
5. Сохраните форму.

**Ожидаемый результат:** новая запись появляется в списке; вход возможен
с указанным email и паролем (если политика MoonShine это допускает).

### 3.3. Роли

Ресурс ролей использует **модальные окна** для создания и редактирования.
Имя роли **обязательно**, минимальная длина **5 символов**.

---

## 5. Служебные команды backend

Примеры backend-операций:

- `cp backend/database/database.sqlite backend/database/backup/YYYYMMDD-HHMMSS.database.sqlite`
- `cd backend/apps/ShopOperator && php artisan migrate`
- `cd backend/apps/ShopOperator && php artisan autoteka:is-there-an-admin admin@example.com`
- `cd backend/apps/ShopOperator && php artisan db:seed --class=AdminUserSeeder`
- `cd backend/apps/ShopAPI && php artisan test`
- `cd backend/apps/ShopOperator && php artisan test`
- `cd backend/apps/ShopOperator && vendor/bin/phpunit tests/Feature/PromotionAdminHttpFlowTest.php --colors=never`
- `cd backend/apps/ShopAPI && php artisan test --parallel --processes=2 --filter='PromotionEndpointTest|ApiEndpointsCoverageTest'`

Перед любым `php artisan migrate` сначала обязателен backup текущей
SQLite БД в `backend/database/backup/` с именем формата
`YYYYMMDD-HHMMSS.database.sqlite`.

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

### 6.3. Серверные env-файлы

- `OPTIONS_FILE` — путь к options.env (обычно `/etc/autoteka/options.env`).
  При **ручном запуске** `autoteka` (без systemd) переменная должна быть задана:
  `export OPTIONS_FILE=/etc/autoteka/options.env` или
  `source /etc/autoteka/options.env` перед вызовом.
- `/etc/autoteka/options.env` — `AUTOTEKA_ROOT`, `INFRA_ROOT`, `BRANCH`,
  `REMOTE`, `HTTP_PORT` (см. [DEPLOY](../../infrastructure/DEPLOY.md)).
  Скрипты берут пути только из env или аргументов, не из расположения.
- Файл по пути `TELEGRAM_ENV_FILE` — Telegram-уведомления watchdog (см.
  [DEPLOY](../../infrastructure/DEPLOY.md)). Создаётся install.sh из
  `telegram.example.env` по пути из .env, значения заполняются из
  `$INFRA_ROOT/.env`. Опционально: при отсутствии `TELEGRAM_ENV_FILE` 
  watchdog и watch-changes работают без уведомлений.

**Шаблоны в репозитории:**

- `$INFRA_ROOT/prod.env` — шаблон для production. Перед install создайте
  `$INFRA_ROOT/.env` копированием: `cp -n "$INFRA_ROOT/prod.env" "$INFRA_ROOT/.env"`.
  install.sh копирует .env в `$OPTIONS_FILE` (например, `/etc/autoteka/options.env`),
  затем перемещает .env в `$INFRA_ROOT/backup.env`. Для повторного install:
  `cp "$INFRA_ROOT/backup.env" "$INFRA_ROOT/.env"`. После установки изменяйте только options.env.
- `$INFRA_ROOT/bootstrap/config/telegram.example.env` — шаблон. install.sh
  копирует его по пути `TELEGRAM_ENV_FILE` и заполняет значениями из
  `$INFRA_ROOT/.env`. Путь задаётся в .env.

### 6.4. Production: где лежат БД, медиа и vendor админки

На сервере контейнеры **монтируют с хоста**:

- `$AUTOTEKA_ROOT/backend/database` — SQLite;
- `$AUTOTEKA_ROOT/backend/storage` — загрузки и файловое хранилище Laravel;
- `$AUTOTEKA_ROOT/backend/apps/ShopOperator/public/vendor` — статика админки для nginx.

Резервное копирование `autoteka backup` захватывает эти каталоги по правилам
`backup-rules-autoteka.txt`. Миграция данных со **старых** Docker volumes на
диск — см. [DEPLOY: миграция с Docker volume](../../infrastructure/DEPLOY.md#миграция-с-docker-volume-на-диск-ранее-именованные-тома).

**`sudo` и `autoteka`:** у интерактивного root переменные из
`/etc/profile.d/autoteka.sh` видны, но `sudo команда` по умолчанию **сбрасывает**
окружение — `OPTIONS_FILE` не дойдёт. Варианты: работать уже под root
без `sudo`, либо `sudo OPTIONS_FILE=/etc/autoteka/options.env autoteka …`,
либо `sudo -E autoteka …` (если разрешено в sudoers).

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
autoteka diagnose
```

(`autoteka diagnose` вызывает `docker compose` с тем же набором `-f`, 
что и `autoteka up` / deploy: при `DEPLOY_MODE=prod` 
подключается `docker-compose.prod.yml`. 
Подробнее — [DEPLOY](../../infrastructure/DEPLOY.md).)

Подробности:

- первичная установка —
  [DEPLOY §4](../../infrastructure/DEPLOY.md#4-развёртывание-с-нуля);
- переменные окружения —
  [DEPLOY §5](../../infrastructure/DEPLOY.md#5-настройки-окружения);
- что именно делает `install.sh` —
  [DEPLOY §3](../../infrastructure/DEPLOY.md#3-что-делает-installsh).

### 7.5. Как чинить и диагностировать контейнерный контур

Проверить контейнеры production:

```bash
autoteka diagnose
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

Общая картина и рекомендации:

```bash
autoteka diagnose
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

Подробные сценарии диагностики и починки — см. 
[§12. Пошаговая диагностика](#12-пошаговая-диагностика).

### 7.6. Как обслуживать систему

Запустить backup:

```bash
autoteka backup
```

Запустить restore:

```bash
autoteka restore --archive-root=/root/autoteka-backup-root-*.tar.gz --archive-autoteka=/root/autoteka-backup-autoteka-*.tar.gz
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

### 7.7. Журналы приложения

При диагностике смотрите в следующие журналы. Команда `autoteka diagnose`
выводит последние 3 строки из каждого лога в порядке: deploy, maintenance,
telegram, watchdog, metrics.

| Журнал                                                                | Что пишется                           | Когда смотреть               |
|-----------------------------------------------------------------------|---------------------------------------|------------------------------|
| `$LOG_DIR/autoteka-deploy.log`                               | deploy, watch-changes                 | Деплой не срабатывает        |
| `$LOG_DIR/server-maintenance.log`                            | apt, journalctl, docker prune, backup | Проблемы maintenance         |
| `$LOG_DIR/telegram.log`                                      | Попытки отправки в Telegram           | Не приходят уведомления      |
| `$LOG_DIR/server-watchdog.log`                               | start, check domain, end, result      | Сайт/API/админка, контейнеры |
| `$LOG_DIR/server-metrics.log`                                | load, ram, health                     | Нет данных в /metrics        |
| `backend/apps/ShopAPI/storage/logs/laravel.log`                       | Laravel-логи ShopAPI                  | Ошибки API, админки, БД      |
| `backend/apps/ShopOperator/storage/logs/laravel.log`                  | Laravel-логи ShopOperator             | Ошибки API, админки, БД      |
| `journalctl -u autoteka.service -u watch-changes.service`             | systemd-юниты deploy                  | Деплой, таймеры              |
| `journalctl -u server-watchdog.service -u server-maintenance.service` | watchdog, maintenance                 | Здоровье системы             |
| `docker compose logs web`, `docker compose logs php`                  | nginx, php-fpm                        | Веб-сервер, PHP              |

`LOG_DIR` задаётся в `/etc/autoteka/options.env` (по умолчанию `/var/log/autoteka`).
Пути к Laravel-логам — относительно корня приложения в контейнере или на хосте.

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
- `$INFRA_ROOT/repair/diagnose.sh` или `autoteka diagnose` — общая картина и
  рекомендации по repair (read-only).
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
- `$INFRA_ROOT/maintenance/backup.sh` или `autoteka backup` — backup
  runtime-конфигурации, секретов и данных на диске `$AUTOTEKA_ROOT` (три архива
  по glob-правилам; в prod включают БД и `backend/storage`).
- `$INFRA_ROOT/maintenance/restore.sh` или `autoteka restore` —
  восстановление из архивов (`--archive-root`, `--archive-autoteka`, `--archive-infra`).
- `$INFRA_ROOT/bootstrap/uninstall.sh` или `autoteka uninstall <mode>` —
  удаление установленной системы.

Куда смотреть за подробностями:

- install/bootstrap —
  [DEPLOY §3](../../infrastructure/DEPLOY.md#3-что-делает-installsh) и
  [DEPLOY §4](../../infrastructure/DEPLOY.md#4-развёртывание-с-нуля);
- диагностика и repair —
  [§12. Пошаговая диагностика](#12-пошаговая-диагностика);
- maintenance —
  [DEPLOY §8](../../infrastructure/DEPLOY.md#8-техническое-обслуживание);
- uninstall —
  [DEPLOY §9](../../infrastructure/DEPLOY.md#9-удаление-установленной-системы);
- backup/restore —
  [DEPLOY §10](../../infrastructure/DEPLOY.md#10-резервное-копирование-и-восстановление-deploy-настроек).

## 9. Backup, restore и uninstall

Основные команды администратора:

- `autoteka backup` — backup runtime-настроек, секретов и данных из
  `$AUTOTEKA_ROOT` на диске (три архива по glob-правилам);
- `autoteka restore` — restore из архивов (`--archive-root`, `--archive-autoteka`, `--archive-infra`);
- `autoteka uninstall <mode>` — удаление установленной системы.

Быстрые примеры:

```bash
sudo autoteka backup
sudo autoteka restore --archive-root=/root/autoteka-backup-root-YYYYMMDD-HHMMSS.tar.gz --archive-autoteka=/root/autoteka-backup-autoteka-YYYYMMDD-HHMMSS.tar.gz
sudo autoteka uninstall soft
```

Подробности:

- backup/restore —
  [DEPLOY §10](../../infrastructure/DEPLOY.md#10-резервное-копирование-и-восстановление-deploy-настроек);
- uninstall —
  [DEPLOY §9](../../infrastructure/DEPLOY.md#9-удаление-установленной-системы).

### 9.1. Очистка после uninstall

`autoteka uninstall` (soft, purge, nuke) не удаляет всё. После полного
удаления остаётся:

- **apt-пакеты** (docker, logrotate, fail2ban и т.д.) — установлены
  через apt, uninstall их не трогает;
- **Docker images и volumes** — `compose down` удаляет контейнеры, но
  не образы и не именованные volumes (в т.ч. от dev-стека или старых
  версий compose). Данные prod БД и storage при текущей схеме — **в каталогах
  под** `$AUTOTEKA_ROOT/backend/`, их удаляет только `autoteka uninstall` с
  соответствующими флагами (например `--rm-root`), а не `compose down` один.
  Для удаления неиспользуемых образов и томов при nuke используйте
  `--prune-images` и `--prune-volumes`:
  `sudo autoteka uninstall nuke --force --rm-root --prune-images --prune-volumes`;
- **`/root/uninstall-backup-*`** — создаётся при nuke для бэкапа
  SYSTEM_FILES; удалите вручную при необходимости.

Флаги `--prune-images` и `--prune-volumes` действуют только в режиме
nuke и по умолчанию выключены, чтобы не затрагивать образы и volumes
других проектов.

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
ошибок — см. [§12. Пошаговая диагностика](#12-пошаговая-диагностика).

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

- ручные команды — см. [§11.3. Что делать руками](#113-что-делать-руками);
- repair-infra — `autoteka repair-infra`;
- коды ошибок — см. [§12. Пошаговая диагностика](#12-пошаговая-диагностика).

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

## 12. Пошаговая диагностика

Ниже — пошаговые инструкции при типичных проблемах. Журналы — см.
[§7.7. Журналы приложения](#77-журналы-приложения).

### 12.1. Нет метрик в /metrics

1. Проверить `tail -n 50 $LOG_DIR/server-metrics.log` — пишет ли watchdog.
2. Проверить `ls -la $INFRA_ROOT/observability/application/metrics/data.json`.
3. Выполнить вручную: `$INFRA_ROOT/observability/application/metrics-export.sh`.
4. Проверить монтирование в nginx: `docker compose exec web ls /usr/share/nginx/html/metrics/`.
5. При необходимости: `autoteka repair-infra`, перезапуск watchdog.

### 12.2. Не приходят сообщения в Telegram

1. Проверить файл по `TELEGRAM_ENV_FILE`: `TELEGRAM_TOKEN`, `TELEGRAM_CHAT`.
2. Проверить `tail -n 50 $LOG_DIR/telegram.log` — попытки отправки и ошибки.
3. Проверить lock-файлы: `autoteka diagnose` выводит их список, или вручную `ls $TELEGRAM_LOCK_DIR` (обычно `/tmp/autoteka-telegram-locks/`).
4. При необходимости: `autoteka health-reset all` — сброс lock'ов.
5. Проверить доступность `api.telegram.org` с сервера.

### 12.3. Не происходит деплой после push

1. Проверить `systemctl status watch-changes.timer` — активен ли таймер.
2. Проверить `tail -n 100 /var/log/autoteka-deploy.log` — логи watch-changes и deploy.
3. Проверить `journalctl -u watch-changes.service -n 50`.
4. Убедиться, что `BRANCH` и `REMOTE` в `/etc/autoteka/options.env` корректны.
5. Запустить вручную: `autoteka watch-changes`.
6. При необходимости: `autoteka repair-infra`.

### 12.4. Сайт недоступен

1. `autoteka diagnose` — контейнеры и проверка HTTP endpoints.
2. Логи nginx/php: `docker compose` с тем же набором файлов, что при deploy ([DEPLOY](../../infrastructure/DEPLOY.md)), либо `docker logs` по имени контейнера из вывода `docker ps`.
3. `curl -i http://127.0.0.1/healthcheck` — ответ nginx.
4. При необходимости: `autoteka repair-health nginx`, `autoteka repair-runtime`.

### 12.5. Backend/API не отвечает

1. Логи PHP-FPM: `docker compose` с набором файлов из [DEPLOY](../../infrastructure/DEPLOY.md) (`logs php`) или `docker logs` по имени контейнера `php`.
2. `curl -i http://127.0.0.1/up` — backend.
3. `curl -i http://127.0.0.1/api/v1/category-list` — API.
4. При необходимости: 
   - `autoteka repair-health php`, 
   - `autoteka repair-health backend`, 
   - `autoteka repair-runtime`.

### 12.6. Сервер (админка или API) отвечает 502

1. Проверить состояние контейнера `php`:
   - `docker compose ps` — в состоянии `Up` и `healthy`.
2. ошибки PHP-FPM: `docker compose logs php`.
3. ошибки приложения:
   - `backend/apps/ShopAPI/storage/logs/laravel.log`, 
   - `backend/apps/ShopOperator/storage/logs/laravel.log`.
4. При необходимости: 
   - `autoteka repair-health php`, 
   - `autoteka repair-health backend`, 
   - `autoteka repair-runtime`.

### 12.7. Контейнер unhealthy или missing

1. `docker compose ps -a` — полный список контейнеров.
2. `autoteka watchdog --dry-run` — что видит watchdog.
3. При необходимости: `autoteka repair-health <domain>`, `autoteka repair-runtime`.

### 12.8. Медиа не отдаются (404 на /storage/*)

1. Проверить `php artisan storage:link` в контейнере php.
2. Проверить nginx-конфиг: location для `/storage/`.
3. Проверить права на `storage/app/public`.

### 12.9. Ошибки БД

1. `backend/apps/ShopAPI/storage/logs/laravel.log`, `backend/apps/ShopOperator/storage/logs/laravel.log`.
2. Проверить миграции: `php artisan migrate --force` в контейнере.
3. Проверить подключение к БД в `backend/.env`.

### 12.10. Таймеры не запускаются

1. `systemctl status watch-changes.timer server-watchdog.timer server-maintenance.timer`.
2. `journalctl -u watch-changes.timer -u server-watchdog.timer -u server-maintenance.timer -n 50`.
3. При необходимости: `autoteka repair-infra`, `autoteka timers-start`.

### 12.11. Диагностика server-watchdog (лог не найден или не обновляется)

1. Проверить, что таймер и сервис существуют:

   ```bash
   systemctl status server-watchdog.timer server-watchdog.service
   ```

2. Посмотреть последние запуски (journal):

   ```bash
   journalctl -u server-watchdog.service -n 20 --no-pager
   ```

3. Убедиться, что watchdog реально запускается:

   ```bash
   systemctl list-timers server-watchdog.timer
   ```

4. Ручной запуск — должен отработать без ошибок:

   ```bash
   sudo autoteka watchdog
   ```

5. Проверить server-metrics.log (создаётся при каждом успешном прогоне):

   ```bash
   ls -la $LOG_DIR/server-metrics.log
   tail -5 $LOG_DIR/server-metrics.log
   ```

6. Проверить options.env (WATCHDOG_* переменные):

   ```bash
   grep WATCHDOG /etc/autoteka/options.env 2>/dev/null || echo "options.env не найден"
   ```

Ожидаемый результат при здоровой системе: journalctl показывает успешные
запуски (exit 0); server-metrics.log существует и обновляется;
server-watchdog.log создаётся при каждом прогоне (start, check, end).

## 13. Инструкция по обновлению при изменении $INFRA_ROOT

Пути к скриптам и `$INFRA_ROOT` жёстко записаны в systemd-юнитах и
возможно в других конфигурационных файлах. При изменении пути
`$INFRA_ROOT`, путей к скриптам внутри него или при изменении самих
скриптов требуется обновление.

### 13.1. Что обновлять

- Файлы в `/etc/systemd/system/`: 
  - `autoteka.service`, 
  - `watch-changes.service`,
  - `watch-changes.timer`, 
  - `server-watchdog.service`,
  - `server-watchdog.timer`,
  - `server-maintenance.service`, 
  - `server-maintenance.timer`.
- `/etc/autoteka/options.env` — переменные `INFRA_ROOT`, `AUTOTEKA_ROOT`.
- При необходимости — logrotate, cron, другие конфиги, ссылающиеся на пути.

### 13.2. Порядок действий

1. Остановить таймеры: `autoteka timers-stop`.
2. Обновить `/etc/autoteka/options.env` — новые значения `INFRA_ROOT`, `AUTOTEKA_ROOT`.
3. Переустановить systemd-юниты: скопировать в `/etc/systemd/system/` 
   актуальные unit-файлы из:
   - `$INFRA_ROOT/runtime/systemd/`, 
   - `$INFRA_ROOT/observability/infrastructure/systemd/`,
   -  `$INFRA_ROOT/maintenance/systemd/`
4. Выполнить `systemctl daemon-reload`.
5. Запустить таймеры: `autoteka timers-start`.
6. Проверить: 
   - `systemctl status autoteka.service watch-changes.timer server-watchdog.timer server-maintenance.timer`.

Подробности по структуре systemd — [DEPLOY §6.1](../../infrastructure/DEPLOY.md#61-systemd-и-timers).
