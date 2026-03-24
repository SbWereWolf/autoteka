---
name: coordinator
description: Use this meta-skill for staged multi-agent work where requirements, test authoring, implementation, review, remediation, and documentation updates must be handed off between subagents through task files in tasks/<task-slug>/ rather than through shared conversational memory.
---

# Coordinator

Use this meta-skill for multi-phase, cross-domain, or dependency-ordered
work where several subagents must operate in sequence.

This skill does not replace:

- `preflight`
- `exec-plan`
- one primary domain skill
- `verify`

The coordinator owns phase order, artifact-based handoff discipline, and
the final synthesis of results. The task folder is the source of truth,
not conversational memory.

## When to use

Use this skill when at least one of the following is true:

- the task touches more than one implementation area;
- requirements, tests, implementation, and documentation are better
  separated into distinct phases;
- one phase depends on verified outputs from another phase;
- a subagent context should be safely discarded after each phase;
- the user explicitly asks for coordination between subagents or a
  staged delivery pipeline.

Do not use this skill for a small change inside a single surface.

## Mandatory companions

When this skill is active:

1. run `preflight` for structural or ambiguous work;
2. activate `exec-plan` and keep the task folder current;
3. select one primary domain skill for each implementation phase;
4. use `verify` after each meaningful milestone and at the end.

## Coordination model

The coordinator must not pass free-form chat history between phases.
Instead, each phase receives only:

- its purpose;
- allowed repository surfaces;
- mandatory input artifacts;
- mandatory output artifacts;
- exit criteria for that phase;
- already accepted decisions and explicit open questions.

After each phase the coordinator must:

1. verify that mandatory outputs exist and do not contradict each other;
2. record the result in `PLAN.md` and `HANDOFFS.md`;
3. decide whether the next phase may start;
4. pass forward only approved task artifacts.

## Mandatory task artifacts

In addition to the task records already required by root `AGENTS.md`,
maintain:

- `tasks/<task-slug>/HANDOFFS.md`
- `tasks/<task-slug>/FINAL-REPORT.md`

Use these additional artifacts only when they materially improve
traceability:

- `tasks/<task-slug>/AREAS.md`
- `tasks/<task-slug>/tests/<area>.md`
- `tasks/<task-slug>/implementation/<area>.md`
- `tasks/<task-slug>/validation/<area>.md`
- `tasks/<task-slug>/REVIEW.md`
- `tasks/<task-slug>/REFACTOR-REQS.md`

## Surface classes and phase write authority

Treat repository surfaces as belonging to one of these classes:

- **test surfaces** — automated tests, fixtures, mocks, test harnesses,
  test-only configs, and `system-tests/**`;
- **production/runtime surfaces** — application code, shared runtime
  packages, runtime configs, infra configs, migrations, scripts, and
  executable wiring used by the shipped system;
- **documentation surfaces** — manuals, runbooks, usage docs, and other
  human-facing documentation outside the task folder;
- **task artifacts** — files under `tasks/<task-slug>/`.

The coordinator must assign and enforce phase-specific write authority:

- Phase 0 and Phase 1 -> task artifacts only;
- Phase 2 -> test surfaces + task artifacts only;
- Phase 3 -> production/runtime surfaces + task artifacts only;
- Phase 4 -> task artifacts only, with repository code/tests/configs/docs
  treated as read-only;
- Phase 5 -> only the exact surfaces required by approved review
  findings, plus task artifacts;
- Phase 6 -> documentation surfaces + task artifacts only;
- Phase 7 -> task artifacts only.

If a phase discovers a required change outside its write authority, do
not make the change silently. Record the needed follow-up or exception
in `PLAN.md` and `HANDOFFS.md`.

## Default phase pipeline

If the real dependency graph differs, adapt the pipeline and record that
decision explicitly in `PLAN.md`.

### Phase 0 — problem analysis and planning

Goals:

- check the request for clarity, completeness, consistency, and
  verifiability;
- identify blockers, assumptions, and likely change areas;
- define implementation order.

Inputs:

- the user request;
- root and nearest nested `AGENTS.md`;
- relevant skill docs.

Outputs:

- `PLAN.md`
- `HANDOFFS.md`
- `AREAS.md` when there are multiple change areas

### Phase 1 — requirement formalization

Typical subagent role: `explorer` or a narrowly scoped `scribe`.

Outputs:

- `REQUIREMENTS.md`

Each requirement entry should contain:

- a stable requirement ID;
- the expected behavior statement;
- the affected area;
- the verification method;
- dependencies or ordering notes.

### Phase 2 — test authoring and failing-signal establishment

Typical subagent role: `scribe` working with `verify` guidance or the
`system-tests` domain skill when the authored tests are end-to-end.

Allowed writes:

- test surfaces;
- `TEST-SPEC.md`;
- `tests/<area>.md`;
- other task artifacts.

Forbidden writes:

- production/runtime code, configs, migrations, or docs outside the
  task folder.

Outputs:

- `TEST-SPEC.md`;
- updated or newly authored repository tests for the covered areas;
- `tests/<area>.md` for each significant area when useful;
- a recorded failing signal or a documented reason why a true red/green
  cycle is not meaningful or not supported.

For each requirement record:

- direct checks;
- the relationship to the baseline gate;
- the expected red/green path when meaningful;
- environment limits or substitute checks when a real red/green cycle
  is not possible.

### Phase 3 — implementation by area

Use a separate implementation subagent in a fresh context for each area
when the work is truly separable.

Typical areas:

- `layout-and-design`
- `frontend`
- `backend`
- `infrastructure`
- `repo-tooling`

Each implementation phase receives only its own inputs and minimal notes
about cross-area dependencies.

Allowed writes:

- production/runtime/config surfaces for the owned area;
- `implementation/<area>.md`;
- `validation/<area>.md`;
- other task artifacts.

Forbidden writes:

- tests, fixtures, mocks, harnesses, `system-tests/**`, and other test
  surfaces.

Expected outputs for an area:

- scoped code or config changes;
- `implementation/<area>.md`;
- `validation/<area>.md`;
- handoff notes for downstream areas.

Rules:

1. strictly follow the root code-change loop and its test-edit
   restrictions;
2. a failing test is not, by itself, justification to edit the test;
   prefer repairing the implementation first;
3. do not start a dependent area until its prerequisite phase is marked
   `done`, unless an exception is recorded in `PLAN.md`;
4. keep each subagent inside its own area unless the plan explicitly
   widens that scope.

Default order when the task does not define a better one:

1. `layout-and-design`
2. `frontend` and `backend`
3. `infrastructure`
4. `repo-tooling`

### Phase 4 — change review

Typical subagent role: `reviewer` or `explorer` operating in read-only
mode.

Allowed writes:

- `REVIEW.md`;
- `REFACTOR-REQS.md`;
- `HANDOFFS.md`;
- `PLAN.md` status updates.

Forbidden writes:

- repository code, tests, configs, migrations, scripts, or docs.

Outputs:

- `REVIEW.md` with structured findings, evidence, and severity;
- `REFACTOR-REQS.md` with explicit remediation items and affected
  surfaces;
- a decision on whether remediation is required before the task may
  proceed.

Review findings must use stable IDs and state:

- evidence reference;
- affected surface class;
- required action;
- whether the item blocks completion.

### Phase 5 — refactor and review remediation

Typical subagent role: `scribe` with the owning domain skill.

Allowed writes:

- only the repository surfaces needed to satisfy approved review
  findings or documented exceptions;
- task artifacts.

Rules:

1. every code or test edit must reference a review finding ID or an
   approved exception recorded in `PLAN.md`;
2. do not widen the scope beyond review remediation;
3. rerun the strongest relevant verification after each meaningful
   remediation milestone.

Outputs:

- remediation changes tied to review finding IDs;
- updated `implementation/<area>.md` or `validation/<area>.md` when
  needed;
- updated `REVIEW.md` / `REFACTOR-REQS.md` status.

### Phase 6 — documentation and operator-facing updates

Typical subagent role: `tech-writer` or the owning implementation skill
when the documentation is tightly coupled to the change.

Outputs:

- updated docs and runbooks;
- updated `DOC-IMPACT.md`;
- update and usage instructions when behavior or deployment changed.

### Phase 7 — final synthesis

The coordinator produces `FINAL-REPORT.md`.

The report must explicitly state:

- which requirements were implemented;
- which requirements were not implemented;
- why anything remains incomplete;
- which tests and checks support the result;
- which docs were updated;
- how to update or operate the system after the change;
- what changed in the internal system design;
- which review findings were resolved or intentionally deferred.

## Handoff protocol

Append each handoff to `HANDOFFS.md` using the template from `assets`.

Do not pass only a prose summary. Always pass concrete artifact paths.

Mandatory handoff fields:

- from phase / role;
- to phase / role;
- purpose;
- input artifacts;
- output artifacts expected;
- allowed surface classes or paths;
- forbidden surface classes or paths;
- fixed decisions;
- open questions;
- risks or blockers;
- exit criteria;
- status.

## Final report contract

`FINAL-REPORT.md` is the user-facing synthesis artifact inside the task
folder. It should be concise, evidence-based, and scoped to the actual
change.

It must contain:

- the implemented requirements with evidence references;
- unimplemented requirements with reasons;
- documentation and config updates;
- operator guidance;
- internal-design impact;
- review and remediation summary;
- known limitations or deferred work.

## Verification discipline

The coordinator does not weaken repository verification rules.

Rules:

- every meaningful implementation or remediation milestone must be
  followed by the strongest relevant verification available at that
  point;
- the review phase must remain read-only for repository surfaces;
- the final state must still pass the baseline gate and all mandatory
  direct checks;
- if verification is blocked by the environment, record the blocker
  precisely in `PLAN.md`, `TEST-SPEC.md`, and `FINAL-REPORT.md`.

## Routing guidance

Use `coordinator` together with `exec-plan` when the task is staged and
multi-agent.

Then route each implementation phase to exactly one owning domain skill
unless the phase is genuinely cross-domain.

Typical combinations:

- product/UI change across design, frontend, and backend ->
  `coordinator` + `exec-plan` + `layout-and-design`/`frontend`/`backend`
  + `reviewer`
- delivery or platform change spanning app code and infra ->
  `coordinator` + `exec-plan` + `backend`/`infrastructure` + `reviewer`
- repo workflow or tooling change with documentation impact ->
  `coordinator` + `exec-plan` + `repo-tooling` + `tech-writer`
  + `reviewer`

## Anti-patterns

Do not use this skill to:

- avoid selecting an owning implementation skill;
- preserve huge chat transcripts as the handoff mechanism;
- merge requirement writing, test authoring, implementation, review,
  remediation, and documentation into an untracked blob of work;
- edit tests during Phase 3 or production/runtime code during Phase 2
  without a recorded exception;
- skip the repository code-change loop or verification contract.
