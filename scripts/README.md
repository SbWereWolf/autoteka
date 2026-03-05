# scripts/

Папка **только для общих** утилит репозитория (не фронтовых `.mjs`).

## Состав

- `commit-with-message.ps1` — helper для создания commit с сообщением (PowerShell).
- `commit-with-message.sh` — helper для создания commit с сообщением (bash).
- `read-scripts-env.ps1` — чтение локального `scripts/.env` в key/value-словарь.
- `resolve-bash-runtime.ps1` — выбор bash-интерпретатора через `scripts/.env` и PATH.
- `check-bash-runtime.ps1` — проверка запуска bash и синтаксиса `commit-with-message.sh`.
- `example.env` — пример формата `scripts/.env`.

Фронтовые `.mjs` утилиты переехали в `frontend/scripts/`.

## Локальная конфигурация

1. Скопируй `scripts/example.env` в `scripts/.env`.
2. Заполни нужные переменные.

Поддерживаемые переменные:

- `SCRIPT_BASH_PATH` — путь к интерпретатору `bash`.
- `SCRIPT_NODE_PATH` — путь к исполняемому файлу `node`.
- `SCRIPT_NPX_PATH` — путь к исполняемому файлу `npx`.
