# AGENTS.md

Fallbacks and defaults mask configuration problems: the real value 
stays hidden until inspected in code, complicates debugging, and 
leads to unpredictable behavior. If a value is required, fail 
explicitly (e.g. exit 3) with a clear message instead.

MANDATORY !! NEVER .env.example, ALWAYS example.env

## Language

The agent must write in Russian. Project text artifacts must also be
in Russian, except where standard English syntax is required for a
command, flag, API, filename, library, technology name, or where
English is explicitly required by this document.

If there is no loss of precision between a Russian and an English
formulation, choose Russian.

## 0. Instruction layering and precedence

This root file defines repository-wide invariants.

Instruction order:

1. this root `AGENTS.md`;
2. the nearest relevant nested `AGENTS.md`;
3. the selected skill;
4. supporting references.

If two instructions conflict, prefer the more specific one unless it
would violate an explicit root invariant.

When a skill instruction conflicts with this root file:

1. safety and repository constraints from this file win;
2. verification and commit rules from this file win;
3. task-record and code-change-loop rules from this file win;
4. domain-specific implementation rules come from the selected skill
   and the nearest relevant nested `AGENTS.md`.

For the ruleset architecture, see:

- `docs/foundations/AGENT_RULES_ARCHITECTURE.md`

## 1. Canonical workflow (mandatory)

Always follow this sequence:

1. preflight
2. plan when required
3. implement change
4. review own diff
5. verify

Never bypass scripts under `scripts/agent/` when a repository script for
that phase exists.

### 1.1 When planning is mandatory

Load the `exec-plan` meta-skill before implementation when at least one
of the following is true:

- the change is structural;
- the task is ambiguous, multi-step, or cross-cutting;
- the task requires research or design before code changes;
- the task is expected to span multiple files, modules, or runtimes;
- the task changes requirements, public contracts, or test strategy;
- the task changes documentation across more than one document family;
- the user explicitly asks for planning, a plan, an ExecPlan, or a
  task breakdown.

A change is structural if it changes module boundaries, public
contracts, schemas, routes, integration boundaries, build/runtime
wiring, shared abstractions, agent tooling, repository workflow, or
verification logic.

For simple isolated low-risk edits, `exec-plan` is optional.

### 1.2 Task records (mandatory when `exec-plan` is active)

Create or update a dedicated task folder under:

- `tasks/<task-slug>/`

Use lowercase kebab-case for `<task-slug>`.

Required files:

- `tasks/<task-slug>/PLAN.md` — the living execution plan;
- `tasks/<task-slug>/REQUIREMENTS.md` — required for code changes;
- `tasks/<task-slug>/TEST-SPEC.md` — required for code changes;
- `tasks/<task-slug>/DOC-IMPACT.md` — required when docs or related
  documents must be updated.

Optional files are allowed only when they materially improve
traceability, for example research notes or validation logs.

Never commit `tasks/*`.

### 1.3 Code-change loop (mandatory)

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
8. run repository verification and direct checks.

If a true red-green cycle is not meaningful, not possible, or not
supported by the environment, record the reason in both `PLAN.md` and
`TEST-SPEC.md`, then use the strongest available alternative such as
characterization tests, smoke tests, contract checks, or explicit
manual verification steps.

Pure documentation-only tasks are excluded from this loop.

### 1.4 Environment readiness

If something required for the task is missing from the environment, do
not invent workarounds and do not silently substitute other tools.

Instead, the agent must:

1. state exactly what dependency, service, credential, binary, or
   configuration is missing;
2. provide exact setup steps when they are known from the repository or
   from already-available instructions;
3. stop any blocked execution path until the user confirms the
   environment is ready.

The agent may still perform non-blocked analysis, planning, diff review,
or documentation work that does not depend on the missing requirement,
but must not pretend that verification or execution succeeded.

## 2. Verification contract

### 2.1 Mandatory baseline gate

All non-trivial changes must pass this baseline gate:

```powershell
pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal
```

Treat this command as a mandatory baseline gate, not as proof that all
relevant surfaces were fully checked.

Current minimal-profile behavior:

- validates platform artifacts via `scripts/swap-env.ps1`;
- runs frontend quick unit tests from `frontend`;
- runs quick backend tests in `backend/apps/ShopAPI`;
- runs quick backend tests in `backend/apps/ShopOperator`;
- uses a local cache based on selected source trees.

It does **not** provide a generic repository-wide lint pass and does
**not** directly cover `system-tests/`, `infrastructure/tests/`, docs,
or most repository tooling surfaces.

Exit code != 0 = stop.

### 2.2 Direct checks are also mandatory

In addition to the baseline gate, run the strongest relevant direct
checks for the changed surface.

Use repo-native commands from:

- `docs/manual/TESTING.md`
- `.agents/skills/exec-plan/references/repo-test-matrix.md`
- the nearest nested `AGENTS.md`

Rules:

- baseline gate alone is never enough for surfaces outside its direct
  coverage;
- `system-tests/`, `scripts/agent/*`, `.agents/`, `.codex/`,
  `infrastructure/tests/`, and behavior-heavy doc changes always need
  direct checks;
- when observable runtime behavior changed, include at least one check
  that proves that behavior directly.

### 2.3 Verification escalation

Escalate verification to the strongest repository-supported level when:

- database schema or migrations changed;
- authentication, authorization, or permissions changed;
- money flow, checkout, orders, or inventory consistency changed;
- shared packages or public contracts changed;
- deployment, runtime wiring, or environment configuration changed;
- cross-application integration points changed;
- verification tooling or agent scripts changed.

If stronger automated verification is unavailable, state that
limitation explicitly in the final answer and record it in the active
`PLAN.md` when `exec-plan` is in use.

### 2.4 Cache awareness

`verify.ps1 -TestProfile minimal` uses a quick-cache keyed only to
selected source trees. At minimum, it directly tracks:

- `frontend/src`
- `backend/apps/ShopAPI/app`
- `backend/apps/ShopOperator/app`
- `backend/packages/SchemaDefinition/src`

Therefore changes in tests, docs, scripts, env/config, runtime wiring,
or verification code can leave the baseline gate looking greener than
it really is.

When the task touches surfaces outside the tracked trees, direct checks
are mandatory and must be called out explicitly.

### 2.5 Script exit codes policy

When repository or agent scripts define exit codes, interpret them as 
a contract. The default policy is:

- `0` = ok
- `1` = error
- `2` = arguments validation failed
- `3` = missing dependency

If a script documents a more specific exit-code mapping, follow the
script-specific contract and report it accurately.

Never treat a non-zero exit code as success, partial success, or a
warning-only condition unless the script documentation explicitly says
so.

## 3. Commit policy

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

- message <= 50 chars;
- body multiline (use `\n` as EOL), each line <= 72 chars.

Never push to origin or other remotes.

## 4. Forbidden paths

Never commit:

- `tasks/*`
- `inbox/*`
- *.env

## 5. Multi-agent use

Large refactors must use subagents:

- `explorer` -> map impact and instruction layers;
- `scribe` -> implement scoped milestone work;
- `verifier` -> run baseline + direct checks and report blockers;
- `commit_curator` -> finalize only when a commit was requested.

Keep subagents narrow and opinionated. Each subagent must have one
clear job and must not drift into adjacent work.

## 6. Output discipline

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

## 7. Skill routing

Before implementation, classify the task and load the matching skill
from `.agents/skills/`.

Use exactly one primary skill unless the task clearly spans multiple
specializations. If multiple skills apply, choose one primary skill and
use others only for narrow subordinate parts.

### 7.1 Meta and utility skills

These skills do not replace the required primary domain skill:

- `exec-plan` — planning and living task records for complex work;
- `preflight` — repository state snapshot and blocker detection;
- `verify` — baseline gate plus direct-check discipline;
- `safe-commit` — policy-compliant commit workflow.

If `exec-plan` is active, load it before the primary skill and keep the
active task folder current during the entire task.

### 7.2 Primary skills

- `frontend` — frontend logic, composables, state, forms, UI behavior,
  frontend tests;
- `layout-and-design` — semantics, accessibility, keyboard/focus,
  modal/dialog behavior, UX-sensitive markup;
- `backend` — Laravel/PHP runtime code, business logic, shared backend
  packages, transactions, backend tests;
- `system-tests` — end-to-end, HTTP smoke, Playwright/Vitest scenarios,
  cross-runtime behavior checks;
- `infrastructure` — Docker, Compose, deployment scripts, service
  wiring, runtime operations, environment configuration;
- `repo-tooling` — repository scripts, `scripts/agent`, lint/tooling,
  Codex skills, subagent configs, workflow mechanics;
- `tech-writer` — docs, runbooks, manuals, implementation/deploy/user
  docs, testing docs, cross-links.

### 7.3 Selection rules

- If the task changes markup semantics, accessibility, form UX, or
  keyboard/focus behavior, use `layout-and-design` as the primary skill
  when semantics drive the task; otherwise use it as a subordinate
  frontend aid.
- If the task changes `system-tests/`, use `system-tests`.
- If the task changes `scripts/`, `.agents/`, `.codex/`, `lint/`, or
  repository workflow mechanics, use `repo-tooling`.
- If the task changes `docs/` or `*_MANUAL.md`, use `tech-writer`
  unless the main task is code and docs are only a required follow-up.
- If the task changes both runtime code and system behavior assertions,
  choose the runtime skill as primary and use `system-tests` only for
  the narrow verification part.

## 8. Self-review requirements

Before reporting completion, review the diff against:

- `docs/foundations/CODE_REVIEW.md`

Explicitly check for:

- wrong skill selection or missing `exec-plan`;
- missing direct checks for the changed surface;
- stale docs or stale task records;
- path or command references that no longer match the repo;
- accidental widening of scope.
