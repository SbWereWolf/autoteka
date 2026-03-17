---
name: infrastructure
description: Use for infrastructure, maintenance, runtime, Docker Compose, systemd, Bash scripts, observability, backup/restore, watchdog, and operational diagnostics in this repo. Do not use for Laravel application logic or Vue code; use backend or frontend for those.
---

# Infrastructure

Apply this skill for `INFRA_ROOT`, runtime operations, and service maintenance.

## Stack

Work only inside this stack:

- Ubuntu 24+
- Bash
- Docker Compose
- systemd where the repo already uses it

## Document boundaries

Respect the repo split:

- `infrastructure/DEPLOY.md` -> infrastructure processes and runtime scripts
- `docs/manual/ADMIN_MANUAL.md` -> practical admin runbooks
- `docs/foundations/IMPLEMENTATION.md` -> architecture/code, not runtime operations process

## Rules

1. Keep infrastructure logic in `INFRA_ROOT`, not in app code.
2. Prefer explicit, repeatable Bash scripts over ad-hoc manual command sequences.
3. Keep Docker Compose changes compatible with the existing runtime model.
4. Treat `ShopAPI`, `ShopOperator`, and `SchemaDefinition` as separate backend modules running inside the shared runtime.
5. Prefer diagnostics and repair steps that are observable and reversible.
6. When changing operational behavior, update the relevant runbook.
7. Do not redesign the stack around tools outside the approved infra stack unless the user explicitly asks for it.
8. Keep dev/prod target selection explicit when compose overrides matter.

## Test selection

- infrastructure test or infra logic change -> `npm --prefix infrastructure/tests test`
- runtime/dev wiring change -> add `npm --prefix system-tests run test:quick-dev`
- browser-visible runtime regression -> escalate to the smallest relevant UI/system profile

Do not treat root `verify.ps1` as sufficient evidence when changing infrastructure tests, compose wiring, bootstrap scripts, maintenance scripts, or observability/repair flows.

## Documentation impact

Review at least:

- `infrastructure/DEPLOY.md`
- `docs/manual/ADMIN_MANUAL.md`
- `docs/manual/TESTING.md`
- `docs/foundations/IMPLEMENTATION.md`

## How to answer

When implementing or reviewing infra work:

- state which operational layer changes: bootstrap/runtime script, compose, systemd, maintenance, observability, or runbook
- keep commands copy-pasteable
- mention safety checks and rollback/repair implications
- mention required validation steps

Read `references/infrastructure-standard.md` for the full repo-specific rules and examples.
