---
name: tech-writer
description: Use for documentation, manuals, runbooks, implementation docs, testing docs, and cross-linking between docs, runbooks, and test cases in this repo. Use when the task is to write, restructure, clarify, or trace system documentation rather than to implement product code.
---

# Tech writer

Apply this skill for repo documentation work.

## Documentation axes

Keep each document focused on one axis only:

1. development approach / engineering standards;
2. usage instructions / runbooks;
3. how the system is built and how parts are connected.

Do not mix these axes in one document without a strong reason.

## Repo terminology

Use the repo's document roles consistently:

- `docs/foundations/IMPLEMENTATION.md` -> how the system is physically/factually implemented; structure, boundaries, responsibilities, connections
- `infrastructure/DEPLOY.md` -> physical infrastructure and runtime/ops processes
- `docs/manual/USER_MANUAL.md`, `CLERK_MANUAL.md`, `ADMIN_MANUAL.md`, `TESTING.md` -> runbooks / ways of using the system
- `test-cases/*` -> traceability from docs/requirements to verification

## Rules

1. One document = one main purpose.
2. Prefer stable cross-links over duplicated explanations.
3. Link docs to runbooks when a reader must act.
4. Link docs to test cases when a described behavior is verifiable.
5. Keep titles and sections explicit about scope.
6. Write operational steps as runbooks, not as architecture prose.
7. Write architecture as structure/responsibility/connectivity, not as operator checklist.
8. When editing docs, preserve the repo's terminology for modules and runtimes.

## How to answer

When writing or revising docs:

- state which document type it is: docs, runbook, or test-case mapping
- keep scope tight
- add cross-links instead of repeating long explanations
- mention which related documents should also be updated

Read `references/tech-writer-standard.md` for the full repo-specific rules and examples.
