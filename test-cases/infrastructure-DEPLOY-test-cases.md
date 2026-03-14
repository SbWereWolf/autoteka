# Э4 — тест-кейсы для infrastructure/DEPLOY.md

## Область

- Документ-источник: `infrastructure/DEPLOY.md`
- Цель: проверить тестами проверяемые утверждения документа
- Формат трассировки:
  `infrastructure/DEPLOY.md -> утверждение -> тест-кейс -> каталог тестов`

## Тест-кейсы

### TC-DEPLOY-001

- Утверждение: deployment-контур использует `docker compose`,
  контейнеры `web` и `php`.
- Проверка:
  1. Проверить `$INFRA_ROOT/runtime/docker-compose.yml`.
  2. Убедиться, что сервисы `web` и `php` объявлены.
- Ожидаемый результат: compose-файл содержит оба сервиса.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-002

- Утверждение: `watch-changes.sh` выполняет `git fetch`, сравнивает
  `HEAD` и `REMOTE/BRANCH`, при необходимости запускает раскатку.
- Проверка:
  1. Проверить шаги в `$INFRA_ROOT/runtime/watch-changes.sh`.
  2. Запустить сценарий "без изменений" и "с изменениями".
- Ожидаемый результат:
  - при совпадении commit фиксируется `no changes`;
  - при расхождении запускается `deploy.sh`.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-003

- Утверждение: при грязном worktree watcher делает
  `git stash push --include-untracked` и пишет stash-id в deploy log.
- Проверка:
  1. Смоделировать локальные изменения перед запуском watcher.
  2. Проверить появление stash и запись в
     `/var/log/autoteka-deploy.log`.
- Ожидаемый результат:
  - stash создаётся;
  - в deploy log есть статус `git stash` и идентификатор stash.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-004

- Утверждение: `deploy.sh` работает с текущим `HEAD` без повторного
  `git fetch` и `git reset`.
- Проверка:
  1. Проанализировать `$INFRA_ROOT/runtime/deploy.sh`.
  2. Проверить отсутствие `git fetch` и `git reset` в скрипте.
- Ожидаемый результат: `deploy.sh` не делает повторную
  git-синхронизацию.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-005

- Утверждение: `deploy.sh` поднимает `php`, ждёт его готовности,
  выполняет `composer install`, `artisan`, `migrate`, `seed`,
  smoke-check `/admin/login`, затем запускает/перезапускает `web`.
- Проверка:
  1. Проверить последовательность шагов в `$INFRA_ROOT/runtime/deploy.sh`.
  2. Выполнить dry-run интеграционный прогон deploy.
- Ожидаемый результат: шаги выполняются в описанном порядке.
- Тип: automated
- Каталог тестов: `infrastructure/tests` + `system-tests`

### TC-DEPLOY-006

- Утверждение: если `frontend/.env` отсутствует, web-build создаёт его
  из `frontend/example.env`.
- Проверка:
  1. Удалить `frontend/.env` в тестовом окружении.
  2. Выполнить build web-контейнера.
  3. Проверить создание `frontend/.env`.
- Ожидаемый результат: `frontend/.env` создаётся автоматически.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-007

- Утверждение: `AUTOTEKA_ROOT`, `BRANCH`, `REMOTE`, `HTTP_PORT`,
  `PHP_READY_TIMEOUT`, `ADMIN_SMOKE_URL` задаются через
  `/etc/autoteka/options.env`.
- Проверка:
  1. Проверить чтение переменных в deploy wrapper/скриптах.
  2. Проверить реакцию системы на изменение значений.
- Ожидаемый результат: переменные подхватываются и влияют на поведение
  деплоя.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-008

- Утверждение: wrapper `/usr/local/bin/autoteka` используется systemd
  unit'ами вместо захардкоженного пути к репозиторию.
- Проверка:
  1. Проверить unit-файлы в `$INFRA_ROOT/runtime/systemd/`,
     `$INFRA_ROOT/observability/infrastructure/systemd/` и
     `$INFRA_ROOT/maintenance/systemd/`.
  2. Убедиться, что они вызывают `/usr/local/bin/autoteka`.
- Ожидаемый результат: unit'ы используют wrapper.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-009

- Утверждение: `install.sh` устанавливает пакеты, Docker, unit'ы,
  timer'ы, logrotate и готовит `/etc/autoteka/*.env`.
- Проверка:
  1. Проверить шаги в `$INFRA_ROOT/bootstrap/install.sh`.
  2. Выполнить установку в чистом стенде.
  3. Проверить наличие заявленных артефактов.
- Ожидаемый результат: после install присутствуют пакеты,
  unit'ы/timer'ы, env и logrotate.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-010

- Утверждение: после bootstrap проверка состояния включает
  `autoteka.service`, `watch-changes.timer`, `server-watchdog.timer`,
  `server-maintenance.timer` и compose `ps`.
- Проверка: выполнить команды статуса из документа и валидировать
  output.
- Ожидаемый результат: все сервисы и timer'ы активны, compose-контур в
  рабочем состоянии.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-011

- Утверждение: правило проверки миграций — цепочка
  `migrate -> rollback -> migrate`.
- Проверка:
  1. Выполнить цепочку в backend-контейнере.
  2. Проверить, что все команды завершаются успешно.
- Ожидаемый результат: миграции проходят полный цикл без ошибок.
- Тип: automated
- Каталог тестов: `backend/tests` + `infrastructure/tests`

### TC-DEPLOY-012

- Утверждение: для production same-origin используется
  `VITE_API_BASE_URL=/api/v1`.
- Проверка:
  1. Проверить значение в production env-конфиге frontend.
  2. Проверить успешные запросы frontend к `/api/v1/*`.
- Ожидаемый результат: frontend работает через same-origin API-префикс
  `/api/v1`.
- Тип: automated
- Каталог тестов: `system-tests`

### TC-DEPLOY-013

- Утверждение: writable runtime paths Laravel: `backend/database`,
  `backend/storage`, `backend/bootstrap/cache`.
- Проверка:
  1. Проверить права на host и внутри контейнера `php`.
  2. Запустить проверку записи SQLite/session/cache.
- Ожидаемый результат: каталоги доступны для записи Laravel runtime.
- Тип: automated
- Каталог тестов: `infrastructure/tests` + `backend/tests`

### TC-DEPLOY-014

- Утверждение: `/metrics/data.json` формируется из
  `/var/log/server-metrics.log` и содержит `timestamp`, `load`, `ram`,
  `health`.
- Проверка:
  1. Запустить `server-watchdog.sh` + `metrics-export.sh`.
  2. Проверить файл
     `$INFRA_ROOT/observability/application/metrics/data.json`.
  3. Проверить доступность `GET /metrics/data.json`.
- Ожидаемый результат: JSON обновляется и содержит обязательные поля.
- Тип: automated
- Каталог тестов: `infrastructure/tests` + `system-tests`

### TC-DEPLOY-015

- Утверждение: public media `/storage/*` должны отдаваться как
  статика, а не через SPA fallback.
- Проверка:
  1. Запросить существующий файл `/storage/...`.
  2. Проверить `content-type` и тело ответа.
  3. Убедиться, что не возвращается `index.html`.
- Ожидаемый результат: `/storage/*` отдаётся как статический контент.
- Тип: automated
- Каталог тестов: `system-tests`

### TC-DEPLOY-016

- Утверждение: Telegram lock-механизм использует каталог
  `${TMPDIR:-/tmp}/autoteka-telegram-locks`; повторные error по одному
  code блокируются до очистки lock.
- Проверка:
  1. Смоделировать повторяющуюся ошибку с одинаковым code.
  2. Проверить создание lock-файла через `touch`.
  3. Проверить, что второе сообщение не отправляется.
- Ожидаемый результат: антиспам работает согласно описанию.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-017

- Утверждение: success deploy (`DEPLOY_SUCCESS`) отправляет сообщение
  с hash и `subject` раскатанного commit.
- Проверка:
  1. Выполнить успешный deploy.
  2. Проверить payload сообщения и записи в telegram log.
- Ожидаемый результат: success-уведомление содержит hash и `subject`.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-018

- Утверждение: для ключевых кодов ошибок rollout/watchdog/maintenance
  предусмотрены диагностические ветки.
- Проверка:
  1. Сопоставить перечень кодов в документации и в скриптах.
  2. Для выборки кодов смоделировать ошибочные сценарии.
- Ожидаемый результат: коды из документа реально используются и
  логируются.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-019

- Утверждение: `server-maintenance.sh` выполняет: `apt clean`,
  `journal vacuum`, docker prune, cleanup `/tmp`, фиксацию прав
  `/var/lib/logrotate/status`.
- Проверка:
  1. Проверить команды в `$INFRA_ROOT/maintenance/server-maintenance.sh`.
  2. Выполнить скрипт и проверить следы выполнения в логах.
- Ожидаемый результат: maintenance-шаги выполняются в заявленном
  составе.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-020

- Утверждение: `autoteka deploy` раскатывает текущий `HEAD` без
  `git fetch` и `git reset`, а `autoteka watch-changes` проверяет
  remote и подтягивает новые commit.
- Проверка:
  1. Выполнить оба сценария на тестовом стенде.
  2. Проверить git-состояние и deploy log.
- Ожидаемый результат: поведение `deploy` и `watch-changes`
  соответствует описанию.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

### TC-DEPLOY-021

- Утверждение: команда импорта `php artisan autoteka:data:import`
  поддерживает scope `city|category|feature|shop`, режимы
  `dry-run|refresh|append`, транзакционность и обязательный
  `--generated-root` для `shop`.
- Проверка:
  1. Проверить сигнатуру команды и валидации.
  2. Выполнить прогоны для всех scope и режимов.
  3. Проверить rollback для `dry-run` и очистку+запись для `refresh`.
- Ожидаемый результат: команда работает по заявленным правилам.
- Тип: automated
- Каталог тестов: `backend/tests` + `infrastructure/tests`

### TC-DEPLOY-022

- Утверждение: `uninstall.sh` поддерживает режимы `soft`, `purge`,
  `nuke` и флаги `--force`, `--rm-etc`, `--rm-root` с указанными
  границами безопасности.
- Проверка:
  1. Проверить парсинг аргументов и ветки режима в
     `$INFRA_ROOT/bootstrap/uninstall.sh`.
  2. На стенде проверить side effects для каждого режима.
- Ожидаемый результат: режимы и флаги соответствуют документированной
  логике удаления.
- Тип: automated
- Каталог тестов: `infrastructure/tests`

## Условно проверяемые утверждения

- Дата актуализации (`2026-03-07`) не проверяется runtime-тестом.
- Для неё нужен process-check: соответствие дате последней ревизии и
  артефактам Э3/Э4.

### TC-DEPLOY-023

- Утверждение: общие helper'ы deploy-контура разделены на предметные
  библиотеки `$INFRA_ROOT/lib/*.sh`, монолитный `$INFRA_ROOT/lib/_common.sh`
  удалён, а скрипты подключают только нужные зависимости.
- Проверка:
  1. Проверить наличие `bootstrap.sh`, `laravel-runtime.sh`,
     `dry-run.sh`, `telegram.sh`, `health-state.sh`.
  2. Убедиться, что `_common.sh` отсутствует.
  3. Проверить `source`-подключения в deploy-скриптах.
- Ожидаемый результат: deploy-скрипты используют точечные библиотеки,
  монолитный helper не используется.
- Тип: automated
- Каталог тестов: `infrastructure/tests`
