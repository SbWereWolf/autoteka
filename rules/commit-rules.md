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
  - В конце body отдельно добавляй свою подпись:
    `Author: {platform}-{model}`
- Пример, если делаешь коммит на Win10/WSL2:

```powershell
pwsh ./scripts/commit-with-message.ps1 `
  -Subject "Configure metrics caching and routing" `
  -Body @(
    "Add explicit nginx rules for metrics routes and caching.",
    "Keep metrics page cacheable while data.json stays no-cache."
  ) `
  -AgentId "assistant" `
  -ModelName "gpt-5"
```
- Пример, если делаешь коммит на \*nix:

```bash
bash ./scripts/commit-with-message.sh \
  --subject "Configure metrics caching and routing" \
  --body "Add explicit nginx rules for metrics routes and caching." \
  --body "Keep metrics page cacheable while data.json stays no-cache." \
  --agent-id "assistant" \
  --model-name "gpt-5"
```
