# Repo test matrix for agent work

Use this matrix when selecting direct checks in addition to the baseline
repository gate.

## Mandatory baseline gate

Always treat this as the baseline gate for non-trivial changes:

```powershell
pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal
```

This gate is required but not sufficient for every surface.

## Frontend

### `frontend/src/*`

Primary commands:

```bash
npm --prefix frontend run test:unit:parallel
```

Use browser or online checks when the behavior depends on routing,
rendered interaction, or runtime integration:

```bash
npm --prefix frontend run test:ui:mock
PLAYWRIGHT_BASE_URL=http://127.0.0.1 npm --prefix frontend run test:e2e
API_BASE_URL=http://127.0.0.1/api/v1 npm --prefix frontend run test:api:online
```

## Backend runtimes

### `backend/apps/ShopAPI/*`

Primary commands:

```bash
php artisan test --parallel --processes=2
```

Run from:

```text
backend/apps/ShopAPI
```

If the observable API contract changed, add a direct HTTP or
`system-tests` quick check.

### `backend/apps/ShopOperator/*`

Primary commands:

```bash
php artisan test --parallel --processes=2
```

Run from:

```text
backend/apps/ShopOperator
```

If admin/operator-visible behavior changed, add a direct system or UI
check when needed.

### `backend/packages/SchemaDefinition/*`

Treat this as shared backend surface.

Minimum direct checks usually include both runtimes:

```bash
cd backend/apps/ShopAPI && php artisan test --parallel --processes=2
cd backend/apps/ShopOperator && php artisan test --parallel --processes=2
```

If the package changes schema, contracts, or integration assumptions,
record migration and recovery notes in the active plan.

## System tests

### API/smoke/manual-linked behavior

```bash
npm --prefix system-tests run test:quick-local
npm --prefix system-tests run test:quick-dev
```

Choose local or dev according to the runtime under test.

### UI/browser behavior

```bash
npm --prefix system-tests run test:ui-headless-dev
npm --prefix system-tests run test:ui-headed-local
npm --prefix system-tests run test:ui-headless-prod
npm --prefix system-tests run test:ui-headed-prod
```

Use the lightest profile that proves the changed behavior.

## Infrastructure

### `infrastructure/*`

Primary direct check:

```bash
npm --prefix infrastructure/tests test
```

Add targeted script smoke checks when a single runtime or maintenance
script changed.

## Repo tooling

### `scripts/agent/*`

The baseline gate is still required, but it is not enough.

Run the changed scripts directly with safe flags where possible.
Examples:

```powershell
pwsh scripts/agent/preflight.ps1 -Json
pwsh scripts/agent/changed-files.ps1 -Json
pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal
```

When the verification script itself changed, call out cache limitations
explicitly.

### `lint/*`

Use targeted lint runs for the changed paths. Example:

```powershell
pwsh lint/lint.ps1 -Path docs -Mode Strict
```

Adjust the path to the changed surface.

## Documentation

Docs-only changes do not need a fake red-green cycle, but they still
need direct checks when they make executable claims.

Possible direct checks:

```powershell
pwsh lint/lint.ps1 -Path docs -Mode Strict
pwsh lint/lint.ps1 -Path README.md -Mode Strict
```

When a changed document describes tested behavior or commands, run the
linked behavior check from `docs/manual/TESTING.md` or the nearest local
`AGENTS.md`.
