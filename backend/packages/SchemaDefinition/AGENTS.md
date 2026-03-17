# SchemaDefinition local instructions

These instructions refine the root and `backend/AGENTS.md` for
`backend/packages/SchemaDefinition/`.

## Scope

This package is the shared schema truth. Treat changes here as affecting
both backend runtimes unless proven otherwise.

## Rules

1. Keep schema truth here; do not put runtime orchestration here.
2. Any migration, enum, or shared schema contract change is at least a
   backend-wide change.
3. Prefer `exec-plan` for non-trivial changes here.
4. Record idempotence and recovery notes for risky schema changes.

## Direct checks

Verify both runtimes directly after changing this package.
