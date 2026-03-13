# Tech writer standard

## Document roles

### Docs

Use docs for:

- physical/factual implementation of the system;
- separation of responsibilities between parts;
- connections between parts;
- architecture and module boundaries.

Examples:

- `docs/foundations/IMPLEMENTATION.md`
- `infrastructure/DEPLOY.md` for physical infrastructure and ops mechanics

### Runbooks / manuals

Use manuals for:

- how to perform a task;
- what commands/buttons to use;
- what to check when something fails.

Examples:

- `USER_MANUAL`
- `CLERC_MANUAL`
- `ADMIN_MANUAL`
- `TESTING`

### Test cases

Use test-case files for:

- verification traceability;
- mapping docs/requirements to checks.

## Rule: one document, one axis

Do not turn an architecture document into a step-by-step operator manual.
Do not turn a manual into a theory document.
Do not hide verification only in prose when a test-case link can be added.

## How to do it

```md
## See also

- [ADMIN_MANUAL](../manual/ADMIN_MANUAL.md) — practical operator steps
- [infrastructure-DEPLOY-test-cases](../../test-cases/infrastructure-DEPLOY-test-cases.md) — verification of infrastructure behavior
```

## How not to do it

```md
## Architecture

1. Run this command
2. Open this page
3. Click this button
4. If it fails, restart docker
```

The bad example mixes architecture with a runbook.

## Cross-linking

Prefer links such as:

- docs -> related runbooks
- docs -> related test cases
- runbooks -> deeper docs when the reader needs background
- manuals -> testing doc when validation is part of the task

## Writing rule

Be explicit about:

- what this document covers;
- what it intentionally does not cover;
- where the reader should go next.
