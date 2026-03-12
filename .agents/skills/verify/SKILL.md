---
name: verify
description: Deterministic verification gate (lint + tests)
---

Use before commit or after significant refactor.

Command:

scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal

`minimal` means quick gate without browser:
- frontend unit tests
- backend quick tests (`backend/apps/ShopAPI`)
- system quick HTTP checks (`system-tests` / `test:quick-local`)

If exit code != 0:
- Stop.
- Fix.
- Re-run.

Never bypass this skill.
