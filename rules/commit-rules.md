# Правила создания коммита

- Если делаешь коммит - keep one logical change per commit
- Если делаешь коммит, пиши сообщение на английском
- Сообщение коммита создавай через временный markdown-файл (`.md`), а
  не через inline строку в `git commit -m`
- Если делаешь коммит, обязательно пиши subject
  - Subject не длиннее 50 символов
  - Subject кратко объясняет цель изменений
  - После subject обязательно одна пустая строка
- Если делаешь коммит, обязательно пиши body
  - Body объясняет причины и последствия изменений
  - Каждая строка body не длиннее 70 символов
  - Запиши в Body `Created by <agent-id> <model-name>`
- Перед коммитом временный файл сообщения обязательно прогони через
  линтер/форматтер по тем же правилам выбора, что и `lint`:
  - в Win10/WSL2:
    `pwsh ./lint/lint.ps1 -Path "<temp_commit_message.md>"`
  - иначе (\*nix):
    `bash ./lint/lint.sh -Path "<temp_commit_message.md>"`
- После выполнения коммита временный файл сообщения обязательно удали
- Для Win10/WSL2 используй:
  `pwsh ./scripts/commit-with-message.ps1 ...`
- Для \*nix используй: `bash ./scripts/commit-with-message.sh ...`
- Подробная инструкция:
  [commit-message-script](../docs/COMMIT_MESSAGE_SCRIPT.md)
