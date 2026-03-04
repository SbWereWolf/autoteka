# Deploy on a fresh server (Debian/Ubuntu)

Эта папка содержит админ-скрипты, которые поднимают сервер с нуля и держат его в self-healing состоянии.
Основная цель: **автоматическая публикация через git pull + docker compose**.

## Требования и допущения

- Репозиторий клонируется на сервер **в /opt/vue-app**
- Деплой работает через polling (systemd timer) — без webhook
- Приложение — статический Vue/Vite сайт, публикуется через Docker (nginx)

## Что делает deploy/install.sh

- ставит базовые утилиты (curl/git/wget/bc/logrotate/fail2ban)
- ставит Docker **только если Docker ещё не установлен** (на Debian использует `docker.io`)
- включает docker service и проверяет наличие `docker compose`
- ограничивает docker-логи (`/etc/docker/daemon.json`)
- ограничивает systemd journal (drop-in в `/etc/systemd/journald.conf.d/`)
- настраивает fail2ban (jail `sshd`)
- включает self-healing watchdog (`server-watchdog.timer`, запуск каждые 2 минуты)
- включает daily maintenance (`server-maintenance.timer`)
- ставит systemd unit `vue-app.service` для `docker compose up -d`
- включает авто-деплой из git (`vue-app-deploy.timer`, каждые 5 минут)
- добавляет logrotate для логов watchdog/metrics/maintenance/deploy
- готовит файл `/etc/vue-app/telegram.env` (опционально) для Telegram-уведомлений

## Поднятие с нуля

### 1) Зайти на сервер под root

### 2) Поставить git (если нет)

```bash
apt update && apt install -y git
```

### 3) Склонировать репозиторий в /opt/vue-app

```bash
mkdir -p /opt/vue-app
cd /opt/vue-app
git clone https://github.com/SbWereWolf/autoteka.git .
```

> Если репозиторий приватный — добавьте SSH-ключи, чтобы `git pull` работал без пароля.

### 4) Запустить bootstrap

```bash
chmod +x /opt/vue-app/deploy/install.sh
sudo /opt/vue-app/deploy/install.sh
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

## Настройка ветки

По умолчанию деплой следит за `origin/main`.
Можно изменить, задав переменные окружения в unit-файле или через EnvironmentFile:
- `BRANCH` (например `master`)
- `REMOTE` (например `origin`)
