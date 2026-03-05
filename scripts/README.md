# scripts/

Назначение файлов:

- `check-unused-assets.mjs` — проверка лишних/отсутствующих файлов в `public/generated`.
- `commit-with-message.ps1` — helper для создания commit с сообщением (PowerShell).
- `commit-with-message.sh` — helper для создания commit с сообщением (bash).
- `generate-shop-images.mjs` — генерация изображений магазинов в `public/generated`.
- `validate-mocks.mjs` — валидация консистентности мок-данных и связанных ассетов.
- `read-scripts-env.ps1` — чтение локального `scripts/.env` в key/value-словарь.
- `resolve-bash-runtime.ps1` — выбор bash-интерпретатора через `scripts/.env` и PATH.
- `check-bash-runtime.ps1` — проверка запуска bash и синтаксиса `commit-with-message.sh`.
- `example.env` — пример формата `scripts/.env`.

## Локальная конфигурация

1. Скопируй `scripts/example.env` в `scripts/.env`.
2. Заполни нужные переменные.

Поддерживаемые переменные:

- `SCRIPT_BASH_PATH` — путь к интерпретатору `bash`.
- `SCRIPT_NODE_PATH` — путь к исполняемому файлу `node`.
- `SCRIPT_NPX_PATH` — путь к исполняемому файлу `npx`.

## Быстрые команды

Проверка bash runtime:

```powershell
pwsh ./scripts/check-bash-runtime.ps1
```

Только выбор bash пути:

```powershell
pwsh ./scripts/resolve-bash-runtime.ps1
```
