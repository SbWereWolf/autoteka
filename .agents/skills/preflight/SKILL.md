---
name: preflight
description: Snapshot repository state before planning changes
---

Use this skill before structural changes.

Run:

- scripts/agent/preflight.ps1 -Json

Interpret exit codes strictly:
0 = ok
3 = missing dependency
4 = not a git repo

Do not narrate findings — summarize in one line.