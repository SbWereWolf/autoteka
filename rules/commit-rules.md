# Правила создания коммита

- Если делаешь коммит:
  - keep one logical change per commit
  - пиши сообщение на английском
  - обязательно пиши subject
    - Subject не длиннее 50 символов
    - Subject кратко объясняет цель изменений
  - Если делаешь коммит, обязательно пиши body
    - Body объясняет причины и последствия изменений
    - В конце body отдельно добавляй свою подпись:
      `Author: {ai-system-name} {llm-name}`
  - Коммит делай с помощью helper-скрипта
 
## Пример, если делаешь коммит на Win10/WSL2:

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

### Частая ошибка для PowerShell:
- Не передавай `-Body` как набор отдельных строк без массива, иначе
  PowerShell может интерпретировать часть значений как позиционные
  аргументы и завершиться с ошибкой
  `A positional parameter cannot be found...`.
- Безопасный вариант для one-liner:

```powershell
pwsh -Command "& { ./scripts/commit-with-message.ps1 -Subject 'Configure metrics caching and routing' -Body @('Add explicit nginx rules for metrics routes and caching.','Keep metrics page cacheable while data.json stays no-cache.') -AISystemName 'codex' -LLMName 'gpt-5' }"
```

## Пример, если делаешь коммит на \*nix:

```bash
bash ./scripts/commit-with-message.sh \
  --subject "Configure metrics caching and routing" \
  --body "Add explicit nginx rules for metrics routes and caching." \
  --body "Keep metrics page cacheable while data.json stays no-cache." \
  --platform "codex" \
  --model-name "gpt-5"
```
