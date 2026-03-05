# Автотека — план переезда в monorepo (frontend + backend + deploy)

Дата: 2026‑03‑05  
Владелец плана: команда Автотека (frontend + backend + ops)

---

## 0. Контекст и цель

Сейчас Vue-приложение (front office) живёт в корне репозитория и собирается/деплоится через Docker Compose + systemd таймеры/сервисы и набор админских скриптов.

Нужно:
- разместить **front office** и будущий **back office (Laravel + MoonShine)** в **одном репозитории**;
- вынести **всё, что относится к деплою**, в папку `deploy/`;
- перенести текущий Vue‑проект в `frontend/`;
- сохранить/перенастроить деплой так, чтобы он был **устойчивым** и **не зависел от жёстких путей**;
- добавить **бережный демонтаж** через `undeploy`;
- обеспечить **бэкап конфигов** из `/etc/...` в репо (как артефакт), не ломая текущие места их хранения.

Мы **не пишем код** скриптов в рамках этого документа — только “что и где менять”, чек‑листы, риски и порядок работ.

---

## 1. Ограничения и “конституция” переезда

### 1.1. Переменная корня проекта
- Единая переменная: **`AUTOTEKA_ROOT`**.
- `AUTOTEKA_ROOT` **может быть любым каталогом** (в проде обычно `/opt/vue-app`, но не фиксируем).
- Источник: env‑файл в `/etc/...` (см. ниже).

### 1.2. Где хранить `AUTOTEKA_ROOT`
- В env‑файле, который раскладывает `install.sh`, например:  
  - `/etc/vue-app/deploy.env` (как у вас уже используется в systemd).
- Все сервисы/скрипты получают путь **только** из env или аргумента.

### 1.3. Запрет на жёсткие пути
- В unit‑файлах systemd и админских скриптах **запрещены** захардкоженные пути вида `/opt/vue-app/...`.
- Допускается **только**:
  - env (`AUTOTEKA_ROOT`),
  - аргумент CLI,
  - либо “системная обёртка” (wrapper) в стандартном PATH, которая читает env и дальше работает относительно `AUTOTEKA_ROOT`.

### 1.4. Docker Compose и пути
- Compose‑файл переносим в `deploy/`.
- Запуск compose не должен зависеть от текущей директории.  
  Реализация: через **аргумент** (или env), но **не** через жёсткий путь в unit‑файле.

### 1.5. Переименование example env
- Переименовать:  
  `deploy/config/deploy.env.example` → **`deploy/config/deploy.example.env`**  
  и обновить все ссылки/использования.

### 1.6. Общие папки остаются в корне
- `docs/` — документация всей системы
- `lint/` — общий линт/раннер
- `rules/` — общие правила
- `tasks/` — если общесистемные задачи
- `scripts/` — **только общие** скрипты/утилиты (не фронтовые `.mjs`)

### 1.7. Два независимых `package.json`
- `frontend/package.json` — только фронт.
- `/package.json` — только общие dev‑инструменты (линт/формат по всему репо).  
  **Workspaces не используем.**

### 1.8. Допускается “чистый лист” при переезде
- Можно полностью остановить сервисы, бережно снести окружение, затем установить заново.

---

## 2. Целевая структура репозитория

```text
/
  backend/                      # позже Laravel + MoonShine
  frontend/                     # Vue front office
  deploy/                       # всё, что относится к деплою (compose/nginx/systemd/скрипты/метрики)
  docs/                         # документация всей системы
  lint/                         # общий линт
  rules/                        # общие правила
  tasks/                        # общие задачи (если применимо)
  scripts/                      # общие утилиты (sh/ps1)
  package.json                  # общие dev-tools (линт/формат)
  package-lock.json
  README.md                     # корневая карта репо
```

### 2.1. Внутри `deploy/`
```text
deploy/
  docker-compose.yml
  nginx/
    Dockerfile
    nginx.conf
  metrics/
    data.json (runtime)
    index.html (если есть)
  config/
    deploy.example.env
    telegram.example.env (если есть)
  systemd/
    *.service / *.timer / overrides
  install.sh
  deploy.sh
  undeploy.sh                    # новый
  metrics-export.sh
  server-watchdog.sh
  server-maintenance.sh
  DEPLOY.md
```

### 2.2. Внутри `frontend/`
```text
frontend/
  package.json
  package-lock.json
  src/
  public/
  e2e/
  scripts/                       # фронтовые .mjs
  scripts/README.md
  (vite.config.ts, tsconfig*.json, index.html, etc.)
```

---

## 3. Карта переносов (что куда переезжает)

### 3.1. Vue‑проект → `frontend/`
Перенести в `frontend/`:
- `src/`, `public/`, `e2e/`
- `index.html`
- `vite.config.*`, `tsconfig*.json`
- `postcss.config.*`, `tailwind.config.*`
- `playwright.config.*`, `vitest.config.*` (если есть)
- текущие `package.json` + `package-lock.json`

### 3.2. Деплойные файлы → `deploy/`
Перенести в `deploy/`:
- `docker-compose.yml` → `deploy/docker-compose.yml`
- `nginx.conf` → `deploy/nginx/nginx.conf`
- `Dockerfile` → `deploy/nginx/Dockerfile`
- `metrics/` → `deploy/metrics/`

### 3.3. `scripts/` разделить
- Общие утилиты (ps1/sh, bash-runtime, commit helper, env examples, и т.п.) остаются в `/scripts/`
- Фронтовые `.mjs` (генерация ассетов/валидация/обогащение моков) → `frontend/scripts/`

### 3.4. README
- `/scripts/README.md` — обновить под общий набор
- `/frontend/scripts/README.md` — описать фронтовые утилиты
- `/README.md` — актуализировать: структура, команды, ссылки

---

## 4. Systemd и скрипты: что менять (концептуально)

> В этом разделе **только точки изменения** и “на что обратить внимание”, без реализации.

### 4.1. Env‑файл в `/etc/...`
`install.sh` должен:
- обеспечить наличие `/etc/vue-app/deploy.env`;
- положить туда `AUTOTEKA_ROOT=...` (значение задаётся при установке или берётся по умолчанию);
- обеспечить, что systemd unit’ы читают этот файл.

### 4.2. Unit‑файлы systemd (из `deploy/systemd/`)
Проверить все unit’ы, которые сейчас завязаны на путь к репо и/или cwd. Типично это:
- `vue-app.service`
- `vue-app-deploy.service` + `vue-app-deploy.timer`
- `server-watchdog.service` + `.timer`
- `server-maintenance.service` + `.timer`
- `docker.override.conf` (если содержит путь к репо — обычно нет, но проверить)

**Что должно быть обеспечено:**
- unit’ы не содержат `/opt/vue-app` (или иной путь).
- unit’ы запускают **стабильный entrypoint** (wrapper/команду) или скрипт, который не требует жёсткого пути.
- `AUTOTEKA_ROOT` поступает из env‑файла в `/etc/...`.

### 4.3. Deploy‑скрипты (в `deploy/`)
Проверить:
- `deploy/install.sh`
- `deploy/deploy.sh`
- `deploy/metrics-export.sh`
- `deploy/server-watchdog.sh`
- `deploy/server-maintenance.sh`
- `deploy/DEPLOY.md`

**Критерии:**
- не зависят от `pwd`;
- используют `AUTOTEKA_ROOT` и работают относительно него;
- учитывают новую структуру путей (`deploy/docker-compose.yml`, `deploy/metrics`, `deploy/nginx/*`, `frontend/*`).

---

## 5. Docker Compose / Docker build: ключевые риски и проверки

После переноса compose в `deploy/` меняется “точка отсчёта” относительных путей.

### 5.1. Метрики (volume paths)
- Убедиться, что монтирование метрик использует `deploy/metrics` (через относительный путь от compose‑файла или иным корректным способом).
- Убедиться, что `metrics-export.sh` пишет `data.json` в новый путь (см. ниже).

### 5.2. Build context для nginx (сборка фронта)
- `deploy/nginx/Dockerfile` должен иметь доступ к `frontend/`.
- Compose должен задавать build context так, чтобы Docker видел и `frontend/`, и `deploy/nginx/Dockerfile`.

### 5.3. Будущий backend (напоминание на будущее)
- nginx будет проксировать `/api/` на php-fpm.
- Вероятно появятся:
  - второй Dockerfile для php-fpm,
  - отдельный сервис в compose,
  - возможно сеть/настройка CORS/headers.

Пока это только “закладка”, реализацию делаем после успешного переезда структуры.

---

## 6. Переименование примера env

Переименовать:
- `deploy/config/deploy.env.example` → `deploy/config/deploy.example.env`

**Где проверить ссылки/использования:**
- `deploy/install.sh` — копирование примера в `/etc/vue-app/deploy.env` при первой установке
- `deploy/DEPLOY.md` и `docs/*` — инструкции
- любые проверки/таски/линтеры, которые ожидают имя `*.env.example`

---

## 7. Два `package.json`: правила и проверки

### 7.1. `frontend/package.json`
- содержит зависимости сборки/теста фронта и фронтовые scripts.

### 7.2. `/package.json` (корень)
- содержит только инструменты, которые нужны для общего линта/формата (`lint/` по всей системе).
- **Проверка:** все команды, которые вызывает `lint/lint.ps1`, должны быть доступны через корневые `node_modules/.bin` (то есть прописаны в devDependencies корня).

### 7.3. Документация команд
- Обновить `README.md` и системные docs, чтобы было ясно:
  - фронтовые команды выполняются из `frontend/`;
  - общие проверки выполняются из корня.

---

## 8. Backup конфигов в репо (без изменения рабочих мест в /etc)

### 8.1. Что бэкапить
Список конфигов, которые у вас ставит `install.sh` (примерный по текущей базе):
- `/etc/docker/daemon.json`
- `/etc/systemd/journald.conf.d/limits.conf`
- `/etc/fail2ban/jail.d/sshd.local`
- `/etc/systemd/system/docker.service.d/override.conf`
- `/etc/vue-app/telegram.env`
- `/etc/vue-app/deploy.env`  ← здесь хранится `AUTOTEKA_ROOT`
- unit’ы/таймеры в `/etc/systemd/system/*` (vue-app*, server-watchdog*, server-maintenance*)
- `/etc/logrotate.d/vue-app-deploy`
- `/etc/logrotate.d/server-watchdog`

### 8.2. Как хранить backup в репозитории
- `backup/etc/<...полное_дерево...>` — чтобы файлы с одинаковыми именами не перетирались.
- `backup/README.md` — маппинг: *источник → назначение → комментарий*.

⚠️ Секреты:
- `backup/` рекомендуется держать в `.gitignore` (или хранить только шаблоны без секретов).
- README — можно коммитить, он без секретов.

---

## 9. `undeploy`: бережный демонтаж (новая сущность)

### 9.1. Зачем
Нужно уметь “красиво” остановить/снести развертывание перед миграцией или обслуживанием без хаоса.

### 9.2. Режимы
Рекомендуемые режимы:
1) **soft (дефолт, безопасный)**
   - остановить/отключить timers;
   - остановить сервисы приложения;
   - остановить контейнеры проекта;
   - не удалять volumes/данные;
   - не трогать системные конфиги.

2) **purge**
   - soft +
   - снять unit’ы/таймеры приложения;
   - убрать logrotate правила приложения;
   - оставить системные настройки (docker/fail2ban/journald) как есть.

3) **nuke (только явно)**
   - purge +
   - снять изменения, внесённые `install.sh` на уровне системы (опасно и не всегда желательно).

### 9.3. Требования к `undeploy`
- идемпотентность (повторный запуск безопасен);
- безопасный дефолт;
- destructive режимы требуют явного подтверждения/флага.

---

## 10. Порядок миграции (выбранный сценарий: “чистый лист”)

### Этап A — Подготовка
1) Подготовить/обновить документацию структуры репо.
2) Подготовить backup конфигов `/etc/...` в `backup/` + маппинг README.
3) Убедиться, что известны все unit’ы/таймеры и как они включаются/выключаются.

### Этап B — Остановка и демонтаж
1) Выполнить `undeploy soft` (или `purge`, если нужно).
2) Проверить, что ничего не крутится: сервисы, таймеры, контейнеры.

### Этап C — Рефакторинг репозитория
1) Перенести Vue‑проект в `frontend/`.
2) Перенести деплойные артефакты в `deploy/`.
3) Разделить `scripts/` и обновить оба README.
4) Создать `backend/` как пустую папку (закладка).

### Этап D — Контракты деплоя
1) Обновить `install.sh` под:
   - `AUTOTEKA_ROOT` в `/etc/vue-app/deploy.env`;
   - новый файл `deploy/config/deploy.example.env`;
   - установку wrapper/entrypoint (если выбираете этот путь).
2) Обновить unit’ы systemd под новый способ запуска без жёстких путей.
3) Обновить `deploy.sh` и прочие админские скрипты под новую структуру и `AUTOTEKA_ROOT`.

### Этап E — Развертывание с нуля
1) Запустить `install.sh` (поднимет systemd конфиги, env, таймеры).
2) Выполнить деплой штатным механизмом (timer/ручной запуск).
3) Проверить фронт и метрики.

---

## 11. Проверки после миграции (Definition of Done)

### 11.1. Структура
- В корне: `docs/`, `lint/`, `rules/`, `scripts/`, `frontend/`, `deploy/`, `backend/`.
- `deploy/` содержит compose/nginx/metrics/systemd.

### 11.2. Переменная корня
- В `/etc/vue-app/deploy.env` есть `AUTOTEKA_ROOT`.
- Изменение `AUTOTEKA_ROOT` не требует правок unit‑файлов.

### 11.3. Systemd
- Сервисы/таймеры стартуют без ошибок.
- Нет ссылок на `/opt/vue-app` в unit‑файлах и скриптах (проверка поиском).

### 11.4. Docker/Compose
- Сборка nginx контейнера видит `frontend/` и успешно собирает статику.
- Метрики доступны и обновляются (путь `deploy/metrics/data.json` корректный).

### 11.5. Линт
- Общий линт запускается из корня и видит инструменты в корневом `node_modules`.
- Фронтовые команды запускаются из `frontend/`.

---

## 12. Поисковые чек‑листы (перед выкатыванием)

Сделать поиск по репо и устранить совпадения:

### 12.1. Жёсткие пути
- `/opt/vue-app`
- `WorkingDirectory=` (убрать зависимость или привязать к env/аргументу)

### 12.2. Compose/metrics
- `docker compose`
- `docker-compose.yml`
- `metrics/data.json`
- `/metrics`
- `./metrics` (в compose)

### 12.3. Пример env
- `deploy.env.example` (должно исчезнуть)

---

## 13. Примечания на будущее: интеграция backend (MoonShine)

После завершения миграции структуры:
- добавить `backend/` (Laravel);
- добавить сервис php-fpm в compose;
- nginx проксирует `/api/` на php-fpm;
- по необходимости: Realtime (SSE/WebSocket) — отдельный этап.

---

## Приложение A — единая карта документации

Обновить/добавить:
- `/README.md` — структура + быстрые команды + ссылки
- `/deploy/DEPLOY.md` — установка/деплой/undeploy + `AUTOTEKA_ROOT`
- `/scripts/README.md` — общие утилиты
- `/frontend/scripts/README.md` — фронтовые утилиты
- `backup/README.md` — маппинг конфигов (без секретов)

---
