# Docs local instructions

Apply these rules when the current working area is inside `docs/`.

## Scope

Primary skill: `tech-writer`.

## Core rules

- One document = one main axis.
- Architecture docs explain structure and boundaries.
- Manuals/runbooks explain operator or user actions.
- Testing docs explain profiles, evidence, and launch rules.
- Prefer cross-links over duplicated long explanations.

## Consistency checks

When updating docs, confirm that names, paths, commands, and profile
labels still match the codebase.

If a document describes behavior that changed in code, confirm whether
related test cases, manuals, or implementation docs also need updates.

## Important companion docs

Review these when the change crosses axes:

- `README.md`
- `docs/foundations/IMPLEMENTATION.md`
- `docs/manual/TESTING.md`
- `docs/manual/USER_MANUAL.md`
- `docs/manual/CLERC_MANUAL.md`
- `docs/manual/ADMIN_MANUAL.md`
- `infrastructure/DEPLOY.md`
