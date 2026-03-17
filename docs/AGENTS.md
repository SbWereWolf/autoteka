# Docs local instructions

These instructions refine the root `AGENTS.md` for `docs/`.

## Scope

Use `tech-writer` as the primary skill for docs-first tasks.

## Document families

- `docs/foundations/*` -> architecture, implementation, rule ownership,
  and engineering standards
- `docs/manual/*` -> operator, user, admin, and testing runbooks
- `docs/initial-requirements/*` -> historical requirement sources; do
  not silently rewrite intent without stating why
- `docs/prompt/*` -> prompt/reference material, not product docs
- `docs/research/*` -> exploratory notes only

## Rules

1. Keep each document on one axis: architecture, runbook, requirement
   history, or research.
2. Do not bury executable command changes in architecture prose.
3. When a doc claims a command, path, or observable behavior, verify it
   directly or state the limit explicitly.
4. Use `repo-doc-map.md` to choose which related docs must also change.
5. Docs-only work does not require a fake red-green cycle, but it still
   requires direct checks where the doc makes executable claims.
