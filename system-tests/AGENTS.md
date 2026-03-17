# System-tests local instructions

Apply these rules when the current working area is inside
`system-tests/`.

## Scope

System tests are product evidence, not disposable helpers.
Changing these tests changes the verification contract of the repo.

## Rules

- Keep profile choice explicit: `quick-local`, `quick-dev`,
  `ui-headless-dev`, `ui-headless-prod`, `ui-headed-local`,
  `ui-headed-prod`.
- Prefer the smallest profile that proves the changed behavior.
- If runtime/integration behavior changes, document why a chosen profile
  is sufficient.
- When changing runner logic or profile selection, do not trust only the
  root quick gate because minimal verify caching may skip the changed
  surface.

## Doc impact

Review at least:

- `docs/manual/TESTING.md`
- `README.md`
- `infrastructure/DEPLOY.md` when runtime profile behavior changes
