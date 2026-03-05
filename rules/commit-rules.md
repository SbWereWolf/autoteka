# Правила создания коммита

- Если делаешь коммит - keep one logical change per commit
- Если делаешь коммит, пиши сообщение на английском
- Если делаешь коммит, обязательно пиши subject
  - Subject не длиннее 50 символов
  - Subject кратко объясняет цель изменений
  - После subject обязательно одна пустая строка
- Если делаешь коммит, обязательно пиши body
  - Body объясняет причины и последствия изменений
  - Перечисление причин и последствий оформи как нумерованный md-список
  - В body не должно быть пустых строк, кроме отделения subject от body
  - В конце body отдельно добавляй свою подпись:
    `Author: {platform}-{model}`
- Коммит делай с помощью helper-скрипта

Пример, если делаешь коммит на Win10/WSL2:

```powershell
pwsh ./scripts/commit-with-message.ps1 `
  -Subject "Configure metrics caching and routing" `
  -Body @(
    "Add explicit nginx rules for metrics routes and caching.",
    "Keep metrics page cacheable while data.json stays no-cache."
  ) `
  -Platform "codex" `
  -Model "gpt-5"
```

Пример preview без создания commit:

```powershell
pwsh ./scripts/commit-with-message.ps1 `
  -Subject "Configure metrics caching and routing" `
  -Body @(
    "Add explicit nginx rules for metrics routes and caching.",
    "Keep metrics page cacheable while data.json stays no-cache."
  ) `
  -Platform "codex" `
  -Model "gpt-5" `
  -DryRun
```

Пример, если делаешь коммит на *nix:

```bash
bash ./scripts/commit-with-message.sh \
  --subject "Configure metrics caching and routing" \
  --body "Add explicit nginx rules for metrics routes and caching." \
  --body "Keep metrics page cacheable while data.json stays no-cache." \
  --platform "codex" \
  --model-name "gpt-5"
```

Пример preview без создания commit на *nix:

```bash
bash ./scripts/commit-with-message.sh \
  --subject "Configure metrics caching and routing" \
  --body "Add explicit nginx rules for metrics routes and caching." \
  --body "Keep metrics page cacheable while data.json stays no-cache." \
  --platform "codex" \
  --model-name "gpt-5" \
  --dry-run
```
