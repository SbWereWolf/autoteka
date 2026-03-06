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

## 2. Базовые принципы

- путь к репозиторию задаётся через `AUTOTEKA_ROOT`;
- `AUTOTEKA_ROOT` хранится в `/etc/vue-app/deploy.env`;
- systemd unit'ы используют wrapper `/usr/local/bin/autoteka`, а не
  жёстко прошитый путь в репозиторий;
- автодеплой выполняется через git polling timer.

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

## 5. Настройки окружения

### 5.1. /etc/vue-app/deploy.env

Основные переменные:

- `AUTOTEKA_ROOT` — путь к репозиторию;
- `BRANCH` — ветка для автодеплоя, по умолчанию `master`;
- `REMOTE` — git remote, по умолчанию `origin`;
- `HTTP_PORT` — внешний порт nginx.

После правки:

```bash
systemctl daemon-reload
systemctl restart vue-app-deploy.timer
systemctl start vue-app-deploy.service
```

### 5.2. /etc/vue-app/telegram.env

Опциональный файл для уведомлений watchdog:

- `TELEGRAM_TOKEN`
- `TELEGRAM_CHAT`

### 5.3. backend/.env

Backend runtime-конфиг, включая:

- `APP_URL`
- database credentials
- `MOONSHINE_ADMIN_NAME`
- `MOONSHINE_ADMIN_EMAIL`
- `MOONSHINE_ADMIN_PASSWORD`

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
commit в `REMOTE/BRANCH`, не запускайте `autoteka deploy` и не
стартуйте `vue-app-deploy.service`: штатный автодеплой проверяет git
remote и при наличии расхождения выполняет
`git reset --hard $REMOTE/$BRANCH`.

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

1. `systemctl status` для всех app units;
2. `docker compose ps`;
3. доступность главной страницы;
4. доступность `/admin/login`;
5. обновление `/metrics/data.json`.

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
