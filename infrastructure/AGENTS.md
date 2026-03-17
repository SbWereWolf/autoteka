# Infrastructure local instructions

Apply these rules when the current working area is inside
`infrastructure/`.

## Scope

Primary skill: `infrastructure`.

## Operational rules

- Prefer explicit scripts over ad-hoc manual command sequences.
- Keep compose file sets explicit, especially for dev/prod target
  overrides.
- Treat diagnostics, repair, rollback, and maintenance as first-class
  behavior.
- Scripts must be safe to rerun or document exactly why not.

## Test selection

- infrastructure test change or infra logic change ->
  `npm --prefix infrastructure/tests test`
- runtime/dev wiring change -> add `npm --prefix system-tests run
  test:quick-dev`
- user-visible runtime flow or browser-dependent regression -> escalate
  to the smallest supported UI/system profile

Do not rely on root `verify.ps1` as the only evidence when changing
`infrastructure/tests`, runtime compose wiring, bootstrap scripts,
maintenance scripts, or observability/repair flows.

## Doc impact

When operator behavior, deploy steps, env wiring, or diagnostics change,
review at least these docs:

- `infrastructure/DEPLOY.md`
- `docs/manual/ADMIN_MANUAL.md`
- `docs/manual/TESTING.md`
- `docs/foundations/IMPLEMENTATION.md`
