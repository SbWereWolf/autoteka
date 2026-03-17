---
name: exec-plan
description: Use for structural, ambiguous, cross-cutting, or multi-step work that needs a living execution plan and task records before and during implementation; especially for refactors, migrations, public contract changes, shared abstractions, and repository-wide work. Do not use for tiny isolated low-risk edits where a short inline plan is enough.
---

# Exec Plan

Use this as a planning meta-skill.

This skill does not replace the primary domain skill. It creates and
maintains the task records that govern complex work, then coordinates
with exactly one primary skill unless the repository instructions say
otherwise.

## Required deliverables

Create or update a dedicated task folder:

- `tasks/<task-slug>/PLAN.md`
- `tasks/<task-slug>/REQUIREMENTS.md` for code changes
- `tasks/<task-slug>/TEST-SPEC.md` for code changes
- `tasks/<task-slug>/DOC-IMPACT.md` when docs must change

Use lowercase kebab-case for `<task-slug>`.

## When to use

Use this skill when at least one of the following is true:

- the task is structural;
- the task is ambiguous or under-specified;
- the task spans multiple files, modules, or runtimes;
- the task requires research before code changes;
- the task changes requirements, contracts, or test strategy;
- the user explicitly asks for a plan, ExecPlan, planning workflow,
  or task breakdown.

## When not to use

Do not use this skill for:

- tiny isolated low-risk edits;
- obvious one-file fixes with no real design decisions;
- purely mechanical edits where a short inline plan is sufficient.

## Source of truth

`tasks/<task-slug>/PLAN.md` is the source of truth for the active task.
Keep it current.

When this skill is active, do not treat the plan as a static note. It
is a living execution record.

## Core rules

1. Keep the plan self-contained.
2. Write for a complete newcomer to the repository.
3. Explain jargon in plain language.
4. Start with user-visible purpose and observable outcomes before
   implementation detail.
5. Keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and
   `Outcomes & Retrospective` current.
6. Validate after each meaningful milestone.
7. Keep diffs scoped to the current milestone.
8. Update documentation continuously; do not leave it all for the end.
9. Use the repository test matrix and documentation map when choosing
   evidence and doc updates.

## Code-change loop

When the task changes code, scripts, migrations, queries, templates,
or executable configuration:

1. define requirements in `REQUIREMENTS.md`;
2. define tests in `TEST-SPEC.md`;
3. stage or write the tests first;
4. run the target tests and confirm a relevant failure exists before
   implementation, unless that is not meaningful or not supported;
5. implement the minimal change;
6. rerun tests until they pass;
7. update docs and record the doc impact;
8. run repository verification.

If a true red-green cycle is not possible, record the reason in both
`PLAN.md` and `TEST-SPEC.md` and use the strongest available
alternative.

## Clarification behavior

While drafting the plan, ask focused clarifying questions only when a
blocking product decision cannot be inferred from the prompt, repo, or
existing docs.

If enough context exists to draft a high-quality best-effort plan, do
so without waiting.

Once the user approves the plan or asks to implement it, do not ask for
"next steps". Continue milestone by milestone and keep the task records
current.

## Required sections in PLAN.md

`PLAN.md` must contain and maintain these sections:

- Title
- Purpose / Big Picture
- Context and Orientation
- Plan of Work
- Concrete Steps
- Validation and Acceptance
- Idempotence and Recovery
- Interfaces and Dependencies
- Progress
- Surprises & Discoveries
- Decision Log
- Outcomes & Retrospective

Use `assets/execplan-template.md` as the default scaffold.

## Section intent

### Purpose / Big Picture

State what the user will be able to do after the change and how success
can be observed.

### Context and Orientation

Explain the repository surfaces that matter. Use repository-relative
paths.

### Plan of Work

Describe the implementation narrative in prose. Say what changes,
where, and why.

### Concrete Steps

List exact commands, working directories, and concrete edits.

### Validation and Acceptance

Describe how to prove the change works with observable behavior.

### Idempotence and Recovery

State what can be repeated safely and how to recover from interrupted
or failed steps.

### Interfaces and Dependencies

Name the concrete interfaces, modules, files, scripts, libraries, or
services that matter.

### Progress

Use checkboxes only here. Record actual status, not intention.

### Surprises & Discoveries

Record findings that changed the implementation or validation path.

### Decision Log

Record important decisions and why they were made.

### Outcomes & Retrospective

Summarize what shipped, what remains, and what was learned.

## Writing style

- Prefer prose over bullet dumps.
- Be concrete.
- Do not rely on unstated prior context.
- Do not push key design decisions onto a future implementer when they
  can be resolved now.
- Keep the plan executable by a newcomer.

## References and templates

If any detail feels underspecified, consult these skill resources:

- `references/openai-execplan-reference.md`
- `references/plan-mode-vs-exec-plan.md`
- `references/repo-test-matrix.md`
- `references/repo-doc-map.md`
- `assets/execplan-template.md`
- `assets/requirements-template.md`
- `assets/test-spec-template.md`
- `assets/test-selection-template.md`
- `assets/doc-impact-template.md`
- `assets/doc-update-checklist.md`
- `assets/milestone-template.md`
- `assets/decision-log-entry.md`
- `assets/validation-log-template.md`
- `assets/research-notes-template.md`
- `assets/task-folder-layout.md`

## Completion standard

The task is complete only when:

- the task folder is current;
- `PLAN.md` matches reality;
- requirements, tests, and doc impact are documented where required;
- milestone validation has been run;
- repository verification has been run;
- the result is observably working or the remaining gap is documented
  honestly.
