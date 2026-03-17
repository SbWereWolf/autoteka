---
name: safe-commit
description: Safe commit with enforcement and policy checks
---

Workflow:

1. Run verify (apply mode).
2. Ensure no forbidden paths staged:
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

Never use raw git commit.