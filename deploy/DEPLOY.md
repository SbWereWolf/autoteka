# Deploy и эксплуатация

**Дата актуализации: 2026-03-06.**

Документ описывает развёртывание, наблюдаемость, диагностику поломок,
техническое обслуживание и удаление установленной системы.

## 1. Целевая схема

Deployment-контур ориентирован на Debian/Ubuntu и использует:

- `docker compose`;
- `nginx` в контейнере `web`;
- Laravel backend в контейнере `php`;
- `systemd` для автодеплоя, watchdog и maintenance.

Текущий compose-контур:

- `web` — раздаёт frontend, отдаёт `/metrics`, проксирует backend;
- `php` — исполняет Laravel backend.

Актуальный deploy-алгоритм разделён на два скрипта:

1. `watch-changes.sh` выполняет `git fetch`;
2. сравнивает локальный `HEAD` и `REMOTE/BRANCH`;
3. если commit совпадает, пишет `no changes` и завершает работу;
4. если commit отличается, проверяет рабочую копию на локальные
   изменения;
5. при наличии локальных изменений выполняет
   `git stash push --include-untracked` с комментарием, где есть дата,
   время и причина очистки перед автодеплоем;
6. фиксирует результат `git stash` и идентификатор stash в
   `/var/log/vue-app-deploy.log`, чтобы пользователь мог восстановить
   изменения вручную;
7. выполняет `git reset --hard $REMOTE/$BRANCH`;
8. запускает `deploy.sh` отдельным новым процессом;
9. `deploy.sh` раскатывает уже текущий `HEAD` без повторного `git fetch`
   и `git reset`;
10. `deploy.sh` поднимает только контейнер `php`;
11. ждёт готовности контейнера к `docker compose exec` с timeout;
12. на host приводит runtime-каталоги Laravel к состоянию,
    пригодному для записи от пользователя php-fpm внутри контейнера;
13. внутри `php` создаёт `.env`, если его нет;
14. внутри `php` выполняет `composer install`;
15. проверяет запуск `artisan`;
16. включает Laravel maintenance mode;
17. создаёт `APP_KEY`, если ключа ещё нет;
18. выполняет `php artisan migrate --force`;
19. выполняет `php artisan db:seed --class=AdminUserSeeder --force`;
20. проверяет запись Laravel в SQLite/session/cache;
21. снимает maintenance mode;
22. поднимает или перезапускает контейнер `web`;
23. выполняет HTTP smoke-check `GET /admin/login`;
24. отправляет success-уведомление в Telegram с hash и `subject`
    последнего раскатанного commit.

`deploy/php/entrypoint.sh` больше не выполняет миграции, сиды и
`composer install`: entrypoint отвечает только за runtime-start.

## 2. Базовые принципы

- путь к репозиторию задаётся через `AUTOTEKA_ROOT`;
- `AUTOTEKA_ROOT` хранится в `/etc/vue-app/deploy.env`;
- systemd unit'ы используют wrapper `/usr/local/bin/autoteka`, а не
  жёстко прошитый путь в репозиторий;
- автодеплой выполняется через `watch-changes.sh` и git polling timer.
- `backend` смонтирован в контейнер `php` как bind mount, поэтому
  права runtime-каталогов Laravel нужно обеспечивать на этапе запуска,
  а не через `Dockerfile`.

## 3. Что делает install.sh

`deploy/install.sh`:

- ставит базовые пакеты `curl`, `git`, `wget`, `bc`, `logrotate`,
  `fail2ban`;
- устанавливает Docker, если он ещё не установлен;
- включает `docker`;
- создаёт `deploy/metrics/data.json`;
- применяет настройки docker logging, journald и fail2ban;
- готовит `/etc/vue-app/deploy.env`;
- опционально создаёт `/etc/vue-app/telegram.env`;
- устанавливает `/usr/local/bin/autoteka`;
- устанавливает и включает systemd unit'ы и timers;
- устанавливает logrotate-конфиги.

## 4. Развёртывание с нуля

### 4.1. Подготовить сервер

```bash
apt update && apt install -y git
```

### 4.2. Склонировать репозиторий

```bash
mkdir -p /opt/vue-app
cd /opt/vue-app
git clone <YOUR_REPO_URL> .
```

Каталог клонирования станет значением `AUTOTEKA_ROOT`.

### 4.3. Запустить bootstrap

```bash
chmod +x ./deploy/install.sh
sudo ./deploy/install.sh
```

### 4.4. Проверить состояние

```bash
systemctl status vue-app.service
systemctl status vue-app-deploy.timer
systemctl status server-watchdog.timer
systemctl status server-maintenance.timer
docker compose -f deploy/docker-compose.yml ps
```

### 4.5. Правило проверки миграций

Любая новая или изменённая миграция должна быть проверена цепочкой:

```bash
php artisan migrate
php artisan migrate:rollback
php artisan migrate
```

Если все три команды проходят без ошибок, миграция считается
корректной.

## 5. Настройки окружения

### 5.1. /etc/vue-app/deploy.env

Основные переменные:

- `AUTOTEKA_ROOT` — путь к репозиторию;
- `BRANCH` — ветка для автодеплоя, по умолчанию `master`;
- `REMOTE` — git remote, по умолчанию `origin`;
- `HTTP_PORT` — внешний порт nginx;
- `PHP_READY_TIMEOUT` — timeout ожидания готовности контейнера `php`;
- `ADMIN_SMOKE_URL` — URL для post-deploy smoke-check, по умолчанию
  `http://127.0.0.1/admin/login`.

После правки:

```bash
systemctl daemon-reload
systemctl restart vue-app-deploy.timer
systemctl start vue-app-deploy.service
```

### 5.2. /etc/vue-app/telegram.env

Опциональный файл для уведомлений deploy/watchdog/maintenance:

- `TELEGRAM_TOKEN`
- `TELEGRAM_CHAT`

### 5.3. backend/.env

Backend runtime-конфиг, включая:

- `APP_URL`
- database credentials
- `MOONSHINE_ADMIN_NAME`
- `MOONSHINE_ADMIN_EMAIL`
- `MOONSHINE_ADMIN_PASSWORD`

### 5.4. Writable runtime paths Laravel

При использовании bind mount для `backend` права нужно выставлять на
host, не только в контейнере.

Laravel должен иметь возможность писать как минимум в:

- `backend/database`
- `backend/storage`
- `backend/bootstrap/cache`

Для SQLite важно, чтобы writable был не только файл
`backend/database/database.sqlite`, но и сам каталог `backend/database`,
потому что движок создаёт рядом служебные файлы `*.sqlite-wal` и
`*.sqlite-shm`.

## 6. Наблюдаемость

### 6.1. systemd

Проверка состояния:

```bash
systemctl status vue-app.service
systemctl status vue-app-deploy.service
systemctl status vue-app-deploy.timer
systemctl status server-watchdog.service
systemctl status server-watchdog.timer
systemctl status server-maintenance.service
systemctl status server-maintenance.timer
```

### 6.2. Docker

```bash
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f web
docker compose -f deploy/docker-compose.yml logs -f php
```

### 6.3. Логи

Основные логи:

- `/var/log/vue-app-deploy.log`
- `/var/log/server-watchdog.log`
- `/var/log/server-metrics.log`
- `/var/log/server-maintenance.log`
- `/var/log/autoteka-telegram.log`

Через journal:

```bash
journalctl -u vue-app.service -n 100 --no-pager
journalctl -u vue-app-deploy.service -n 100 --no-pager
journalctl -u server-watchdog.service -n 100 --no-pager
journalctl -u server-maintenance.service -n 100 --no-pager
```

### 6.4. /metrics

`server-watchdog.sh` пишет строки метрик в
`/var/log/server-metrics.log`, а `metrics-export.sh` преобразует
последние записи в JSON-файл:

- host path: `deploy/metrics/data.json`
- web path: `http://<HOST>/metrics/data.json`

Содержимое метрик включает:

- timestamp;
- `load`;
- `ram`;
- `health`.

### 6.5. Telegram-уведомления и антиспам

Эксплуатационные скрипты используют единый helper из
`deploy/_common.sh`.

Правила:

- project в сообщениях всегда указывается как `autoteka`;
- у каждого error-сообщения есть code, по которому его можно искать в
  логах и документации;
- антиспам реализован через lock-файлы во временной директории ОС:
  `${TMPDIR:-/tmp}/autoteka-telegram-locks`;
- lock-файл создаётся только через `touch`, содержимое в него не
  пишется;
- если lock-файл уже существует, повторное error-сообщение с тем же
  code не отправляется;
- если эксплуатационный скрипт завершился без ошибок, он удаляет свои
  lock-файлы;
- `watch-changes.sh` отвечает только за git polling и запуск rollout;
- `deploy.sh` всегда отправляет одно success-сообщение после успешной
  раскатки текущего `HEAD`, для него lock-файл не создаётся;
- ошибка `metrics-export.sh` отправляется как notify-событие без
  lock-файла и не блокирует дальнейшую работу watchdog;
- каждая реальная отправка в Telegram логируется в
  `/var/log/autoteka-telegram.log`;
- время в `autoteka-telegram.log` пишется в UTC в формате
  `date -u '+%Y-%m-%d %H:%M'`;
- отдельный bot-лог ограничивается через logrotate: `size 100k`,
  `rotate 4`.

Формат сообщений:

```text
[autoteka][<script_id>][<code>] <целевое действие>. Причина: <причина>.
```

Для notify-сообщений вместо `Причина` используется `Событие`.

Формат записей Telegram-интеграции:

```text
{date -u '+%Y-%m-%d %H:%M'} Для отправки подготовлено сообщение: {message}
{date -u '+%Y-%m-%d %H:%M'} Успешная отправка: {message}
{date -u '+%Y-%m-%d %H:%M'} Сбой отправки: {message}
```

## 7. Диагностика поломок

### 7.1. Сайт недоступен

Проверьте:

1. `systemctl status vue-app.service`
2. `docker compose -f deploy/docker-compose.yml ps`
3. `docker compose -f deploy/docker-compose.yml logs -f web`
4. проброс `HTTP_PORT`

### 7.2. Backend/API не отвечает

Проверьте:

1. `docker compose -f deploy/docker-compose.yml logs -f php`
2. наличие и корректность `backend/.env`
3. доступность `/api/v1/*`
4. миграции и seed initial admin
5. права на `backend/storage`, `backend/bootstrap/cache`,
   `backend/database`, `backend/database/database.sqlite`

Laravel должен иметь возможность писать как минимум в:

- `storage/framework/cache`
- `storage/framework/sessions`
- `storage/framework/views`
- `storage/logs`
- `bootstrap/cache`
- `database`

Проверка:

```bash
docker compose -f deploy/docker-compose.yml exec php ls -ld \
  /var/www/backend/database \
  /var/www/backend/storage \
  /var/www/backend/storage/framework \
  /var/www/backend/storage/framework/views \
  /var/www/backend/storage/logs \
  /var/www/backend/bootstrap/cache
```

Ожидаемое состояние:

- владелец `www-data:www-data`;
- права не уже, чем `drwxrwxr-x`.

Если приложение застряло в maintenance mode после неудачного deploy,
проверьте логи deploy и снимите режим вручную только после устранения
причины ошибки:

```bash
docker compose -f deploy/docker-compose.yml exec php php artisan up
```

Для безопасного восстановления runtime после проблем с правами
используйте:

```bash
autoteka repair-runtime
```

Команда поднимает `php`, подготавливает writable paths Laravel,
проверяет запись в SQLite/session/cache, поднимает `web` и выполняет
smoke-check `GET /admin/login`.

### 7.3. Контейнер unhealthy или missing

Проверьте:

1. `docker inspect vue-app`
2. `systemctl status server-watchdog.service`
3. `/var/log/server-watchdog.log`
4. `/var/log/server-metrics.log`

Watchdog умеет:

- перезапустить контейнер;
- перезапустить compose unit;
- выполнить reboot с cooldown.

### 7.4. Не работает автодеплой

Проверьте:

```bash
systemctl list-timers --all | grep vue-app-deploy
journalctl -u vue-app-deploy.service -n 100 --no-pager
tail -n 100 /var/log/vue-app-deploy.log
```

Проверьте также `BRANCH`, `REMOTE` и доступность git remote.

### 7.5. Не обновляется /metrics

Проверьте:

1. запускается ли `server-watchdog.timer`;
2. пишется ли `/var/log/server-metrics.log`;
3. существует ли `deploy/metrics/data.json`;
4. смонтирован ли `deploy/metrics` в контейнер `web`.

### 7.6. Не приходят Telegram-уведомления

Проверьте:

- `/etc/vue-app/telegram.env`;
- переменные `TELEGRAM_TOKEN` и `TELEGRAM_CHAT`;
- исходящий доступ сервера к `api.telegram.org`.
- `/var/log/autoteka-telegram.log`;
- наличие записей `Для отправки подготовлено сообщение`,
  `Успешная отправка` или `Сбой отправки`.

### 7.7. Коды сообщений, причины и способы исправления

#### Watch changes

`WATCH_CHANGES_FETCH_FAILED`

- Причина: не удалось выполнить `git fetch`.
- Проверьте: `REMOTE`, `BRANCH`, сеть до git remote, SSH key/token.
- Исправление: восстановить доступ к remote, затем запустить
  `systemctl start vue-app-deploy.service`.

`WATCH_CHANGES_STASH_FAILED`

- Причина: не удалось сохранить локальные изменения через `git stash`.
- Проверьте: `git status --porcelain --untracked-files=all`, права на
  каталог репозитория, свободное место на диске.
- Исправление: устранить конфликт/проблему прав, затем вручную
  сохранить изменения и повторить запуск watcher.

`WATCH_CHANGES_WORKTREE_DIRTY_AFTER_STASH`

- Причина: после `git stash` рабочая копия всё ещё не чистая.
- Проверьте: `git status --porcelain --untracked-files=all`,
  ignored/unmerged файлы, проблемные права доступа.
- Исправление: привести дерево к чистому состоянию вручную и только
  потом повторить watcher.

`WATCH_CHANGES_RESET_FAILED`

- Причина: не удалось выполнить `git reset --hard`.
- Проверьте: `git status`, наличие `REMOTE/BRANCH`, права на каталог.
- Исправление: исправить git-состояние и повторить watcher.

`WATCH_CHANGES_DEPLOY_START_FAILED`

- Причина: watcher не смог запустить `deploy.sh` после обновления
  рабочей копии.
- Проверьте: наличие и права на `deploy.sh`, wrapper и логи systemd.
- Исправление: восстановить исполняемость и повторить watcher.

#### Deploy

`DEPLOY_COMPOSE_PULL_FAILED`

- Причина: `docker compose pull` завершился ошибкой.
- Проверьте: `docker compose -f deploy/docker-compose.yml pull`,
  доступ к registry, сеть, rate limits.
- Исправление: восстановить доступ к registry и повторить deploy.

`DEPLOY_PHP_UP_FAILED`

- Причина: не удалось поднять контейнер `php`.
- Проверьте: `docker compose -f deploy/docker-compose.yml ps`,
  `docker compose -f deploy/docker-compose.yml logs -f php`.
- Исправление: исправить compose/runtime-конфигурацию и повторить
  deploy.

`DEPLOY_PHP_WAIT_FAILED`

- Причина: контейнер `php` не стал готов к `docker compose exec`.
- Проверьте: логи `php`, ресурсы сервера, зависшие startup-команды.
- Исправление: устранить причину медленного/неуспешного старта и
  повторить deploy.

`DEPLOY_LARAVEL_PREPARE_FAILED`

- Причина: не удалось подготовить runtime-каталоги Laravel для записи.
- Проверьте: bind mount `backend`, readonly mount, владельца/права
  `storage`, `bootstrap/cache`, `database`, `.env`, логи контейнера
  `php`.
- Исправление: восстановить запись в каталог проекта и повторить
  deploy или выполнить `autoteka repair-runtime`.

`DEPLOY_COMPOSER_INSTALL_FAILED`

- Причина: `composer install` внутри контейнера завершился ошибкой.
- Проверьте: сеть до packagist/mirror, `composer.lock`, место на
  диске, логи контейнера `php`.
- Исправление: исправить зависимости/сеть и повторить deploy.

`DEPLOY_ARTISAN_CHECK_FAILED`

- Причина: базовая проверка `php artisan --version` не прошла.
- Проверьте: `backend/.env`, права, доступ к PHP runtime.
- Исправление: исправить backend-конфиг и повторить deploy.

`DEPLOY_MAINTENANCE_DOWN_FAILED`

- Причина: не удалось включить maintenance mode.
- Проверьте: `docker compose exec php php artisan down`.
- Исправление: устранить проблему artisan-команд и повторить deploy.

`DEPLOY_KEYGEN_FAILED`

- Причина: не удалось создать `APP_KEY`.
- Проверьте: наличие/доступность `backend/.env`, права записи.
- Исправление: исправить `.env` и права, затем повторить deploy.

`DEPLOY_MIGRATE_FAILED`

- Причина: `php artisan migrate --force` завершился ошибкой.
- Проверьте: доступность БД, миграции, логи backend.
- Исправление: исправить миграции или БД, затем повторить deploy.

`DEPLOY_SEED_FAILED`

- Причина: `php artisan db:seed --class=AdminUserSeeder --force`
  завершился ошибкой.
- Проверьте: сидер, доступность БД, переменные `MOONSHINE_ADMIN_*`,
  backend logs.
- Исправление: исправить seed-конфиг или сидер и повторить deploy.

`DEPLOY_SQLITE_WRITE_CHECK_FAILED`

- Причина: Laravel не смог записать в SQLite/session/cache после
  миграций.
- Проверьте: writable-права на `backend/database`,
  `backend/storage`, `backend/bootstrap/cache`, наличие таблиц
  `sessions`, `cache`, логи backend.
- Исправление: восстановить writable runtime, затем повторить deploy
  или выполнить `autoteka repair-runtime`.

`DEPLOY_MAINTENANCE_UP_FAILED`

- Причина: не удалось снять maintenance mode.
- Проверьте: `docker compose exec php php artisan up`.
- Исправление: снять режим вручную после устранения причины поломки.

`DEPLOY_WEB_UP_FAILED`

- Причина: не удалось поднять контейнер `web`.
- Проверьте: `docker compose -f deploy/docker-compose.yml ps`,
  `docker compose -f deploy/docker-compose.yml logs -f web`.
- Исправление: исправить runtime-конфигурацию web и повторить deploy.

`DEPLOY_ADMIN_SMOKE_CHECK_FAILED`

- Причина: после успешного запуска `web` URL `/admin/login` не прошёл
  HTTP smoke-check.
- Проверьте: `docker compose -f deploy/docker-compose.yml logs -f web`,
  `docker compose -f deploy/docker-compose.yml logs -f php`,
  `APP_URL`, reverse proxy и backend error log.
- Исправление: устранить runtime-ошибку и повторить deploy; при
  проблемах с правами или SQLite сначала выполнить
  `autoteka repair-runtime`.

`DEPLOY_SUCCESS`

- Событие: deploy завершился успешно.
- Содержимое: hash раскатанного commit и `subject` последнего commit.
- Действие оператора: проверить front office, `/admin/login`,
  `/metrics/data.json`.

#### Watchdog

`WATCHDOG_STAGE1_RESTART`

- Причина: watchdog выполнил stage1 recovery через restart контейнера
  или старт compose unit.
- Проверьте: `docker inspect vue-app`, логи контейнера и ресурсы
  сервера.
- Исправление: устранить первопричину деградации контейнера.

`WATCHDOG_STAGE2_SYSTEMD_RESTART`

- Причина: watchdog дошёл до stage2 и перезапустил `vue-app.service`.
- Проверьте: `systemctl status vue-app.service`, compose logs.
- Исправление: устранить причину повторяющихся сбоев контейнера.

`WATCHDOG_STAGE3_REBOOT_SKIPPED`

- Причина: потребовался reboot, но сработал cooldown.
- Проверьте: `/var/lib/server-watchdog.reboot`, load, RAM, состояние
  контейнера.
- Исправление: устранить причину перегрузки до следующего цикла.

`WATCHDOG_STAGE3_REBOOT_NOW`

- Причина: watchdog инициировал reboot сервера.
- Проверьте после старта: `journalctl -b -1`, watchdog log, docker
  service.
- Исправление: найти причину, доведшую сервер до аварийного reboot.

`WATCHDOG_METRICS_EXPORT_FAILED`

- Событие: не удалось обновить `deploy/metrics/data.json`.
- Проверьте: `server-watchdog.log`, права на
  `deploy/metrics/data.json`, наличие каталога `deploy/metrics`,
  `/var/log/autoteka-telegram.log`.
- Исправление: исправить права/путь; событие не блокирует watchdog и
  не требует очистки lock-файлов.

#### Maintenance

`MAINTENANCE_APT_CLEAN_FAILED`

- Причина: `apt clean` завершился ошибкой.
- Проверьте: права root, состояние package cache, lock apt.
- Исправление: убрать конфликтующие apt lock'и и повторить
  maintenance.

`MAINTENANCE_JOURNAL_VACUUM_FAILED`

- Причина: `journalctl --vacuum-size=100M` завершился ошибкой.
- Проверьте: права, состояние journald, свободное место.
- Исправление: восстановить journald и повторить maintenance.

`MAINTENANCE_DOCKER_IMAGE_PRUNE_FAILED`

- Причина: ошибка `docker image prune -f`.
- Проверьте: `docker info`, состояние daemon.
- Исправление: восстановить Docker daemon и повторить maintenance.

`MAINTENANCE_DOCKER_BUILDER_PRUNE_FAILED`

- Причина: ошибка `docker builder prune -f`.
- Проверьте: `docker info`, build cache, состояние daemon.
- Исправление: восстановить Docker daemon и повторить maintenance.

`MAINTENANCE_DOCKER_CONTAINER_PRUNE_FAILED`

- Причина: ошибка `docker container prune -f`.
- Проверьте: Docker daemon и наличие зависших контейнеров.
- Исправление: восстановить Docker daemon и повторить maintenance.

`MAINTENANCE_TMP_CLEANUP_FAILED`

- Причина: не удалось очистить `/tmp` от старых файлов.
- Проверьте: права, readonly mount, inode exhaustion.
- Исправление: исправить права или mount options и повторить cleanup.

`MAINTENANCE_LOGROTATE_PERM_FIX_FAILED`

- Причина: не удалось выставить права на `/var/lib/logrotate/status`.
- Проверьте: владельца/права файла и ограничения ФС.
- Исправление: исправить права вручную и повторить maintenance.

## 8. Техническое обслуживание

### 8.1. server-maintenance.sh

Ежедневный maintenance:

- `apt clean`;
- `journalctl --vacuum-size=100M`;
- `docker image prune -f`;
- `docker builder prune -f`;
- `docker container prune -f`;
- cleanup `/tmp` старше трёх дней;
- исправление прав `/var/lib/logrotate/status`.

### 8.2. Ручное обновление сервера

Если нужно раскатить изменения из рабочего дерева сервера без нового
commit в `REMOTE/BRANCH`, запускайте `autoteka deploy`: этот сценарий
раскатывает текущий `HEAD` без `git fetch` и `git reset`.

Если нужно именно проверить remote и подтянуть новые commit, запускайте
`autoteka watch-changes` или `systemctl start vue-app-deploy.service`.

Если локальные изменения были сохранены автодеплоем, найдите
идентификатор stash в `/var/log/vue-app-deploy.log` и восстановите
нужное состояние вручную, например:

```bash
git stash list
git stash show -p stash@{0}
git stash apply stash@{0}
```

Рекомендуемая последовательность:

1. временно остановить таймер автодеплоя, чтобы он не перетёр
   локальные изменения:

```bash
sudo systemctl stop vue-app-deploy.timer
```

1. перейти в каталог репозитория:

```bash
cd "$AUTOTEKA_ROOT"
```

1. пересобрать и поднять контейнеры вручную:

```bash
sudo docker compose -f deploy/docker-compose.yml up -d --build --remove-orphans
```

1. проверить состояние и логи:

```bash
sudo docker compose -f deploy/docker-compose.yml ps
sudo docker compose -f deploy/docker-compose.yml logs -f web
sudo docker compose -f deploy/docker-compose.yml logs -f php
```

1. после проверки вернуть таймер автодеплоя:

```bash
sudo systemctl start vue-app-deploy.timer
```

Если локальные изменения должны сохраниться надолго, не включайте
автодеплой обратно, пока они не зафиксированы в git и не появились в
`REMOTE/BRANCH`.

### 8.3. Ручной контроль

После инцидента или крупных изменений проверьте:

1. `systemctl status vue-app.service`
   `systemctl status vue-app-deploy.service`
   `systemctl status vue-app-deploy.timer`
   `systemctl status server-watchdog.service`
   `systemctl status server-watchdog.timer`
   `systemctl status server-maintenance.service`
   `systemctl status server-maintenance.timer`
2. `docker compose ps`;
3. доступность главной страницы;
4. доступность `/admin/login`;
5. обновление `/metrics/data.json`.

### 8.4. Ручной импорт исходных данных

Для первичного заполнения справочников и магазинов используйте команду
с хоста сервера из корня проекта:

```bash
docker compose -f deploy/docker-compose.yml exec php php artisan autoteka:data:import <scope> --mode=<dry-run|refresh|append> --file=<path>
```

Scope:

- `city`
- `category`
- `feature`
- `shop`

Правила:

- команда запускается с хоста сервера через `docker compose exec`;
- данные читаются из файла через `--file`;
- пути в `--file` и `--generated-root` должны быть путями внутри
  контейнера `php`, например `/var/www/frontend/...`;
- команда всегда работает в транзакции;
- `dry-run` всегда завершает транзакцию откатом;
- `refresh` сначала очищает данные выбранного scope, затем записывает
  новые;
- `append` только добавляет данные;
- в любом режиме команда выводит количество добавленных записей;
- для `shop` дополнительно нужен `--generated-root=<path>`.

Примеры для Linux-хоста сервера:

```bash
docker compose -f deploy/docker-compose.yml exec php \
php artisan autoteka:data:import city \
--mode=dry-run --file=/var/www/frontend/src/mocks/city-list.json
```

```bash
docker compose -f deploy/docker-compose.yml exec php \
php artisan autoteka:data:import category \
--mode=refresh --file=/var/www/frontend/src/mocks/category-list.json
```

```bash
docker compose -f deploy/docker-compose.yml exec php \
php artisan autoteka:data:import feature \
--mode=append --file=/var/www/frontend/src/mocks/feature-list.json
```

```bash
docker compose -f deploy/docker-compose.yml exec php \
php artisan autoteka:data:import shop \
--mode=refresh --file=/var/www/frontend/src/mocks/shops.json \
--generated-root=/var/www/frontend/public/generated
```

Пример успешного `dry-run`:

```text
Scope: city
Режим: dry-run
Статус: успех
Добавленные записи:
  city: 3
Итого добавлено: 3
Dry-run завершён успешно: данные были тестовыми и не сохранены в БД.
```

Пример успешного `refresh`:

```text
Scope: shop
Режим: refresh
Статус: успех
Добавленные записи:
  contact_type: 4
  shop: 12
  shop_category: 24
  shop_contact: 28
  shop_feature: 16
  shop_gallery_image: 30
  shop_schedule_note: 12
Итого добавлено: 126
Удалённые записи:
  contact_type: 4
  shop: 12
  shop_category: 24
  shop_contact: 28
  shop_feature: 16
  shop_gallery_image: 30
  shop_schedule: 0
  shop_schedule_note: 12
```

Пример ошибки:

```text
Scope: shop
Режим: append
Статус: ошибка
Добавленные записи:
  contact_type: 0
Итого добавлено: 0
[ERROR] contacts: Контакт дублируется: type=phone, value="+7 900 000-00-00" (позиции 1 и 2).
```

## 9. Удаление установленной системы

Для удаления используется:

```bash
sudo ./deploy/uninstall.sh <mode> [flags]
```

Режимы:

- `soft` — остановка сервисов и `docker compose down`;
- `purge` — `soft` плюс удаление app-unit'ов, logrotate, app logs,
  runtime-state;
- `nuke` — `purge` плюс удаление системных конфигов, поставленных
  `install.sh`, с backup в `/root/uninstall-backup-*`.

Флаги:

- `--force`
- `--rm-etc`
- `--rm-root`

Границы безопасности:

- shared server packages не удаляются;
- `/etc/vue-app/*` удаляется только по флагу;
- репозиторий удаляется только по `--rm-root`.

При `purge` удаляются также:

- `/etc/logrotate.d/autoteka-telegram`;
- `/var/log/autoteka-telegram.log`.
