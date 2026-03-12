---
name: safe-commit
description: Safe commit with enforcement and policy checks
---

Workflow:

1. Run verify (apply mode).
2. Ensure no forbidden paths staged:
    - operational/*
    - logs/*
3. Commit via:

scripts/agent/commit.ps1 -Message "<english message>"

Never use raw git commit.