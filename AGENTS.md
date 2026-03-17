# AGENTS.md

## Language

The agent must write in Russian. Project text artifacts must also be
in Russian, except where standard English syntax is required for a
command, flag, API, filename, library, technology name, or where
English is explicitly required by this document.

If there is no loss of precision between a Russian and an English
formulation, the agent must choose Russian.

## Project map

Use these repository zones consistently:

- `frontend/` — Vue/Vite front office and frontend tests.
- `backend/apps/ShopAPI/` — API runtime.
- `backend/apps/ShopOperator/` — back office runtime.
- `backend/packages/SchemaDefinition/` — shared schema source of truth.
- `infrastructure/` — runtime, deploy, maintenance, observability.
- `system-tests/` — system and UI verification profiles.
- `docs/` and `README.md` — permanent documentation.
- `scripts/agent/` — mandatory repo automation entrypoints.
- `tasks/` — temporary task records for agent work only.

Before changing code, identify the primary zone and stay inside its
boundary rules.

## 1. Canonical Workflow (Mandatory)

Always follow this sequence:

1. preflight
2. plan when required
3. implement change
4. verify

Never bypass scripts under [scripts](scripts/agent/).

---

## 1.1 Structural Change Definition

A change is structural if it does at least one of the following:

- adds, removes, splits, or moves modules or packages;
- changes public contracts, schemas, routes, or integration
  boundaries;
- changes build, runtime, operational, or environment wiring;
- changes shared abstractions used by multiple areas of the system.

---

## 1.2 Planning trigger (mandatory)

The agent must load the `exec-plan` meta-skill before implementation
when at least one of the following is true:

- the change is structural;
- the task is ambiguous, multi-step, or cross-cutting;
- the task requires research or design before code changes;
- the task is expected to span multiple files, modules, or runtimes;
- the task changes requirements, public contracts, or test strategy;
- the user explicitly asks for planning, a plan, an ExecPlan, or a
  task breakdown.

For simple isolated low-risk edits, `exec-plan` is optional.

---

## 1.3 Task records location (mandatory)

When `exec-plan` is used, create or update a dedicated task folder
under:

- `tasks/<task-slug>/`

Use lowercase kebab-case for `<task-slug>`.

The task folder is the canonical location for planning records.
Required files are:

- `tasks/<task-slug>/PLAN.md` — the living execution plan;
- `tasks/<task-slug>/REQUIREMENTS.md` — required for code changes;
- `tasks/<task-slug>/TEST-SPEC.md` — required for code changes;
- `tasks/<task-slug>/DOC-IMPACT.md` — required when docs or related
  documents must be updated.

Optional files may be added only when they materially improve
traceability, for example research notes or validation logs.

Never commit `tasks/*`.

---

## 1.4 Code-change development loop (mandatory)

For any change that adds or modifies code, scripts, migrations,
queries, templates, or executable configuration in any language
(PHP, JS, SQL, Bash, PowerShell, and similar), follow this order:

1. define the behavior and constraints in
   `tasks/<task-slug>/REQUIREMENTS.md`;
2. define or update the relevant tests in
   `tasks/<task-slug>/TEST-SPEC.md`;
3. implement or stage the tests first;
4. run the target tests and confirm that at least one relevant test
   fails for the intended new behavior or bug fix;
5. implement the minimal code needed;
6. rerun the target tests until they pass;
7. update related documentation and record it in
   `tasks/<task-slug>/DOC-IMPACT.md`;
8. run repository verification.

If a true red-green cycle is not meaningful, not possible, or not
supported by the environment, the agent must record the reason in both
`PLAN.md` and `TEST-SPEC.md`, then use the strongest available
alternative such as characterization tests, smoke tests, contract
checks, or explicit manual verification steps.

Pure documentation-only tasks are excluded from this loop.

---

## 1.5 Environment and platform-artifact discipline (mandatory)

This repository uses explicit platform-state management through:

- `scripts/swap-env.ps1`
- `scripts/swap-env.sh`

The agent must not manually reshuffle platform-specific lockfiles,
`node_modules`, active `.env` files, or env-specific storage just to
"make verify pass" when the repository already provides a script.

Use `swap-env` for validation, save, and load operations. If the task
requires a different active env state, record that need explicitly in
`PLAN.md` when `exec-plan` is active.

When a task changes verification scripts, test runners, env files,
package manifests, or test configuration, treat that as a verification
surface change, not as a docs-only change.

---

## 2. Verification Policy

All changes must pass:

[verify](scripts/agent/verify.ps1):

```shell
pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal
```

`minimal` profile is the mandatory baseline quick gate and verifies:

- frontend unit tests (no browser)
- backend quick tests in [ShopAPI](backend/apps/ShopAPI)
- backend quick tests in [ShopOperator](backend/apps/ShopOperator)

Exit code != 0 = stop.

When `exec-plan` is active, run the strongest relevant verification
available after each meaningful milestone, not only at the very end.
Fix failures before continuing.

---

## 2.1 Verification Escalation

Use the default verification command for low-risk isolated changes.

Escalate verification to the strongest repository-supported level when
the change touches:

- database schema or migrations;
- authentication, authorization, or permissions;
- money flow, checkout, orders, or inventory consistency;
- shared packages or public contracts;
- deployment, runtime wiring, or environment configuration;
- cross-application integration points;
- test runners, test profiles, verification scripts, or test config.

If stronger automated verification is not available, state that
limitation explicitly in the final answer and record it in the active
`PLAN.md` when `exec-plan` is in use.

---

## 2.2 Target-test selection rules (mandatory)

`verify.ps1 -TestProfile minimal` is the minimum gate, not the full test
selection logic.

The agent must also run the most relevant direct checks for the changed
surface:

- `frontend/src`, `frontend/src/components`, `frontend/src/pages`,
  `frontend/src/router`, `frontend/src/state.ts` ->
  `npm --prefix frontend run test:unit`
- `frontend/src/api`, API client behavior, request/response handling ->
  `npm --prefix frontend run test:api:online` when backend availability
  is part of the change; otherwise document why online verification was
  not run
- frontend user flow, interaction structure, accessibility, or visual
  regression that depends on browser behavior ->
  `npm --prefix frontend run test:ui:mock` and escalate to
  `npm --prefix frontend run test:e2e` or the closest supported
  `system-tests` profile when same-origin integration matters
- `backend/apps/ShopAPI/**` ->
  `cd backend/apps/ShopAPI && php artisan test --parallel --processes=2`
- `backend/apps/ShopOperator/**` ->
  `cd backend/apps/ShopOperator && php artisan test --parallel --processes=2`
- `backend/packages/SchemaDefinition/**` or other shared backend package
  changes -> run tests in every affected runtime, at minimum both
  `ShopAPI` and `ShopOperator` when schema/contracts can propagate
- API contract, route, serialization, or HTTP behavior changes ->
  `npm --prefix system-tests run test:quick-local` or the closest
  supported `system-tests` profile
- `infrastructure/**` ->
  `npm --prefix infrastructure/tests test` and the smallest relevant
  runtime/system profile such as `npm --prefix system-tests run
  test:quick-dev`
- `system-tests/**`, `infrastructure/tests/**`, `frontend/tests/**`,
  `frontend/e2e/**`, `frontend/ui-mock/**`, `scripts/agent/**`,
  `lint/**`, or repository test configuration -> run the directly
  affected test or script entrypoint, not only `verify.ps1`

When several surfaces are touched, combine the relevant checks.

---

## 2.3 Minimal verify cache caveat (mandatory)

`verify.ps1 -TestProfile minimal` uses a source fingerprint cache stored
at `/.runtime/verify/minimal-src-cache.json` and only keys some quick
blocks by selected source trees.

Because of that, changes limited to tests, test configs, verification
scripts, env files, or related tooling may not force all quick blocks
to rerun.

Therefore, when the task changes:

- any test file;
- any test runner or test config;
- `scripts/agent/verify.*` or related repo verification scripts;
- env/config files that affect tests;

the agent must do both:

1. run the directly affected test or verification command;
2. avoid trusting a cache-hit-only result as the sole evidence.

Deleting `/.runtime/verify/minimal-src-cache.json` before the final
quick gate is allowed when the cache would otherwise hide a changed
verification surface.

---

## 2.4 Review tasks

For review-only tasks, use the relevant domain skill and follow:

- `docs/foundations/CODE_REVIEW.md`

Review conclusions must distinguish clearly between:

- correctness bugs;
- contract/regression risks;
- missing tests or weak evidence;
- missing documentation or broken traceability;
- optional cleanup.

---

## 3. Commit Policy

Create commits only when explicitly requested by the user.

If a commit is requested, it must be created only via:

```powershell
pwsh "scripts/agent/commit.ps1" `
    -Message "<a short summary of the changes>" `
    -Body "<Explain why the changes were made>" `
    -AISystemName "<AI system name>" `
    -LLMName "<LLM name>"
```

Requirements:

- Message <= 50 chars
- Body multiline (use `\n` as EOL), each line <= 72 chars

Never push to origin or other remotes.

---

## 4. Forbidden Paths

Never commit:

- `tasks/*`
- `inbox/*`

---

## 5. Multi-Agent Use

Large refactors must use subagents:

- `explorer` -> map impact
- `scribe` -> implement
- `verifier` -> gate
- `commit_curator` -> finalize

Keep subagents narrow and opinionated. Each subagent must have one
clear job and must not drift into adjacent work.

---

## 6. Output Discipline

Agents must:

- keep explanations brief and decision-relevant;
- prefer structured summaries;
- state blockers and verification results explicitly;
- use skills where applicable;
- avoid narrating routine tool calls;
- keep scope tight and avoid expanding the task surface;
- clearly label optional follow-up work instead of silently doing it.

After any write or update step, briefly restate:

- what changed;
- where it changed;
- what validation was performed.

---

## 7. Skill Routing

Before implementing any change, classify the task and load the
matching skill from [skills/](.agents/skills/).

Use exactly one primary skill unless the task clearly spans multiple
specializations. If multiple skills apply, choose one primary skill
and use others only for narrow subordinate parts.

### 7.1 Meta and utility skills

The following skills do not replace the required primary domain skill:

- `exec-plan` — planning and living task records for complex work;
- `preflight` — repository state snapshot and blocker detection;
- `verify` — deterministic verification gate;
- `safe-commit` — policy-compliant commit workflow.

If `exec-plan` is active, load it before the primary skill and keep the
active task folder current during the entire task.

### 7.2 Primary skills

- `frontend` — Vue 3.5+, Vite 5+, Tailwind 4.2+, component logic,
  composables, state, forms, client UI behavior.
- `layout-and-design` — semantic HTML, W3C/WHATWG, WCAG, ARIA,
  landmarks, headings, focus, contrast, target size, modal/dialog
  behavior.
- `backend` — Laravel 12+, PHP 8.2+, MoonShine 4.8+, ShopAPI,
  ShopOperator, shared business packages, tests, transactions,
  placement of backend logic.
- `infrastructure` — Ubuntu 24+, Bash, Docker, Docker Compose,
  deployment scripts, service wiring, runtime operations, environment
  configuration.
- `tech-writer` — docs, runbooks, manuals, IMPLEMENTATION, DEPLOY,
  USER/CLERK/ADMIN manuals, TESTING docs, cross-links between docs and
  checks.

### 7.3 Skill selection rules

- If the task changes markup semantics, accessibility, form UX,
  keyboard/focus behavior, use `layout-and-design`.
- If the task changes Vue components or frontend state, use
  `frontend` as the primary skill and `layout-and-design` only for the
  semantic/accessibility part.
- If the task changes backend business logic, package boundaries,
  runtime wiring inside Laravel, or API/back office behavior, use
  `backend`.
- If the task changes deploy/runtime scripts, docker/systemd,
  observability, maintenance, or repair, use `infrastructure`.
- If the task is documentation-first, runbook-first, or traceability
  work, use `tech-writer`.

### 7.4 Nested guidance

When working inside `frontend/`, `backend/`, `infrastructure/`,
`system-tests/`, or `docs/`, also follow the closer local `AGENTS.md`
file in that subtree if present.
