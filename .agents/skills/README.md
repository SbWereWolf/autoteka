# Codex repo skills

This directory is formatted for repo-local Codex skill discovery.

## Inventory

### Meta and utility skills

- `exec-plan`
- `preflight`
- `verify`
- `safe-commit`
- `coordinator`

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
- `coordinator` owns staged handoff between subagents through
  task artifacts when complex work must be split into requirements,
  tests, implementation, and documentation phases.
- Exactly one primary domain skill should own implementation unless the
  task genuinely spans multiple specializations.

## Inventory integrity rules

- Every skill named in root `AGENTS.md` must physically exist here.
- Every `SKILL.md` reference path must exist or be removed.
- Skill descriptions must be specific enough to route implicitly.
- Long standards belong in `references/`; reusable scaffolds belong in
  `assets/`.
- Agent-facing documents in this directory and in related agent
  configuration must be written in English.

## Practical routing hints

- `frontend/` runtime change -> `frontend`
- semantic/a11y/keyboard/focus work -> `layout-and-design`
- `backend/apps/*` or `backend/packages/*` -> `backend`
- `system-tests/` or cross-runtime behavior checks -> `system-tests`
- `infrastructure/` -> `infrastructure`
- `scripts/`, `.agents/`, `.codex/`, `lint/` -> `repo-tooling`
- docs/manuals/runbooks/implementation docs -> `tech-writer`
- staged multi-agent task with explicit handoff -> `coordinator` +
  `exec-plan` + one primary implementation skill per phase

## Verification reminder

Skill presence does not replace repo invariants. Root `AGENTS.md`
still owns:

- instruction precedence
- code-change loop
- verification contract
- commit policy
- forbidden paths
- environment readiness
