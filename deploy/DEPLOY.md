# Deploy и эксплуатация

**Дата актуализации: 2026-03-09.**

Документ описывает business-процессы deploy-контура и служебные
скрипты: install, deploy, backup, restore, uninstall, watchdog,
maintenance и связанные процедуры эксплуатации.

## 0. Границы документа

- `deploy/DEPLOY.md` описывает **deploy-процессы и deploy-скрипты**:
  install, rollout, backup, restore, uninstall и связанные серверные
  процедуры.
- `docs/foundations/IMPLEMENTATION.md` описывает **архитектуру и код**
  системы для разработчиков.
- `docs/manual/ADMIN_MANUAL.md` описывает **как с этим работать**: как
  запускать контуры, как чинить, как обслуживать и как диагностировать
  систему.

Рабочие команды администратора вынесены в `ADMIN_MANUAL.md`, чтобы они
не смешивались с описанием deploy-процессов.

## 1. Целевая схема

Deployment-контур ориентирован на Debian/Ubuntu и использует:

- `docker compose`;
- `nginx` в контейнере `web`;
- Laravel backend в контейнере `php`;
- `systemd` для автодеплоя, watchdog и maintenance.

### 1.1. Модульная схема системы (для deploy/ops)

Система разделена на 3 backend-модуля:

- `backend/apps/ShopAPI` — API-модуль;
- `backend/apps/ShopOperator` — back office (MoonShine);
- `backend/packages/SchemaDefinition` — общий schema/package модуль.

Для эксплуатации это означает:

- deploy поднимает общий runtime (`php` + `web`), внутри которого
  работают оба Laravel-приложения;
- `composer install` выполняется для `apps/ShopAPI` и
  `apps/ShopOperator`;
- `SchemaDefinition` подключается как path-package и используется
  обоими приложениями;
- миграции и seed выполняются из `apps/ShopOperator`.

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
   `/var/log/autoteka-deploy.log`, чтобы пользователь мог восстановить
   изменения вручную;
7. выполняет `git reset --hard $REMOTE/$BRANCH`;
8. запускает `deploy.sh` отдельным новым процессом;
9. `deploy.sh` раскатывает уже текущий `HEAD` без повторного
   `git fetch` и `git reset`;
10. `deploy.sh` поднимает только контейнер `php`;
11. ждёт готовности контейнера к `docker compose exec` с timeout;
12. если `frontend/.env` отсутствует, сборка web-контейнера создаёт
    его из `frontend/example.env`;
13. на host приводит runtime-каталоги Laravel к состоянию, пригодному
    для записи от пользователя php-fpm внутри контейнера;
14. внутри `php` создаёт `.env`, если его нет;
15. внутри `php` выполняет `composer install` для модулей `apps/ShopAPI` и
    `apps/ShopOperator`, если для модуля есть `composer.json`;
    локальный пакет `backend/packages/SchemaDefinition` в этом шаге не
    обрабатывается напрямую, потому что это path-пакет и его
    зависимости подтягиваются при установке зависимостей `API` /
    `DatabaseOperator`.
16. проверяет запуск `artisan`;
17. включает Laravel maintenance mode;
18. создаёт `APP_KEY` через `ensure_app_key`, если ключа ещё нет, и
    синхронизирует его в `backend/.env`, `apps/ShopAPI/.env`,
    `apps/ShopOperator/.env`;
19. выполняет `php artisan migrate --force` из
    `apps/ShopOperator`;
20. выполняет `php artisan db:seed --class=AdminUserSeeder --force`;
21. проверяет запись Laravel в SQLite/session/cache;
22. снимает maintenance mode;
23. поднимает или перезапускает контейнер `web`;
24. пишет в deploy log статус Telegram-конфига;
25. выполняет HTTP smoke-check `GET /admin/login`;
26. отправляет success-уведомление в Telegram с hash и `subject`
    последнего раскатанного commit.

## 2. Базовые принципы

- путь к репозиторию задаётся через `AUTOTEKA_ROOT`;
- `AUTOTEKA_ROOT` хранится в `/etc/autoteka/deploy.env`;
- systemd unit'ы используют wrapper `/usr/local/bin/autoteka`, а не
  жёстко прошитый путь в репозиторий;
- автодеплой выполняется через `watch-changes.sh` и git polling timer.
- `backend` смонтирован в контейнер `php` как bind mount, поэтому
  права runtime-каталогов Laravel нужно обеспечивать на этапе запуска,
  а не через `Dockerfile`.

### 2.1. Структура deploy/ по областям ответственности

- `deploy/bootstrap/` — bootstrap/uninstall, host-level конфиги,
  env-шаблоны и wrapper;
- `deploy/runtime/` — rollout, watch-changes, production/dev compose,
  Dockerfile и runtime systemd unit/timer;
- `deploy/repair/` — сценарии починки контейнеров и health;
- `deploy/maintenance/` — backup/restore, периодическое обслуживание,
  logrotate и maintenance timer;
- `deploy/observability/infrastructure/` — watchdog и его unit/timer;
- `deploy/observability/application/` — экспорт `/metrics` и
  статические артефакты метрик;
- `deploy/lib/` — разделённые shell-библиотеки по областям
  ответственности (`bootstrap.sh`, `laravel-runtime.sh`, `dry-run.sh`,
  `telegram.sh`, `health-state.sh`).

### 2.2. Разделение shell-библиотек в `deploy/lib/`

`deploy/lib/` разделён по независимым зонам ответственности:

- `bootstrap.sh` — загрузка `AUTOTEKA_ROOT` и базового deploy env;
- `laravel-runtime.sh` — `docker compose`, подготовка Laravel runtime,
  smoke-check'и и artisan helper'ы;
- `dry-run.sh` — dry-run режим и безопасные shell/file helper'ы;
- `telegram.sh` — загрузка Telegram env, отправка уведомлений и dedup
  lock'и;
- `health-state.sh` — файловое состояние watchdog-инцидентов и сброс
  доменов health.

Скрипты должны подключать только те библиотеки, функции которых им
реально нужны. Монолитный `_common.sh` не используется.

## 3. Что делает install.sh

`deploy/bootstrap/install.sh`:

- ставит базовые пакеты `curl`, `git`, `wget`, `bc`, `logrotate`,
  `fail2ban`;
- устанавливает Docker, если он ещё не установлен;
- включает `docker`;
- создаёт `deploy/observability/application/metrics/data.json`;
- применяет настройки docker logging, journald и fail2ban;
- готовит `/etc/autoteka/deploy.env`;
- опционально создаёт `/etc/autoteka/telegram.env`;
- устанавливает `/usr/local/bin/autoteka`;
- устанавливает и включает systemd unit'ы и timers;
- устанавливает logrotate-конфиги.

### 3.1. Устанавливаемые конфиги

`install.sh` устанавливает следующие конфиги из репозитория:

**`deploy/bootstrap/config/docker-daemon.json` →
`/etc/docker/daemon.json`**

Конфигурация логирования Docker:

- `log-driver: "json-file"` — формат логов Docker. `json-file`
  сохраняет логи в JSON-формате на диске, что позволяет их читать
  через `docker logs` и ротировать через logrotate. Альтернативы
  (`syslog`, `journald`) не дают такой гибкости для ротации.
- `log-opts.max-size: "10m"` — максимальный размер одного лог-файла
  контейнера. При превышении создаётся новый файл. Ограничивает рост
  логов одного контейнера, предотвращает заполнение диска. При частых
  ошибках логи могут ротироваться быстрее, теряя историю.
- `log-opts.max-file: "3"` — максимальное количество архивных
  лог-файлов на контейнер. При превышении старые файлы удаляются.
  Вместе с `max-size` даёт максимум ~30MB логов на контейнер. При
  проблемах с диагностикой может быть недостаточно истории.

**`deploy/bootstrap/config/journald-limits.conf` →
`/etc/systemd/journald.conf.d/limits.conf`**

Лимиты для systemd journald:

- `SystemMaxUse=200M` — максимальный размер всех логов journald в
  системе. При превышении старые записи удаляются. Ограничивает
  использование диска системными логами. При переполнении теряется
  история системных событий.
- `RuntimeMaxUse=200M` — максимальный размер логов в runtime (не
  перезагружается). Аналогично `SystemMaxUse`, но для сессии. При
  переполнении теряются логи текущей сессии.
- `SystemMaxFileSize=50M` — максимальный размер одного файла журнала.
  При превышении создаётся новый файл. Влияет на фрагментацию логов и
  производительность чтения.
- `RuntimeMaxFileSize=50M` — аналогично `SystemMaxFileSize`, но для
  runtime. Влияет на структуру логов в текущей сессии.
- `MaxRetentionSec=7day` — максимальное время хранения логов. Старые
  записи удаляются независимо от размера. Гарантирует, что логи не
  растут бесконечно. При проблемах, обнаруженных позже, история может
  быть потеряна.

**`deploy/bootstrap/config/fail2ban-jail.local` →
`/etc/fail2ban/jail.d/sshd.local`**

Jail для защиты SSH от brute-force:

- `[sshd]` — секция для защиты SSH. Без этой секции fail2ban не будет
  блокировать атаки на SSH.
- `enabled = true` — включает защиту SSH. `false` отключит блокировку,
  система будет уязвима к brute-force.
- `port = ssh` — порт для мониторинга. `ssh` резолвится в стандартный
  порт (обычно 22). При нестандартном порте SSH нужно указать номер.
  Неправильный порт — fail2ban не увидит атаки.
- `logpath = %(sshd_log)s` — путь к логу SSH. fail2ban читает этот
  файл для обнаружения неудачных попыток. Неправильный путь — fail2ban
  не увидит атаки.
- `maxretry = 6` — количество неудачных попыток до блокировки. Баланс
  между безопасностью и удобством. Слишком мало — блокировка
  легитимных пользователей, слишком много — уязвимость.
- `bantime = 1h` — время блокировки IP. После блокировки IP не сможет
  подключиться час. Слишком мало — атака продолжится, слишком много —
  неудобство при ложных срабатываниях.
- `findtime = 10m` — окно времени для подсчёта попыток. `maxretry`
  попыток должны произойти за `findtime`. Вместе с `maxretry`
  определяет агрессивность защиты. Слишком большое окно — меньше
  защита, слишком маленькое — больше ложных срабатываний.

**`deploy/bootstrap/systemd/docker.override.conf` →
`/etc/systemd/system/docker.service.d/override.conf`**

Override для docker.service:

- `StartLimitIntervalSec=0` — отключает лимит перезапусков Docker.
  Docker может перезапускаться неограниченно. Без этого при проблемах
  systemd может перестать перезапускать Docker, что критично для
  работы системы.
- `Restart=always` — всегда перезапускать Docker при падении. Критично
  для отказоустойчивости. Без этого при падении Docker система
  останется без контейнеров.
- `RestartSec=5` — задержка перед перезапуском. Даёт время системе
  стабилизироваться. Слишком мало — частые перезапуски, слишком много
  — долгий downtime.

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
chmod +x ./deploy/bootstrap/install.sh
sudo ./deploy/bootstrap/install.sh
```

### 4.4. Выполнить первую раскатку

```bash
autoteka deploy
```

### 4.5. Проверить состояние

```bash
systemctl status autoteka.service
systemctl status watch-changes.timer
systemctl status server-watchdog.timer
systemctl status server-maintenance.timer
docker compose -f deploy/runtime/docker-compose.yml ps
```

### 4.6. Правило проверки миграций

Любая новая или изменённая миграция должна быть проверена цепочкой:

```bash
php artisan migrate
php artisan migrate:rollback
php artisan migrate
```

Если все три команды проходят без ошибок, миграция считается
корректной.

### 4.7. Проверка real-db API после install и restore

Если установка включала восстановление БД из backup
(`autoteka restore ...`), после install/restore обязательно запускайте
полный прогон тестов всех контуров.

Последовательно:

```bash
cd "$AUTOTEKA_ROOT/system-tests"
npm test
cd ../deploy/tests
npm test
cd ../../frontend
npm test
npm run test:ui:mock
npm run test:api:online
npm run test:e2e
cd ../backend
php artisan test
php artisan test --configuration=phpunit.realdb.xml
```

Параллельно:

```bash
npx concurrently -k --names "system,deploy,frontend-offline-ui,frontend-api-online,frontend-e2e-online,backend,backend-realdb" \
"cd system-tests && npm test" \
"cd deploy/tests && npm test" \
"cd frontend && npm run test && npm run test:ui:mock" \
"cd frontend && npm run test:api:online" \
"cd frontend && npm run test:e2e" \
"cd backend && php artisan test" \
"cd backend && php artisan test --configuration=phpunit.realdb.xml"
```

Явные профили из корня монорепозитория:

```bash
npm run test:profile:offline
npm run test:profile:installation-e2e
```

Где:

- `test:profile:offline` — offline-проверки frontend/backend без
  требования online backend для UI (используются UI mock-тесты).
- `test:profile:installation-e2e` — проверка конкретной инсталляции с
  online API и online e2e интеграцией frontend+backend.

Переменные окружения для online-части проверок:

```bash
# frontend API integration tests
cd frontend && API_BASE_URL=http://127.0.0.1/api/v1 npm run test:api:online

# frontend online e2e
cd frontend && PLAYWRIGHT_BASE_URL=http://127.0.0.1 npm run test:e2e
```

Через Docker (если backend тесты запускаются в контейнере):

```bash
docker exec -w /var/www/backend autoteka-php php artisan test
docker exec -w /var/www/backend autoteka-php php artisan test --configuration=phpunit.realdb.xml
wait
```

Запуск real-db через стандартный `phpunit.xml` недопустим: он
использует `DB_DATABASE=:memory:` и не проверяет рабочую БД.

## 5. Настройки окружения

### 5.0. frontend/.env

Frontend build читает `frontend/.env`.

Если `frontend/.env` отсутствует, Docker build для web-контейнера
создаёт его из `frontend/example.env`.

Для production same-origin схемы используйте:

```text
VITE_API_BASE_URL=/api/v1
```

### 5.1. /etc/autoteka/deploy.env

Основные переменные:

- `AUTOTEKA_ROOT` — путь к репозиторию;
- `BRANCH` — ветка для автодеплоя, по умолчанию `master`;
- `REMOTE` — git remote, по умолчанию `origin`;
- `HTTP_PORT` — внешний порт nginx;
- `PHP_READY_TIMEOUT` — timeout ожидания готовности контейнера `php`;
- `PHP_HC_INTERVAL` — интервал `php` docker healthcheck (по умолчанию
  `30s`);
- `PHP_HC_TIMEOUT` — timeout одного `php` healthcheck-запроса (по
  умолчанию `5s`);
- `PHP_HC_RETRIES` — число попыток `php` healthcheck (по умолчанию
  `3`);
- `PHP_HC_START_PERIOD` — grace-период до начала строгой оценки `php`
  healthcheck (по умолчанию `450s`);
- `ADMIN_SMOKE_URL` — URL для post-deploy smoke-check, по умолчанию
  `http://127.0.0.1/admin/login`.
- `STORAGE_BACKUP_DIR` — каталог хранения daily storage backup-архивов
  (по умолчанию `/root/autoteka-storage-backups`).
- `STORAGE_BACKUP_RETENTION_DAYS` — срок хранения storage
  backup-архивов в днях (по умолчанию `7`).

После правки:

```bash
systemctl daemon-reload
systemctl restart watch-changes.timer
systemctl start watch-changes.service
```

### 5.2. /etc/autoteka/telegram.env

Опциональный файл для уведомлений deploy/watchdog/maintenance:

- `TELEGRAM_TOKEN`
- `TELEGRAM_CHAT`

### 5.3. backend/.env

Корневой `backend/.env` используется как базовый runtime-конфиг.

Отдельные env-файлы приложений создаются в `apps/ShopAPI/.env` и
`apps/ShopOperator/.env`:

1. при первом запуске из `backend/example.env`;
2. при первом запуске каждого приложения из `apps/*/example.env`, если
   файл отсутствует;
3. после этого в runtime синхронизируются значения из `backend/.env` и
   создаётся единый `APP_KEY` для всех трех `.env`.

Правило по `APP_KEY`:

- в `deploy/runtime/docker-compose.dev.yml` переменная `APP_KEY` не
  должна прокидываться через `environment`, чтобы в dev-runtime ключ
  всегда читался из `backend/.env`;
- в production ключ должен приходить из внешнего защищённого источника
  (`/etc/autoteka/deploy.env` или secret-механизм), а не из значения
  по умолчанию в compose.

### 5.4. Writable runtime paths Laravel

При использовании bind mount для `backend` права нужно выставлять на
host, не только в контейнере.

Laravel должен иметь возможность писать как минимум в:

- `backend/database`
- `backend/storage`
- `backend/bootstrap/cache`

Для SQLite важно, чтобы writable был не только файл
`backend/database/database.sqlite`, но и сам каталог
`backend/database`, потому что движок создаёт рядом служебные файлы
`*.sqlite-wal` и `*.sqlite-shm`.

### 5.5. deploy/bootstrap/config/deploy.example.env

Шаблон для `/etc/autoteka/deploy.env`. Устанавливается `install.sh`
при первом запуске, если файл `/etc/autoteka/deploy.env` отсутствует.

Основные параметры:

- `AUTOTEKA_ROOT=/opt/vue-app` — путь к репозиторию на сервере.
  Используется всеми systemd units через wrapper
  `/usr/local/bin/autoteka`. Неправильный путь приведёт к ошибкам всех
  deploy-операций. Должен совпадать с реальным путём клонирования.
- `BRANCH=master` — ветка для автодеплоя. `watch-changes.sh` проверяет
  изменения в этой ветке. Изменение требует обновления на сервере и
  перезапуска timer. Неправильная ветка — отсутствие автодеплоя.
- `REMOTE=origin` — git remote для проверки изменений.
  `watch-changes.sh` делает `git fetch $REMOTE`. Неправильное имя или
  отсутствие remote приведёт к ошибкам автодеплоя.
- `HTTP_PORT=80` — порт для nginx. Должен совпадать с `listen` в
  `nginx.conf` и `ports` в `docker-compose.yml`. Изменение требует
  обновления всех трёх мест. Конфликт портов приведёт к ошибке запуска
  контейнера.

### 5.6. deploy/config/telegram.env.example

Шаблон для `/etc/autoteka/telegram.env`. Устанавливается `install.sh`
опционально, если файл `/etc/autoteka/telegram.env` отсутствует.

Параметры:

- `TELEGRAM_TOKEN=` — токен бота для отправки уведомлений. Без токена
  уведомления не отправляются, но система работает. Используется
  deploy/watchdog/maintenance скриптами. Неправильный токен — ошибки в
  логах, но не критично для работы.
- `TELEGRAM_CHAT=` — ID чата для уведомлений. Без ID уведомления не
  доходят. Используется вместе с токеном. Неправильный ID —
  уведомления теряются.

### 5.7. Logrotate конфиги

`install.sh` устанавливает четыре logrotate-конфига:

**`deploy/maintenance/config/logrotate-server-watchdog.conf`**

Ротация логов watchdog и maintenance:

- Файлы: `/var/log/server-watchdog.log`,
  `/var/log/server-metrics.log`, `/var/log/server-maintenance.log`
- `weekly` — ротация раз в неделю. Баланс между сохранением истории и
  использованием диска. При частых проблемах может быть недостаточно
  истории.
- `rotate 4` — хранить 4 архивных файла. Вместе с `weekly` даёт ~4
  недели истории. При редких проблемах достаточно, при частых — может
  быть мало.
- `compress` — сжатие старых логов. Экономит место на диске.
  Увеличивает время доступа к архивам.
- `delaycompress` — сжатие на один цикл позже. Последний архив
  остаётся несжатым для быстрого доступа. Удобно для `tail` и `grep`.
- `missingok` — не ошибка, если файл отсутствует. Позволяет logrotate
  работать до первого запуска сервисов. Без этого ошибки при первом
  запуске.
- `notifempty` — не ротировать пустые файлы. Экономит место, избегая
  пустых архивов. Не влияет на работу, только на чистоту логов.

**`deploy/maintenance/config/logrotate-autoteka-telegram.conf`**

Ротация логов Telegram-бота:

- Файл: `/var/log/autoteka-telegram.log`
- `size 100k` — ротация при достижении 100KB. Telegram-логи обычно
  небольшие, поэтому размер важнее времени. При частых уведомлениях
  ротация будет чаще.
- `rotate 4` — хранить 4 архива. Вместе с `size 100k` даёт ~400KB
  максимум. Для Telegram-логов обычно достаточно.
- `compress`, `delaycompress`, `missingok`, `notifempty` — аналогично
  watchdog.

**`deploy/maintenance/config/logrotate-vue-app-deploy.conf`**

Ротация логов deploy:

- Файл: `/var/log/autoteka-deploy.log`
- `weekly` — ротация раз в неделю. Deploy-логи растут с каждым deploy.
  При частых deploy может быть недостаточно.
- `rotate 8` — хранить 8 архивов. Вместе с `weekly` даёт ~8 недель
  истории. Больше, чем для watchdog, т.к. deploy-логи важнее для
  диагностики проблем развёртывания.
- `compress` — сжатие старых логов. Deploy-логи могут быть большими,
  сжатие экономит место.
- `missingok`, `notifempty` — аналогично watchdog.

**`deploy/maintenance/config/logrotate-autoteka-backend.conf`**

Ротация backend-логов Laravel:

- Backend в этом проекте включает 3 модуля, но runtime-логи Laravel
  пишутся в 2 приложения: `apps/ShopAPI` и `apps/ShopOperator` (модуль
  `packages/SchemaDefinition` общий библиотечный).
- Файлы:
  - `/var/www/backend/apps/ShopAPI/storage/logs/laravel.log`
  - `/var/www/backend/apps/ShopOperator/storage/logs/laravel.log`
- `daily` — ротация раз в день. Laravel-логи растут быстрее служебных,
  поэтому дневной цикл безопаснее для диска.
- `rotate 14` — хранить 14 архивов (около двух недель истории).
- `compress`, `delaycompress`, `missingok`, `notifempty` — аналогично
  watchdog.
- `copytruncate` — безопасная ротация без перезапуска PHP-процесса:
  файл копируется и обнуляется на месте, чтобы текущий file handle
  продолжал писать.

## 6. Наблюдаемость

### 6.1. systemd

Проверка состояния:

```bash
systemctl status autoteka.service
systemctl status watch-changes.service
systemctl status watch-changes.timer
systemctl status server-watchdog.service
systemctl status server-watchdog.timer
systemctl status server-maintenance.service
systemctl status server-maintenance.timer
```

Файлы systemd units и timers находятся в репозитории в
`deploy/runtime/systemd/`,
`deploy/observability/infrastructure/systemd/` и
`deploy/maintenance/systemd/`; `install.sh` собирает их и
устанавливает в systemd:

**`deploy/runtime/systemd/autoteka.service`**

Основной systemd unit для запуска контейнеров:

- `Type=oneshot` — сервис выполняет команду и завершается. Не держит
  процесс постоянно. Подходит для `docker compose up -d`, который
  запускает контейнеры и завершается.
- `ExecStart=/usr/local/bin/autoteka up` — запускает контейнеры через
  wrapper. Wrapper использует `AUTOTEKA_ROOT` из env. Неправильный
  путь или отсутствие wrapper — ошибка запуска.
- `ExecStop=/usr/local/bin/autoteka down` — останавливает контейнеры
  при остановке сервиса. Важно для корректного shutdown. Без этого
  контейнеры останутся запущенными при остановке сервиса.
- `RemainAfterExit=yes` — сервис считается активным после завершения
  команды. Позволяет `systemctl status` показывать состояние. Без
  этого сервис сразу станет inactive.
- `TimeoutStartSec=0` — отключает timeout для запуска.
  `docker compose up` может занимать время на сборку. Без этого
  systemd может убить процесс до завершения сборки.

**`deploy/runtime/systemd/watch-changes.service`**

Unit для автодеплоя:

- `Type=oneshot` — выполняет команду и завершается. `watch-changes.sh`
  делает свою работу и завершается.
- `ExecStart=/usr/local/bin/autoteka watch-changes` — запускает git
  polling и deploy. Критично для автодеплоя. Ошибка в команде —
  отсутствие автодеплоя.
- `EnvironmentFile=-/etc/autoteka/deploy.env` — загружает переменные
  (`AUTOTEKA_ROOT`, `BRANCH`, `REMOTE`). `-` означает, что отсутствие
  файла не ошибка. Без переменных команды не смогут найти репозиторий.
- `EnvironmentFile=-/etc/autoteka/telegram.env` — опциональные
  переменные для Telegram. Без файла уведомления не отправляются, но
  deploy работает.

**`deploy/runtime/systemd/watch-changes.timer`**

Timer для автодеплоя:

- `OnBootSec=2min` — запуск через 2 минуты после загрузки. Даёт время
  системе инициализироваться. Слишком рано — ошибки из-за
  недоступности Docker/git, слишком поздно — задержка первого deploy.
- `OnUnitActiveSec=5min` — интервал между запусками — 5 минут. Баланс
  между оперативностью и нагрузкой. Слишком часто — нагрузка на
  git/Docker, слишком редко — задержка deploy.
- `RandomizedDelaySec=20` — случайная задержка до 20 секунд.
  Распределяет нагрузку при множестве серверов. Не критично для одного
  сервера, но полезно для инфраструктуры.
- `Persistent=true` — запускать пропущенные запуски после
  перезагрузки. Если сервер был выключен, timer запустит пропущенные
  deploy после включения. Без этого deploy может быть пропущен.
- `Unit=watch-changes.service` — какой сервис запускать. Должен
  совпадать с именем `.service` файла. Неправильное имя — timer не
  запустит deploy.

**`deploy/observability/infrastructure/systemd/server-watchdog.service`**

Unit для watchdog:

- `Type=oneshot` — выполняет проверки и завершается.
  `server-watchdog.sh` делает проверки и завершается.
- `ExecStart=/usr/local/bin/autoteka watchdog` — запускает
  watchdog-проверки. Критично для self-healing. Без этого система не
  будет автоматически восстанавливаться при проблемах.
- `Wants=docker.service` — зависимость от Docker. Watchdog запустится
  только после Docker. Без Docker watchdog не сможет проверить
  контейнеры.

**`deploy/observability/infrastructure/systemd/server-watchdog.timer`**

Timer для watchdog:

- `OnBootSec=2min` — даёт время системе инициализироваться. Важно для
  раннего обнаружения проблем после перезагрузки.
- `OnUnitActiveSec=2min` — интервал 2 минуты для watchdog. Чаще, чем
  deploy, т.к. проверки быстрее и важнее для оперативного
  реагирования. Слишком редко — долгий downtime при проблемах.
- `Persistent=true` — запускать пропущенные проверки после
  перезагрузки.

**`deploy/maintenance/systemd/server-maintenance.service`**

Unit для maintenance:

- `Type=oneshot` — выполняет очистку и завершается.
  `server-maintenance.sh` делает очистку и завершается.
- `ExecStart=/usr/local/bin/autoteka maintenance` — запускает
  maintenance-операции. Важно для предотвращения заполнения диска. Без
  этого диск может заполниться логами/Docker образами.
- `After=network.target` — запуск после инициализации сети. Нужно для
  доступа к Docker registry при очистке образов. Без этого могут быть
  ошибки при очистке.

**`deploy/maintenance/systemd/server-maintenance.timer`**

Timer для maintenance:

- `OnBootSec=10min` — запуск через 10 минут после загрузки. Позже, чем
  deploy/watchdog, т.к. maintenance менее критично. Даёт время системе
  стабилизироваться.
- `OnCalendar=*-*-* 03:15:00` — ежедневный запуск в 03:15. Низкая
  нагрузка в это время. Регулярная очистка предотвращает накопление
  мусора.
- `Persistent=true` — запускать пропущенные maintenance после
  перезагрузки. Важно для регулярной очистки.

### 6.2. Docker

```bash
docker compose -f deploy/runtime/docker-compose.yml ps
docker compose -f deploy/runtime/docker-compose.yml logs -f web
docker compose -f deploy/runtime/docker-compose.yml logs -f php
```

### 6.3. Логи

Основные логи:

- `/var/log/autoteka-deploy.log`
- `/var/log/server-watchdog.log`
- `/var/log/server-metrics.log`
- `/var/log/server-maintenance.log`
- `/var/log/autoteka-telegram.log`

Через journal:

```bash
journalctl -u autoteka.service -n 100 --no-pager
journalctl -u watch-changes.service -n 100 --no-pager
journalctl -u server-watchdog.service -n 100 --no-pager
journalctl -u server-maintenance.service -n 100 --no-pager
```

### 6.4. /metrics

`server-watchdog.sh` пишет строки метрик в
`/var/log/server-metrics.log`, а `metrics-export.sh` преобразует
последние записи в JSON-файл:

- host path: `deploy/observability/application/metrics/data.json`
- web path: `http://<HOST>/metrics/data.json`

Содержимое метрик включает:

- timestamp;
- `load`;
- `ram`;
- `health`.

### 6.5. Public media `/storage/*`

Public media из Laravel disk `public` отдаются по URL `/storage/*`.

Deployment nginx должен раздавать эти файлы как статику из
`backend/public/storage`, а не отправлять их в SPA fallback.

Если вместо изображения браузер получает `200 text/html` с
`index.html`, это означает, что запрос до `/storage/*` был обработан
маршрутом SPA, а не статической раздачей.

### 6.6. Telegram-уведомления и антиспам

Эксплуатационные скрипты используют набор точечных библиотек из
`deploy/lib/*.sh`. Telegram-логика вынесена в `telegram.sh`, dry-run и
файловые операции — в `dry-run.sh`, состояние health-инцидентов — в
`health-state.sh`, bootstrap/env — в `bootstrap.sh`, Docker/Laravel
runtime — в `laravel-runtime.sh`.

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

1. `systemctl status autoteka.service`
2. `docker compose -f deploy/runtime/docker-compose.yml ps`
3. `docker compose -f deploy/runtime/docker-compose.yml logs -f web`
4. проброс `HTTP_PORT`

### 7.2. Backend/API не отвечает

Проверьте:

1. `docker compose -f deploy/runtime/docker-compose.yml logs -f php`
2. наличие и корректность `backend/.env`
3. доступность `/api/v1/*`
4. миграции и seed initial admin
5. права на `backend/storage`, `backend/bootstrap/cache`,
   `backend/database`, `backend/database/database.sqlite`

Production-контур использует same-origin запросы frontend ->
`/api/v1`, поэтому deploy nginx не должен требовать отдельного
CORS-слоя.

Laravel должен иметь возможность писать как минимум в:

- `storage/framework/cache`
- `storage/framework/sessions`
- `storage/framework/views`
- `storage/logs`
- `bootstrap/cache`
- `database`

Проверка:

```bash
docker compose -f deploy/runtime/docker-compose.yml exec php ls -ld \
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
docker compose -f deploy/runtime/docker-compose.yml exec php php artisan up
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

- выполнять docker liveness checks для `nginx` и `php`;
- выполнять software checks для `/up`, `/api/v1/category-list`,
  `/admin/login`;
- запускать bounded auto-remediation без бесконечного цикла
  перезапусков;
- сохранять per-domain state (`fail_count`, `phase`, `cooldown_until`,
  `repair_attempts`);
- перезапустить compose unit и выполнить reboot с cooldown для
  host-level аварий.

### 7.3.1. Матрица healthcheck

| Домен     | Что проверяется                                 | Чем лечится автоматически        | Команда для ручной работы         |
| --------- | ----------------------------------------------- | -------------------------------- | --------------------------------- |
| `nginx`   | docker health `web` → `GET /healthcheck`        | `autoteka repair-health nginx`   | `autoteka repair-health nginx`    |
| `php`     | docker health `php` → FPM `ping.path=/fpm-ping` | `autoteka repair-health php`     | `autoteka repair-health php`      |
| `backend` | `GET /up`                                       | `autoteka repair-health backend` | `autoteka repair-runtime`         |
| `admin`   | `GET /admin/login`                              | `autoteka repair-health admin`   | `autoteka repair-runtime`         |
| `api`     | `GET /api/v1/category-list`                     | не лечится автоматически         | разбирать endpoint/данные вручную |

Порядок проверки: `nginx` → `php` → `backend` → (`admin`, `api`). Если
верхний слой красный, нижний слой не переводится в новый инцидент в
этот цикл.

### 7.3.2. Фазы инцидента

Для доменов `nginx`, `php`, `backend`, `admin` используется одна
схема:

1. первая неудачная проверка → `DEGRADED`;
2. вторая подряд → первая попытка auto-repair;
3. если repair не помог → `REPAIR_FAILED` и cooldown;
4. после cooldown → последняя попытка auto-repair;
5. если снова не помогло → `MANUAL_REQUIRED`, автопочинка больше не
   запускается.

Для `api` автопочинка не делается: watchdog только шлёт alert и ждёт
восстановления вручную.

### 7.3.3. Ручные команды

Проверить, что бы сделал watchdog, не меняя состояние:

```bash
autoteka watchdog --dry-run
```

Проверить тяжёлый runtime repair без изменений:

```bash
autoteka repair-runtime --dry-run
```

Сбросить state и lock'и только одного домена:

```bash
autoteka health-reset backend
```

Сбросить все health incidents:

```bash
autoteka health-reset all
```

### 7.4. Не работает автодеплой

Проверьте:

```bash
systemctl list-timers --all | grep autoteka-deploy
journalctl -u watch-changes.service -n 100 --no-pager
tail -n 100 /var/log/autoteka-deploy.log
```

Проверьте также `BRANCH`, `REMOTE` и доступность git remote.

### 7.5. Не обновляется /metrics

Проверьте:

1. запускается ли `server-watchdog.timer`;
2. пишется ли `/var/log/server-metrics.log`;
3. существует ли `deploy/observability/application/metrics/data.json`;
4. смонтирован ли `deploy/observability/application/metrics` в
   контейнер `web`.

### 7.5.1. Счётчик watchdog застрял (метрики устарели)

Если `health=missing` или `fail=N` не сбрасывается, хотя контейнеры
работают:

1. Проверьте таймер: `systemctl status server-watchdog.timer`
2. Запустите `autoteka repair-infra` — включает таймеры и сбрасывает
   счётчик
3. Или `autoteka repair-runtime` — если нужно восстановить runtime
4. Или сбросьте только health incidents через
   `autoteka health-reset all`
5. Базовый host-level счётчик можно сбросить вручную:
   `echo "0" > /var/lib/server-watchdog.state`
6. После recovery выполните полный прогон тестов
   (system/deploy/frontend/backend
   - backend realdb), предпочтительно параллельно по команде из
     раздела 4.6.

### 7.5.2. repair-infra — починка инфраструктуры

Команда `autoteka repair-infra` восстанавливает таймеры и состояние:

- включает и запускает `server-watchdog.timer`,
  `server-maintenance.timer`, `watch-changes.timer`;
- сбрасывает счётчик watchdog;
- проверяет `docker.service`.

Использовать после перезагрузки или когда метрики не обновляются.

```bash
sudo autoteka repair-infra
```

### 7.6. Не приходят Telegram-уведомления

Проверьте:

- `/etc/autoteka/telegram.env`;
- переменные `TELEGRAM_TOKEN` и `TELEGRAM_CHAT`;
- исходящий доступ сервера к `api.telegram.org`.
- `/var/log/autoteka-deploy.log`;
- записи `telegram env file`, `telegram token`, `telegram chat` и
  `telegram notifications` в deploy log;
- `/var/log/autoteka-telegram.log`;
- наличие записей `Для отправки подготовлено сообщение`,
  `Успешная отправка` или `Сбой отправки`.

### 7.7. Коды сообщений, причины и способы исправления

#### Watch changes

`WATCH_CHANGES_FETCH_FAILED`

- Причина: не удалось выполнить `git fetch`.
- Проверьте: `REMOTE`, `BRANCH`, сеть до git remote, SSH key/token.
- Исправление: восстановить доступ к remote, затем запустить
  `systemctl start watch-changes.service`.

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
- Проверьте:
  `docker compose -f deploy/runtime/docker-compose.yml pull`, доступ к
  registry, сеть, rate limits.
- Исправление: восстановить доступ к registry и повторить deploy.

`DEPLOY_PHP_UP_FAILED`

- Причина: не удалось поднять контейнер `php`.
- Проверьте: `docker compose -f deploy/runtime/docker-compose.yml ps`,
  `docker compose -f deploy/runtime/docker-compose.yml logs -f php`.
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

- Причина: `php artisan migrate --force` (из `apps/ShopOperator`)
  завершился ошибкой.
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
- Проверьте: writable-права на `backend/database`, `backend/storage`,
  `backend/bootstrap/cache`, наличие таблиц `sessions`, `cache`, логи
  backend.
- Исправление: восстановить writable runtime, затем повторить deploy
  или выполнить `autoteka repair-runtime`.

`DEPLOY_MAINTENANCE_UP_FAILED`

- Причина: не удалось снять maintenance mode.
- Проверьте: `docker compose exec php php artisan up`.
- Исправление: снять режим вручную после устранения причины поломки.

`DEPLOY_WEB_UP_FAILED`

- Причина: не удалось поднять контейнер `web`.
- Проверьте: `docker compose -f deploy/runtime/docker-compose.yml ps`,
  `docker compose -f deploy/runtime/docker-compose.yml logs -f web`.
- Исправление: исправить runtime-конфигурацию web и повторить deploy.

`DEPLOY_ADMIN_SMOKE_CHECK_FAILED`

- Причина: после успешного запуска `web` URL `/admin/login` не прошёл
  HTTP smoke-check.
- Проверьте:
  `docker compose -f deploy/runtime/docker-compose.yml logs -f web`,
  `docker compose -f deploy/runtime/docker-compose.yml logs -f php`,
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

- Причина: watchdog дошёл до stage2 и перезапустил `autoteka.service`.
- Проверьте: `systemctl status autoteka.service`, compose logs.
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

- Событие: не удалось обновить
  `deploy/observability/application/metrics/data.json`.
- Проверьте: `server-watchdog.log`, права на
  `deploy/observability/application/metrics/data.json`, наличие
  каталога `deploy/observability/application/metrics`,
  `/var/log/autoteka-telegram.log`.
- Исправление: исправить права/путь; событие не блокирует watchdog и
  не требует очистки lock-файлов.

#### Watchdog health domains

Префиксы reason code формируются по домену, например:

- `WATCHDOG_NGINX_DEGRADED`
- `WATCHDOG_NGINX_AUTO_REPAIR_STARTED`
- `WATCHDOG_NGINX_REPAIR_FAILED`
- `WATCHDOG_NGINX_REPAIR_SKIPPED`
- `WATCHDOG_NGINX_MANUAL_REQUIRED`
- `WATCHDOG_NGINX_AUTO_RECOVERED`
- `WATCHDOG_NGINX_RECOVERED`

Аналогично для доменов `PHP`, `BACKEND`, `ADMIN`, `API`.

Смысл событий:

- `DEGRADED` — первая провальная проверка, создан active incident;
- `AUTO_REPAIR_STARTED` — watchdog запустил bounded auto-remediation;
- `REPAIR_FAILED` — repair не помог, включён cooldown;
- `REPAIR_SKIPPED` — домен всё ещё болеет, повторная попытка отложена
  до конца cooldown;
- `MANUAL_REQUIRED` — лимит авто-починок исчерпан, дальше только
  ручная диагностика;
- `AUTO_RECOVERED` — домен восстановился после автоматического
  лечения;
- `RECOVERED` — домен снова healthy после ручной починки или
  естественного восстановления.

Lock-файлы Telegram дедупликации создаются адресно по reason code и
очищаются только при recovery того же домена или через
`autoteka health-reset`.

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

`MAINTENANCE_STORAGE_BACKUP_FAILED`

- Причина: не удалось создать storage+database архив или выполнить
  ротацию старых storage backup-файлов.
- Проверьте: `STORAGE_BACKUP_DIR`, `STORAGE_BACKUP_RETENTION_DAYS`,
  доступность контейнера `php`, наличие путей
  `/var/www/backend/storage` и
  `/var/www/backend/database/database.sqlite`.
- Исправление: исправить env/права/состояние контейнера и повторить
  `autoteka backup-storage` вручную.

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
- storage+database backup (`autoteka backup-storage`) с ротацией
  архивов старше `STORAGE_BACKUP_RETENTION_DAYS`.

### 8.2. Ручное обновление сервера

Если нужно раскатить изменения из рабочего дерева сервера без нового
commit в `REMOTE/BRANCH`, запускайте `autoteka deploy`: этот сценарий
раскатывает текущий `HEAD` без `git fetch` и `git reset`.

Если нужно именно проверить remote и подтянуть новые commit,
запускайте `autoteka watch-changes` или
`systemctl start watch-changes.service`.

Если локальные изменения были сохранены автодеплоем, найдите
идентификатор stash в `/var/log/autoteka-deploy.log` и восстановите
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
sudo systemctl stop watch-changes.timer
```

1. перейти в каталог репозитория:

```bash
cd "$AUTOTEKA_ROOT"
```

1. пересобрать и поднять контейнеры вручную:

```bash
sudo docker compose -f deploy/runtime/docker-compose.yml up -d --build --remove-orphans
```

1. проверить состояние и логи:

```bash
sudo docker compose -f deploy/runtime/docker-compose.yml ps
sudo docker compose -f deploy/runtime/docker-compose.yml logs -f web
sudo docker compose -f deploy/runtime/docker-compose.yml logs -f php
```

1. после проверки вернуть таймер автодеплоя:

```bash
sudo systemctl start watch-changes.timer
```

Если локальные изменения должны сохраниться надолго, не включайте
автодеплой обратно, пока они не зафиксированы в git и не появились в
`REMOTE/BRANCH`.

### 8.3. Ручной контроль

После инцидента или крупных изменений проверьте:

1. `systemctl status autoteka.service`
   `systemctl status watch-changes.service`
   `systemctl status watch-changes.timer`
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
docker compose -f deploy/runtime/docker-compose.yml exec php php artisan autoteka:data:import <scope> --mode=<dry-run|refresh|append> --file=<path>
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
docker compose -f deploy/runtime/docker-compose.yml exec php \
php artisan autoteka:data:import city \
--mode=dry-run --file=/var/www/frontend/src/mocks/city-list.json
```

```bash
docker compose -f deploy/runtime/docker-compose.yml exec php \
php artisan autoteka:data:import category \
--mode=refresh --file=/var/www/frontend/src/mocks/category-list.json
```

```bash
docker compose -f deploy/runtime/docker-compose.yml exec php \
php artisan autoteka:data:import feature \
--mode=append --file=/var/www/frontend/src/mocks/feature-list.json
```

```bash
docker compose -f deploy/runtime/docker-compose.yml exec php \
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
sudo ./deploy/bootstrap/uninstall.sh <mode> [flags]
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
- `--rm-storage-backups`
- `--rm-root`

Границы безопасности:

- shared server packages не удаляются;
- `/etc/autoteka/*` удаляется только по флагу;
- каталог storage backup-архивов удаляется только по флагу
  `--rm-storage-backups`;
- репозиторий удаляется только по `--rm-root`.

При `purge` удаляются также:

- `/etc/logrotate.d/autoteka-telegram`;
- `/etc/logrotate.d/autoteka-backend`;
- `/var/log/autoteka-telegram.log`.

## 10. Резервное копирование и восстановление deploy-настроек

Скрипты `backup-deploy.sh` и `restore-deploy.sh` сохраняют и
восстанавливают серверные настройки, влияющие на работу приложения и
Docker-сервисов:

- `/etc/autoteka/deploy.env`, `/etc/autoteka/telegram.env`;
- `backend/.env`, `frontend/.env`;
- systemd unit'ы (autoteka, deploy, watchdog, maintenance);
- конфиги Docker, journald, fail2ban, logrotate.

**Backup** создаёт tar.gz-архив с timestamp в имени:

```bash
sudo autoteka backup
# или
sudo ./deploy/backup-deploy.sh [--output-dir=/path]
```

Отдельный daily storage+db backup (для `backend/storage` +
`database.sqlite`) запускается так:

```bash
sudo autoteka backup-storage
```

По умолчанию архив сохраняется в
`/root/autoteka-backup-YYYYMMDD-HHMMSS.tar.gz`.

**Restore** восстанавливает файлы из архива:

```bash
sudo autoteka restore /root/autoteka-backup-20260307-143022.tar.gz
# или
sudo ./deploy/restore-deploy.sh <archive> [--dry-run] [--force] [--target-root=/path]
```

Опции restore:

- `--dry-run` — показать, что будет восстановлено, без записи;
- `--force` — без интерактивного подтверждения;
- `--target-root=/path` — путь к репозиторию для `backend/.env` и
  `frontend/.env` (при переносе на новый сервер с другим путём).

После restore выполняются `systemctl daemon-reload` и перезапуск
journald, fail2ban, docker, autoteka.service.

После restore из backup БД обязательно выполните полный прогон тестов
всех контуров:

```bash
cd "$AUTOTEKA_ROOT/system-tests"
npm test
cd ../deploy/tests
npm test
cd ../../frontend
npm test
npm run test:ui:mock
npm run test:api:online
npm run test:e2e
cd ../backend
php artisan test
php artisan test --configuration=phpunit.realdb.xml
```

Параллельный вариант:

```bash
npx concurrently -k --names "system,deploy,frontend-offline-ui,frontend-api-online,frontend-e2e-online,backend,backend-realdb" \
"cd system-tests && npm test" \
"cd deploy/tests && npm test" \
"cd frontend && npm run test && npm run test:ui:mock" \
"cd frontend && npm run test:api:online" \
"cd frontend && npm run test:e2e" \
"cd backend && php artisan test" \
"cd backend && php artisan test --configuration=phpunit.realdb.xml"
wait
```

Также можно использовать профили из корня:

```bash
npm run test:profile:offline
npm run test:profile:installation-e2e
```

**Безопасность:** архив содержит секреты (APP_KEY, TELEGRAM_TOKEN,
пароли). Храните в защищённом месте, не коммитьте в git, не
передавайте по незащищённым каналам.

## 11. Конфигурация nginx

`deploy/nginx/nginx.conf` — конфиг nginx для web-контейнера.
Копируется в образ при сборке через `deploy/nginx/Dockerfile`.

### 11.1. Основные настройки

**`server.listen 80`**

Порт, на котором nginx принимает HTTP-запросы. Должен совпадать с
`HTTP_PORT` из `deploy.env`. Изменение требует обновления `HTTP_PORT`
и перезапуска контейнера.

### 11.2. Кеширование

**`location = /index.html` (Cache-Control: no-cache)**

Запрещает кеширование главной страницы в браузере. Гарантирует, что
при обновлении frontend пользователи получат актуальную версию с
новыми hashed assets. Без этого браузер может показывать старую версию
после deploy.

**`location = /metrics/data.json` (Cache-Control: no-cache)**

Метрики всегда свежие. Браузер не кеширует JSON, что важно для
мониторинга в реальном времени. Без этого метрики могут быть
устаревшими.

**`location /assets/` (expires 1y, Cache-Control: public, immutable)**

Vite assets кешируются на год. Имена файлов содержат hash, поэтому
безопасно. Ускоряет загрузку для повторных визитов. При проблемах с
deploy может показывать старые assets до очистки кеша браузера.

**`location = /metrics/index.html` и `location /metrics/` (expires
1y)**

Страница метрик может кешироваться долго, т.к. она статична.

### 11.3. Раздача статики

**`location ^~ /storage/` (alias)**

Прямая раздача медиа из Laravel storage без symlink. Обходит проблемы
с правами на symlink в Docker. Критично для отображения изображений
магазинов. Неправильный путь приведёт к 404 для всех медиа.

**`location ^~ /vendor/moonshine/`**

MoonShine/Laravel static assets из `backend/public`. Кешируются на
год.

**`location ~* ^/(generated|bg)/.+\.(png|jpg|jpeg|gif|ico|svg|webp)$`**

Public статика без хэша: не кешируется, чтобы правки были видны сразу.

### 11.4. Проксирование backend

**`location ~ ^/api(/|$)` и `location ~ ^/admin(/|$)`**

Проксирование API-запросов и back office в PHP-FPM через `@laravel`.
Все `/api/v1/*` и `/admin/*` идут в Laravel. Без этого frontend не
сможет получить данные, back office будет недоступен. Ошибка в
`fastcgi_pass` приведёт к 502.

**`fastcgi_pass php:9000`**

Соединение с PHP-FPM в контейнере `php`. Имя `php` резолвится через
Docker network. Неправильное имя или недоступность контейнера приведёт
к 502 для всех backend-запросов.

### 11.5. SPA fallback

**`location /` (try_files ... /index.html)**

SPA fallback для Vue Router history mode. Все неизвестные пути
возвращают `index.html`, позволяя роутеру обработать маршрут. Без
этого прямые ссылки на `/shop/:code` дадут 404.

## 5.4 Локальная разработка и рабочие команды

Локальная разработка, debug-режимы, повседневные команды запуска,
диагностики и ремонта описаны в `docs/manual/ADMIN_MANUAL.md`.

`DEPLOY.md` фиксирует только deploy-процессы, install/backup/restore,
systemd-обвязку и связанные серверные сценарии.
