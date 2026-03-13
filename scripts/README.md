# scripts/

Папка **только для общих** утилит репозитория (не фронтовых `.mjs`).

## Состав

- `commit-with-message.ps1` — helper для создания commit с сообщением
  (PowerShell).
- `commit-with-message.sh` — helper для создания commit с сообщением
  (bash).
- `read-scripts-env.ps1` — чтение локального `scripts/.env` в
  key/value-словарь.
- `resolve-bash-runtime.ps1` — выбор bash-интерпретатора через
  `scripts/.env` и PATH.
- `swap-env.ps1` / `swap-env.sh` — переключение platform-dependent
  рабочих путей между `win` и `wsl` через active файлы и средовые
  варианты.
- `check-bash-runtime.ps1` — проверка запуска bash и синтаксиса
  `commit-with-message.sh`.
- `log-entry.ps1` — запись журнала работ в `logs/` по правилам из
  `rules/logging-rules.md`.
- `example.env` — пример формата `scripts/.env`.

Фронтовые `.mjs` утилиты переехали в `frontend/scripts/`.

## Локальная конфигурация

1. Скопируй `scripts/example.env` в `scripts/.env`.
2. Заполни нужные переменные.

Поддерживаемые переменные:

- `SCRIPT_BASH_PATH` — путь к интерпретатору `bash`.
- `SCRIPT_NODE_PATH` — путь к исполняемому файлу `node`.
- `SCRIPT_NPX_PATH` — путь к исполняемому файлу `npx`.
- `SCRIPT_PHP_PATH` — путь к исполняемому файлу `php` для репозиторных
  PowerShell-скриптов, включая `scripts/agent/verify.ps1`.

## Переключение platform env

`swap-env.ps1` и `swap-env.sh` определяют текущую среду (`win` или
`wsl`) и приводят рабочие пути к схеме с активным набором:

- `node_modules` — рабочий каталог текущей среды
- `node_modules.win` / `node_modules.wsl` — неактивные средовые варианты
- `package-lock.json` — рабочий lock текущей среды
- `package-lock.win.json` / `package-lock.wsl.json` — версионируемые
  средовые lock-файлы
- `scripts/.env` — активный env для общих PowerShell/bash-скриптов
- `lint/.env` — активный env для lint-скриптов
- `backend/apps/ShopAPI/.env` — активный env runtime `ShopAPI`
- `backend/apps/ShopOperator/.env` — активный env runtime
  `ShopOperator`

Для переключения сред скрипты перемещают active пути между вариантами, а
не полагаются на `node_modules`-симлинки в WSL. Active `package-lock.json`
остается локальным рабочим файлом и не должен попадать в Git.
То же правило действует для active `.env`: сами runtime/verify/lint
скрипты работают только с `.env`, а platform-specific варианты
`win.env` / `wsl.env` подменяются заранее через `swap-env.*`.

## Примеры helper-коммита

PowerShell:

```powershell
pwsh ./scripts/commit-with-message.ps1 `
  -Subject "Configure metrics caching and routing" `
  -Body @(
    "Add explicit nginx rules for metrics routes and caching.",
    "Keep metrics page cacheable while data.json stays no-cache."
  ) `
  -AISystemName "codex" `
  -LLMName "gpt-5"
```

bash:

```bash
bash ./scripts/commit-with-message.sh \
  --subject "Configure metrics caching and routing" \
  --body "Add explicit nginx rules for metrics routes and caching." \
  --body "Keep metrics page cacheable while data.json stays no-cache." \
  --ai-system-name "codex" \
  --llm-name "gpt-5"
```
