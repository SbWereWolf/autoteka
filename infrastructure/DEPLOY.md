# DEPLOY

Документ описывает infra-контур проекта.

## Контракты путей

- `AUTOTEKA_ROOT` — корень приложения.
- `INFRA_ROOT` — корень infra-скриптов и infra-ресурсов.
- Эти пути считаются независимыми.
- Infra-пути строятся только от `INFRA_ROOT`.
- Пути приложения строятся только от `AUTOTEKA_ROOT`.
- Нельзя выводить `AUTOTEKA_ROOT` из `INFRA_ROOT` и нельзя выводить
  `INFRA_ROOT` из `AUTOTEKA_ROOT`.

### Откуда берутся INFRA_ROOT и AUTOTEKA_ROOT

Значения задаются **только** одним из способов:

1. Переменные окружения (например, `export INFRA_ROOT=...`).
2. Аргументы запуска (если скрипт поддерживает `--infra-root=` и `--autoteka-root=`).
3. Загрузка из файла (например, `source prod.env`).

При пустых или
относительных путях скрипт завершается с кодом 2 и выводит примеры запуска.

Пример для install.sh (переменные окружения):

```bash
export INFRA_ROOT=/opt/vue-app/infrastructure
export AUTOTEKA_ROOT=/opt/vue-app
sudo ./infrastructure/bootstrap/install.sh
```

или загрузка из файла (prod.env содержит INFRA_ROOT и AUTOTEKA_ROOT):

```bash
set -a
source ./infrastructure/prod.env
set +a
sudo -E ./infrastructure/bootstrap/install.sh
```

или аргументы:

```bash
sudo ./infrastructure/bootstrap/install.sh --infra-root=/opt/vue-app/infrastructure --autoteka-root=/opt/vue-app
```

## Основные файлы

- `$INFRA_ROOT/prod.env` — шаблон переменных для production.
- `$INFRA_ROOT/dev.env` — шаблон переменных для dev-среды.
- `$INFRA_ROOT/.env` — создаётся из prod.env перед install, используется только install.sh.
- `/etc/autoteka/options.env` — рабочий конфиг после установки; все изменения вносить в options.env.
- `/etc/autoteka/telegram.env` — `TELEGRAM_TOKEN`, `TELEGRAM_CHAT`,
  `TELEGRAM_LOG_FILE`. В options.env — только `TELEGRAM_ENV_FILE` (путь к этому
  файлу). Каждое уведомление содержит hash и subject в блоке version.
- `$INFRA_ROOT/bootstrap/` — install/uninstall и host-конфиги.
- `$INFRA_ROOT/runtime/` — compose, rollout и watch-changes.
- `$INFRA_ROOT/repair/` — сценарии починки runtime и infra.
- `$INFRA_ROOT/maintenance/` — backup, restore и периодическое
  обслуживание.
- `$INFRA_ROOT/observability/` — watchdog и экспорт metrics.
- `$INFRA_ROOT/lib/` — общие shell-библиотеки.

## Команды

- `autoteka up` — поднять production runtime.
- `autoteka down` — остановить runtime.
- `autoteka deploy` — раскатить текущий `HEAD`.
- `autoteka watch-changes` — проверить remote и при необходимости
  запустить rollout.
- `autoteka watchdog` — health-check и bounded auto-remediation.
- `autoteka repair-runtime` — тяжёлая починка backend runtime.
- `autoteka repair-health <domain>` — точечная починка домена.
- `autoteka repair-infra` — восстановить таймеры и infra-state.
- `autoteka maintenance` — периодическое обслуживание.
- `autoteka backup` — backup host-конфигов, env и данных.
- `autoteka backup-storage` — отдельный storage/database backup.
- `autoteka restore <archive>` — restore конфигов и данных.
- `autoteka uninstall <mode>` — удаление установленного контура.

При прямом запуске скриптов `INFRA_ROOT` и `AUTOTEKA_ROOT` должны быть уже
заданы (env или options.env). Пример:

```bash
export INFRA_ROOT=/opt/vue-app/infrastructure
export AUTOTEKA_ROOT=/opt/vue-app
"$INFRA_ROOT"/bootstrap/install.sh
"$INFRA_ROOT"/maintenance/backup.sh
"$INFRA_ROOT"/runtime/deploy.sh
```

Скрипты backup, restore и др. поддерживают аргументы `--infra-root=` и
`--autoteka-root=` для переопределения.

## Runtime и сборка контейнеров

- Compose-файлы находятся в `$INFRA_ROOT/runtime/`.
- `build.context` указывает на `AUTOTEKA_ROOT`, потому что backend и
  frontend собираются из приложения.
- `dockerfile` указывает на файл внутри `INFRA_ROOT`.
- Дополнительный build context `infra` пробрасывает в Docker build
  шаблоны nginx/php и entrypoint-скрипты из `INFRA_ROOT`, чтобы сборка
  не зависела от имени каталога.
- Metrics монтируются из
  `$INFRA_ROOT/observability/application/metrics`.

Production:

```bash
docker compose -f "$INFRA_ROOT"/runtime/docker-compose.yml ps
docker compose -f "$INFRA_ROOT"/runtime/docker-compose.yml logs -f web
docker compose -f "$INFRA_ROOT"/runtime/docker-compose.yml logs -f php
```

Dev:

```bash
docker compose \
  -f "$INFRA_ROOT"/runtime/docker-compose.dev.yml \
  -f "$INFRA_ROOT"/runtime/docker-compose.dev.target-dev.yml \
  up --build -d
```

## Подготовка к развёртыванию

Перед первым запуском install.sh:

1. Задайте `INFRA_ROOT` и `AUTOTEKA_ROOT` (env, аргументы или загрузка из файла).
2. Создайте .env из prod.env:

```bash
export INFRA_ROOT=/opt/autoteka/infrastructure
export AUTOTEKA_ROOT=/opt/autoteka
cp -n "$INFRA_ROOT/prod.env" "$INFRA_ROOT/.env"
```

3. Отредактируйте .env при необходимости.
4. Запустите install. Варианты:

   Через env:
   `sudo ./infrastructure/bootstrap/install.sh` (после export INFRA_ROOT и AUTOTEKA_ROOT).

   Через загрузку из файла:
   `set -a \
   && source ./infrastructure/prod.env \
   && set +a \
   && sudo -E ./infrastructure/bootstrap/install.sh`

   Через аргументы:
   `sudo ./infrastructure/bootstrap/install.sh --infra-root=/opt/vue-app/infrastructure --autoteka-root=/opt/vue-app`

install.sh скопирует .env в /etc/autoteka/options.env. После установки
изменяйте значения только в /etc/autoteka/options.env.

## Backup и restore

`autoteka backup` сохраняет:

- `/etc/autoteka/options.env`;
- `/etc/autoteka/telegram.env`;
- systemd units и host-конфиги, устанавливаемые infra-контуром;
- `backend/.env`, `frontend/.env`;
- `backend/database` и `backend/storage`;
- ignored-файлы из allowlist
  `$INFRA_ROOT/maintenance/config/backup-ignored-allowlist.txt`.

`autoteka restore` восстанавливает конфиги и данные, затем очищает
runtime health-state. Параметр `--target-root` переписывает только
`AUTOTEKA_ROOT`; `INFRA_ROOT` остаётся отдельным контрактом.

## Обновление старой установки

Новая версия не выполняет автоматическую миграцию старой установки.
Пошаговый сценарий обновления оформляется отдельной инструкцией в
`tasks/`.

## Диагностика

- `journalctl -u autoteka.service -u watch-changes.service`
- `journalctl -u server-watchdog.service -u server-maintenance.service`
- `tail -n 100 /var/log/autoteka-deploy.log`
- `tail -n 100 /var/log/server-watchdog.log`
- `tail -n 100 /var/log/server-maintenance.log`
- `tail -n 100 /var/log/autoteka-telegram.log`

## Верификация

- Infra-изменения проверяются через `scripts/agent/verify.ps1`.
- Быстрый обязательный gate:

```powershell
scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal
```

- При необходимости отдельно прогоняются repo test-cases, которые
  проверяют infra-документы и shell-скрипты.
