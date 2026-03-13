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
- `swap-env.ps1` / `swap-env.sh` — явная проверка, сохранение и загрузка
  platform-specific артефактов для `win` и `wsl`.
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

## Работа с platform env

`swap-env.ps1` и `swap-env.sh` определяют текущую среду запуска (`win`
или `wsl`) и работают только с артефактами этой среды. Автоматического
переключения нет: пользователь сам решает, когда проверять активное
состояние, когда сохранять его в platform-specific storage и когда
загружать сохранённый набор обратно в active-пути.

### Команды

- `validate` — сверяет active-артефакт с env-specific артефактом текущей
  среды. Это команда по умолчанию.
- `save` — полностью перезаписывает env-specific артефакт текущей среды
  из active-артефакта.
- `load` — полностью перезаписывает active-артефакт из env-specific
  артефакта текущей среды.
- `--help` — показывает `USAGE`, список типов и связанные пути.

`--dry-run` поддерживается только у `validate` и показывает, на каких
парах будет ошибка, не меняя файлы и каталоги.

### Что проверяется и сохраняется

Типы файлов:

- `root-lock`
- `frontend-lock`
- `system-tests-lock`
- `infrastructure-tests-lock`
- `scripts-env`
- `lint-env`
- `shop-api-env`
- `shop-operator-env`

Типы каталогов:

- `root-node-modules`
- `frontend-node-modules`
- `system-tests-node-modules`
- `infrastructure-tests-node-modules`

Сопоставление путей:

- `*-env` — active `.env` и `win.env` / `wsl.env`
- `*-lock` — active `package-lock.json` и
  `package-lock.win.json` / `package-lock.wsl.json`
- `*-node-modules` — active `node_modules` и
  `node_modules.win` / `node_modules.wsl`

`validate` сравнивает:

- файлы — по полному совпадению содержимого;
- каталоги `node_modules` — только по списку относительных директорий,
  без сравнения списков файлов и без сравнения содержимого файлов.

Если обязательный источник для текущей среды не найден или не читается,
`swap-env` завершится с кодом `3`. Если источник найден, но содержимое
или структура не совпадают, `swap-env` завершится с кодом `1` и
попросит пользователя синхронизировать артефакты вручную.

### Примеры

Проверка всего active-набора:

```powershell
pwsh ./scripts/swap-env.ps1
pwsh ./scripts/swap-env.ps1 validate --dry-run
```

```bash
bash ./scripts/swap-env.sh
bash ./scripts/swap-env.sh validate --dry-run
```

Сохранение активных артефактов текущей среды:

```powershell
pwsh ./scripts/swap-env.ps1 save `
  --type scripts-env `
  --type lint-env `
  --type root-lock
```

```bash
bash ./scripts/swap-env.sh save \
  --type scripts-env \
  --type lint-env \
  --type root-lock
```

Загрузка сохранённых артефактов текущей среды в active-пути:

```powershell
pwsh ./scripts/swap-env.ps1 load `
  --type scripts-env `
  --type lint-env `
  --type root-lock
```

```bash
bash ./scripts/swap-env.sh load \
  --type scripts-env \
  --type lint-env \
  --type root-lock
```

Полная справка:

```powershell
pwsh ./scripts/swap-env.ps1 --help
```

```bash
bash ./scripts/swap-env.sh --help
```

## Примеры helper-коммита

## Quick verify cache

`scripts/agent/verify.ps1 -TestProfile minimal` использует локальный
кэш fingerprints для quick-проверок frontend, `ShopAPI` и
`ShopOperator`.

- Кэш хранится в `/.runtime/verify/minimal-src-cache.json`.
- Для frontend fingerprint считается по `frontend/src`.
- Для `ShopAPI` fingerprint считается по `backend/apps/ShopAPI/app` и
  `backend/packages/SchemaDefinition/src`.
- Для `ShopOperator` fingerprint считается по
  `backend/apps/ShopOperator/app` и `backend/packages/SchemaDefinition/src`.
- Если fingerprint не изменился с прошлого успешного запуска,
  `verify.ps1` печатает `cache hit: src unchanged` и не запускает
  повторно соответствующий quick-блок.

Кэш не сбрасывается автоматически. Если нужен полный rerun без
использования старых fingerprints, удалите файл
`/.runtime/verify/minimal-src-cache.json` вручную и затем повторите
`verify`.

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
