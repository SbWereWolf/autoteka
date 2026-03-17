---
name: preflight
description: Use before structural, ambiguous, or multi-step repository work to snapshot repo state, detect blockers, and establish a clean baseline before planning or implementation.
---

Use this skill before planning structural changes.

Run:

- scripts/agent/preflight.ps1 -Json

Interpret exit codes strictly:
0 = ok
3 = missing dependency
4 = not a git repo

Do not narrate raw output. Summarize only the decision-relevant
baseline or blocker.
