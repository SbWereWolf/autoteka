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

## Implementation focus

When using this skill:

1. identify the backend application or package that owns the changed
   behavior;
2. keep changes aligned with the nearest nested `AGENTS.md`;
3. preserve public contracts unless the task explicitly changes them;
4. prefer the narrowest safe change before broad refactoring;
5. update tests and related documentation together with code.

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
- the nearest nested `AGENTS.md`.

Do not mark the task complete while backend-facing documentation drift
remains unresolved.
