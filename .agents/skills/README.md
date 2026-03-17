# Codex repo skills

This directory is formatted for repo-local Codex skill discovery.

## Inventory

### Meta and utility skills

- `exec-plan`
- `preflight`
- `verify`
- `safe-commit`

### Primary domain skills

- `frontend`
- `layout-and-design`
- `backend`
- `system-tests`
- `infrastructure`
- `repo-tooling`
- `tech-writer`

## Repository routing model

- `exec-plan` owns durable planning and task records under
  `tasks/<task-slug>/`.
- `preflight` snapshots repository state before structural or ambiguous
  work.
- `verify` owns the mandatory baseline gate plus direct-check
  discipline.
- `safe-commit` owns the commit-policy-compliant commit path.
- Exactly one primary domain skill should own implementation unless the
  task genuinely spans multiple specializations.

## Inventory integrity rules

- Every skill named in root `AGENTS.md` must physically exist here.
- Every `SKILL.md` reference path must exist or be removed.
- Skill descriptions must be specific enough to route implicitly.
- Long standards belong in `references/`; reusable scaffolds belong in
  `assets/`.

## Practical routing hints

- `frontend/` runtime change -> `frontend`
- semantic/a11y/keyboard/focus work -> `layout-and-design`
- `backend/apps/*` or `backend/packages/*` -> `backend`
- `system-tests/` or cross-runtime behavior checks -> `system-tests`
- `infrastructure/` -> `infrastructure`
- `scripts/`, `.agents/`, `.codex/`, `lint/` -> `repo-tooling`
- docs/manuals/runbooks/implementation docs -> `tech-writer`

## Verification reminder

Skill presence does not replace repo invariants. Root `AGENTS.md`
still owns:

- instruction precedence
- code-change loop
- verification contract
- commit policy
- forbidden paths
- environment readiness
