# Скрипты commit message (Win10 и \*nix)

## Назначение

Скрипты создают временный markdown-файл с сообщением коммита,
форматируют его и проверяют линтерами, выполняют `git commit -F` и
удаляют временный файл.

Это решает проблему с буквальными `\n` в сообщениях коммита и
гарантирует формат по правилам проекта.

## Когда какой скрипт использовать

- в Win10/WSL2 используй: `pwsh ./scripts/commit-with-message.ps1 ...`
- иначе (\*nix) используй: `bash ./scripts/commit-with-message.sh ...`

Правило выбора совпадает с `rules/text-formatting-rules.md`.

## Win10/WSL2 (PowerShell)

Пример:

```powershell
pwsh ./scripts/commit-with-message.ps1 `
  -Subject "Configure metrics caching and routing" `
  -Body @(
    "Add explicit nginx rules for metrics routes and caching.",
    "Keep metrics page cacheable while data.json stays no-cache."
  ) `
  -AgentId "assistant" `
  -ModelName "gpt-5" `
  -CommitUserName "assistant" `
  -CommitUserEmail "assistant@local"
```

## \*nix (bash)

Пример:

```bash
bash ./scripts/commit-with-message.sh \
  --subject "Configure metrics caching and routing" \
  --body "Add explicit nginx rules for metrics routes and caching." \
  --body "Keep metrics page cacheable while data.json stays no-cache." \
  --agent-id "assistant" \
  --model-name "gpt-5" \
  --commit-user-name "assistant" \
  --commit-user-email "assistant@local"
```

## Поведение

- `Subject` проверяется на длину (до 50 символов)
- строки body переносятся на границе слов до 70 символов
- автоматически добавляется строка
  `Created by <agent-id> <model-name>`
- правило `MD041` отключается только для временного commit message
  файла, общие конфиги не изменяются
- временный файл сообщения удаляется после `git commit`
- подпись коммита можно задать отдельно от вашего git-профиля:
  по умолчанию скрипты используют `assistant <assistant@local>`
