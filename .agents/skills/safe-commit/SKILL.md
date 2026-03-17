---
name: safe-commit
description: Use only when the user explicitly asks for a commit and the repository verification gate already passes; enforces commit policy and forbidden-path checks.
---

Workflow:

1. Ensure verification already passed.
2. Ensure no forbidden paths are staged:
   - `tasks/*`
   - `inbox/*`
3. Commit via:

```powershell
pwsh "scripts/agent/commit.ps1" `
    -Message "<a short summary of the changes>" `
    -Body "<Explain why the changes were made>" `
    -AISystemName "<AI system name>" `
    -LLMName "<LLM name>"
```

Never use raw `git commit`.
