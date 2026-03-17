---
name: verify
description: Use after meaningful code changes and after each major milestone to run the repository verification gate deterministically, then add the strongest direct checks for the changed surface; do not rely on the quick gate alone when tests, configs, or verification scripts changed.
---

Use after significant changes, after major milestones, and before any
requested commit.

## Baseline gate

Run:

`pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal`

`minimal` is the mandatory baseline quick gate and covers:

- frontend unit tests
- backend quick tests in `backend/apps/ShopAPI`
- backend quick tests in `backend/apps/ShopOperator`

If exit code != 0:

- Stop.
- Fix.
- Re-run.

## Direct-check rule

The quick gate is not enough when the changed surface has its own test
entrypoint.

Also run the most relevant direct checks, for example:

- `npm --prefix frontend run test:unit`
- `npm --prefix frontend run test:ui:mock`
- `npm --prefix frontend run test:api:online`
- `npm --prefix frontend run test:e2e`
- `cd backend/apps/ShopAPI && php artisan test`
- `cd backend/apps/ShopOperator && php artisan test`
- `npm --prefix system-tests run test:quick-local`
- `npm --prefix system-tests run test:quick-dev`
- `npm --prefix infrastructure/tests test`

Choose the smallest sufficient set that matches the change.

## Cache caveat

`verify.ps1 -TestProfile minimal` uses a fingerprint cache at:

- `/.runtime/verify/minimal-src-cache.json`

Do not trust a cache-hit-only result as the sole evidence when the task
changes:

- test files
- test configs
- verification scripts
- env files that affect tests
- runner logic

In those cases, run the directly affected command and clear the cache
before the final quick gate if needed.

Never bypass this skill.
