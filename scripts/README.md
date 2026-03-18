# scripts/

Папка **только для общих** утилит репозитория (не фронтовых `.mjs`).

## Состав

- `commit-with-message.ps1` — helper для создания commit с сообщением
  (PowerShell).
- `commit-with-message.sh` — helper для создания commit с сообщением
  (bash).
- `read-scripts-env.ps1` — чтение локального `scripts/.env` в
  key/value-словарь.
- `swap-env.ps1` / `swap-env.sh` — явная проверка, сохранение и загрузка
  platform-specific артефактов для `win` и `nix`.
- `example.env` — пример формата `scripts/.env`.

## Локальная конфигурация

1. Скопируй `scripts/example.env` в `scripts/.env`.
2. Заполни нужные переменные.

Поддерживаемые переменные:

- `SCRIPT_BASH_PATH` — путь к интерпретатору `bash`.
- `SCRIPT_PHP_PATH` — путь к исполняемому файлу `php` для репозиторных
  PowerShell-скриптов, включая `scripts/agent/verify.ps1`.

## Работа с platform env

`swap-env.ps1` и `swap-env.sh` определяют текущую среду запуска (`win`
или `nix`) и работают только с артефактами этой среды. Автоматического
переключения нет: пользователь сам решает, когда проверять активное
состояние, когда сохранять его в platform-specific storage и когда
загружать сохранённый набор обратно в active-пути.

### Команды

- `validate` — сверяет `active` и `current-env`. Это команда по
  умолчанию.
- `save` — записывает из `active` в `current-env`,
  только если замена нужна.
- `load` — загружает из `current-env` в `active`, 
  только если замена нужна.
- `status` — показывает текущую среду, статусы и полные пути по
  группам папок.
- `--help` / `-h` — краткая справка без путей.

По умолчанию любая команда работает как `-t *`.

- `-t` / `--type` — повторяемый фильтр типов.
- `--type *` — сокращение для всех поддерживаемых типов сразу.
- `--dry-run` — поддерживается у `validate`, `save` и `load`; ничего не
  меняет, только показывает результат.

### Что проверяется и сохраняется

Типы файлов:

- `root-lock`
- `frontend-lock`
- `system-tests-env`
- `system-tests-lock`
- `infrastructure-tests-lock`
- `infrastructure-tests-env`
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

- `*-env` — active `.env` и `win.env` / `nix.env`
- `*-lock` — active `package-lock.json` и
  `package-lock.win.json` / `package-lock.nix.json`
- `*-node-modules` — active `node_modules` и
  `node_modules.win` / `node_modules.nix`

`validate` сравнивает:

- файлы — по полному совпадению содержимого;
- каталоги `node_modules` — только по списку относительных директорий,
  без сравнения списков файлов и без сравнения содержимого файлов.

Если обязательный источник для текущей среды не найден или не читается,
`swap-env` завершится с кодом `3`. Если источник найден, но содержимое
или структура не совпадают, `validate` завершится с кодом `1`, а
`save`/`load` либо выполнят замену, либо сообщат, что замена не нужна.

### Примеры

Проверка всего active-набора:

```powershell
pwsh ./scripts/swap-env.ps1
pwsh ./scripts/swap-env.ps1 validate
pwsh ./scripts/swap-env.ps1 validate --type *
pwsh ./scripts/swap-env.ps1 validate --dry-run
```

```bash
bash ./scripts/swap-env.sh
bash ./scripts/swap-env.sh validate
bash ./scripts/swap-env.sh validate --type '*'
bash ./scripts/swap-env.sh validate --dry-run
```

Сохранение active-артефактов текущей среды:

```powershell
pwsh ./scripts/swap-env.ps1 save
pwsh ./scripts/swap-env.ps1 save --dry-run -t scripts-env
```

```bash
bash ./scripts/swap-env.sh save
bash ./scripts/swap-env.sh save --dry-run -t scripts-env
```

Загрузка current-env в active-пути:

```powershell
pwsh ./scripts/swap-env.ps1 load
pwsh ./scripts/swap-env.ps1 load --dry-run -t scripts-env
```

```bash
bash ./scripts/swap-env.sh load
bash ./scripts/swap-env.sh load --dry-run -t scripts-env
```

Подробные пути и статусы:

```powershell
pwsh ./scripts/swap-env.ps1 status
pwsh ./scripts/swap-env.ps1 status -t scripts-env
```

```bash
bash ./scripts/swap-env.sh status
bash ./scripts/swap-env.sh status -t scripts-env
```

Краткая справка:

```powershell
pwsh ./scripts/swap-env.ps1 -h
```

```bash
bash ./scripts/swap-env.sh -h
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
