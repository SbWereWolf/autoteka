# AGENTS.md

## Language

The agent must write in Russian. Project text artifacts must also be
in Russian, except where standard English syntax is required for a
command, flag, API, filename, library, technology name, or where
English is explicitly required by this document.

If there is no loss of precision between a Russian and an English
formulation, the agent must choose Russian.

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

## 2. Verification Policy

All changes must pass:

[verify](scripts/agent/verify.ps1):

```shell
pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal
```

`minimal` profile is quick and must verify:

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
- cross-application integration points.

If stronger automated verification is not available, state that
limitation explicitly in the final answer and record it in the active
`PLAN.md` when `exec-plan` is in use.

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

- `explorer` → map impact
- `scribe` → implement
- `verifier` → gate
- `commit_curator` → finalize

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
- If the task changes Vue/Tailwind/client code, use `frontend`.
- If the task changes PHP/Laravel/MoonShine/API/business
  logic/tests/migrations, use `backend`.
- If the task changes Docker/Compose/Bash/runtime config/ops scripts,
  use `infrastructure`.
- If the task changes documentation structure, manuals, runbooks,
  implementation docs, infra docs, or test-case linking, use
  `tech-writer`.

### 7.4 Boundary rules

- Do not use `frontend` for backend or infrastructure work.
- Do not use `layout-and-design` as a substitute for frontend
  component architecture.
- Do not use `backend` for infrastructure-only tasks.
- Do not use `tech-writer` for code implementation unless the task is
  explicitly documentation-first.
- Do not load all skills by default.

### 7.5 Priority when task spans multiple areas

Use this priority order to choose the primary skill:

1. `tech-writer` for documentation deliverables
2. `infrastructure` for runtime and operational changes
3. `backend` for server/business changes
4. `frontend` for client implementation
5. `layout-and-design` for semantic/a11y refinement

When a task spans code + docs, implement with the code skill first and
use `tech-writer` only for the documentation part. When a task spans
frontend + accessibility, use `frontend` as primary and
`layout-and-design` for markup/a11y decisions.

---

## 8. Conflict Resolution

If a skill instruction conflicts with this file:

1. safety and repository constraints from this file win;
2. verification and commit rules from this file win;
3. task-record and code-change-loop rules from this file win;
4. domain-specific implementation rules come from the selected skill.

---

## 9. Script exit codes policy (mandatory)

- 0 = ok
- 1 = error
- 2 = arguments validation failed
- 3 = missing dependency

---

## 10. Environment setup policy

If something required for the task is missing from the environment, do
not search for workarounds and do not substitute other tools.

Instead, clearly tell the user what must be installed or configured,
provide exact steps, and stop until the user confirms the environment
is ready.
