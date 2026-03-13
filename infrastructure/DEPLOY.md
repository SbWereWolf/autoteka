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

## Основные файлы

- `/etc/autoteka/deploy.env` — host env с `AUTOTEKA_ROOT`, `INFRA_ROOT`
  и runtime-настройками.
- `/etc/autoteka/telegram.env` — токен и chat id для уведомлений.
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

При прямом запуске используйте путь внутри `INFRA_ROOT`, например:

```bash
"$INFRA_ROOT"/bootstrap/install.sh
"$INFRA_ROOT"/maintenance/backup.sh
"$INFRA_ROOT"/runtime/deploy.sh
```

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

## Backup и restore

`autoteka backup` сохраняет:

- `/etc/autoteka/deploy.env`;
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
