---
name: backend
description: Use this skill for backend application and package changes in PHP or related backend runtime surfaces, especially under backend/apps/ShopAPI, backend/apps/ShopOperator, backend/packages, backend routes, controllers, services, policies, jobs, events, database, API contracts, and backend tests.
---

# Backend skill

Use this skill for backend changes in PHP and adjacent backend surfaces.

Typical scope:

- `backend/apps/ShopAPI/**`
- `backend/apps/ShopOperator/**`
- `backend/packages/**`
- backend routes, controllers, requests, policies, services, jobs,
  listeners, events, DTOs, resources, migrations, seeders, and CLI
  commands;
- backend contracts consumed by frontend, system tests, or external
  integrations.

Do not use this skill as a substitute for the `exec-plan` meta-skill
when the task is structural, ambiguous, cross-cutting, or multi-step.

## Standards and references

Use this skill together with:

- `docs/foundations/backend-standard.md` — stable backend conventions,
  architecture preferences, contract discipline, and anti-pattern
  guidance.
- `.agents/skills/backend/references/backend-standard.md` —
  repository-specific backend stack, code-placement defaults,
  implementation examples, and testing guidance.

The foundations document defines stable domain-level backend
conventions. The local reference adds repository-specific operational
backend guidance and examples. These documents support this skill but 
do not override:
1. root `AGENTS.md`;
2. the nearest nested `AGENTS.md`;
3. explicit verification, commit, task-record, or code-change-loop
   rules.

## Implementation focus

When using this skill:

1. identify the backend application or package that owns the changed
   behavior;
2. keep changes aligned with the nearest nested `AGENTS.md`;
3. preserve public contracts unless the task explicitly changes them;
4. prefer the narrowest safe change before broad refactoring;
5. keep tests and related documentation aligned with code, but obey the root and coordinator phase rules before editing tests.

When the `coordinator` skill is active, this domain skill does not
override phase write authority. If the active phase forbids test edits,
do not modify tests in that phase; record the required follow-up in the
task artifacts instead.

## Test selection

Choose direct checks that match the changed backend surface instead of
assuming the baseline gate is sufficient.

At minimum:

- for `backend/apps/ShopAPI/**`, run the relevant ShopAPI tests;
- for `backend/apps/ShopOperator/**`, run the relevant ShopOperator
  tests;
- for shared package changes under `backend/packages/**`, run the
  package-adjacent tests plus every affected application-level test set;
- for migrations, schema, policies, permissions, money flow, orders,
  inventory, or public contracts, escalate to the strongest repository-
  supported backend checks.

Use repo-native commands from:

- `docs/manual/TESTING.md`
- the nearest nested `AGENTS.md`
- `.agents/skills/exec-plan/references/repo-test-matrix.md`

Always keep the distinction clear:

- baseline gate = mandatory minimum;
- direct backend checks = mandatory proof for the changed behavior.

## Documentation impact

When backend behavior, contracts, configuration, or operator workflows
change, review and update the related documentation.

Typical documentation impact includes:

- API behavior or request/response contracts;
- operator-facing workflows;
- environment and configuration notes;
- migration or rollout notes;
- troubleshooting and verification instructions;
- task records under `tasks/<task-slug>/` when `exec-plan` is active.

Use:

- `tasks/<task-slug>/DOC-IMPACT.md` when `exec-plan` is active;
- `.agents/skills/exec-plan/references/repo-doc-map.md`;
- the nearest nested `AGENTS.md`;
- `docs/foundations/backend-standard.md` for stable backend
  conventions.

Do not mark the task complete while backend-facing documentation drift
remains unresolved.
