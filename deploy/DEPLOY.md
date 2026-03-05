# Deploy on a fresh server (Debian/Ubuntu)

Эта папка содержит админ‑скрипты, которые поднимают сервер с нуля и
держат его в self‑healing состоянии. Основная цель: **автодеплой через git polling + docker compose**.

## Концепция

- Корень проекта задаётся переменной **`AUTOTEKA_ROOT`**.
- `AUTOTEKA_ROOT` хранится в `/etc/vue-app/deploy.env`.
- systemd unit’ы **не содержат** жёстких путей вида `/opt/vue-app/...` и вызывают стабильный wrapper `/usr/local/bin/autoteka`.

## Что делает `deploy/install.sh`

- ставит базовые утилиты (curl/git/wget/bc/logrotate/fail2ban)
- ставит Docker **только если Docker ещё не установлен** (на Debian использует `docker.io`)
- включает docker service и проверяет наличие `docker compose`
- ограничивает docker‑логи (`/etc/docker/daemon.json`)
- ограничивает systemd journal (drop‑in в `/etc/systemd/journald.conf.d/`)
- настраивает fail2ban (jail `sshd`)
- кладёт `/etc/vue-app/deploy.env` (если нет) и **проставляет `AUTOTEKA_ROOT` текущим путём репозитория**
- (опционально) кладёт `/etc/vue-app/telegram.env` для Telegram‑уведомлений
- устанавливает wrapper `/usr/local/bin/autoteka`
- ставит systemd unit’ы и включает:
  - `vue-app.service` (docker compose up -d)
  - `vue-app-deploy.timer` (git polling каждые 5 минут)
  - `server-watchdog.timer` (каждые 2 минуты)
  - `server-maintenance.timer` (ежедневно)
- добавляет logrotate для логов watchdog/metrics/maintenance/deploy

## Поднятие с нуля

### 1) Зайти на сервер под root

### 2) Поставить git (если нет)

```bash
apt update && apt install -y git
```

### 3) Склонировать репозиторий в любой каталог

> Этот каталог и будет `AUTOTEKA_ROOT`.

```bash
mkdir -p /opt/vue-app
cd /opt/vue-app
git clone <YOUR_REPO_URL> .
```

### 4) Запустить bootstrap

Из корня репозитория:

```bash
chmod +x ./deploy/install.sh
sudo ./deploy/install.sh
```

### 5) Проверить состояние

```bash
systemctl status vue-app.service
systemctl status vue-app-deploy.timer
systemctl status server-watchdog.timer
systemctl status server-maintenance.timer
```

Логи:

- `/var/log/vue-app-deploy.log`
- `/var/log/server-watchdog.log`
- `/var/log/server-metrics.log`
- `/var/log/server-maintenance.log`

## Настройка ветки/remote

`vue-app-deploy.service` читает переменные из `/etc/vue-app/deploy.env`:

- `AUTOTEKA_ROOT` — путь к репозиторию
- `BRANCH` (по умолчанию `master`)
- `REMOTE` (по умолчанию `origin`)

Пример:

```bash
sudoedit /etc/vue-app/deploy.env
systemctl daemon-reload
systemctl restart vue-app-deploy.timer
systemctl start vue-app-deploy.service
```

Диагностика автодеплоя:

```bash
systemctl list-timers --all | grep vue-app-deploy
journalctl -u vue-app-deploy.service -n 100 --no-pager
tail -n 100 /var/log/vue-app-deploy.log
```

## Undeploy

- До переезда (legacy схема): `./deploy/undeploy-pre-move.sh`
- После переезда (текущая схема): `./deploy/undeploy.sh`
