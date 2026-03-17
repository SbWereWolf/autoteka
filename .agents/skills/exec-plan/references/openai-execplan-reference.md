# OpenAI ExecPlan reference (adapted for this repository)

This file is a repository-local reference derived from OpenAI guidance
about `PLANS.md` / ExecPlans. It is intentionally adapted and
paraphrased for skill use in this repo instead of copied verbatim.

## What an ExecPlan is

An ExecPlan is an executable design-and-delivery document for a single
substantial task. It is not a rough note and not just a checklist. A
coding agent must be able to use the current working tree and this one
plan document to deliver a working result even if it has no memory of
past work.

That means the plan must be self-contained, current, and specific. It
must explain the user-visible purpose of the change, the repository
surfaces involved, the exact work to be done, and the evidence that the
result works.

## Why a plan exists

For long-running or multi-step work, the model needs something more
precise than a one-shot prompt. The plan acts as:

- the source of truth for scope and sequence;
- the shared memory for decisions and discoveries;
- the restart point if work pauses or shifts between agents;
- the audit log that explains why the implementation took a certain
  path.

A good ExecPlan reduces drift, reduces guesswork, and makes it easier
for a human reviewer to see what the agent intends to do before and
while code changes happen.

## Non-negotiable properties

### 1. Self-contained

The plan must include all information that a capable newcomer needs in
order to execute the task. Do not assume prior context, hidden team
knowledge, or memory of earlier plans. If a fact matters to execution,
state it in the plan.

### 2. Living document

The plan must be updated as the work advances. The plan is not written
once and abandoned. Progress, decisions, discoveries, validation, and
remaining work must stay aligned with reality.

### 3. Newcomer-friendly

Write as if the reader has never seen this repository before. Use full
repository-relative paths. Explain non-obvious terms. Say where code
lives and why.

### 4. Oriented to observable outcomes

The plan must describe what the user will be able to observe when the
change is done. Avoid defining success as “the code compiles” or “a
struct exists”. Define success as behavior that can be seen, tested, or
otherwise demonstrated.

### 5. Plain-language definitions

If the plan uses a domain term, internal shorthand, or unfamiliar
technical expression, explain it plainly and tie it to concrete files,
modules, commands, or behaviors in this repo.

### 6. Purpose before mechanism

Start with the user-visible goal. Only then explain the code path,
files, and implementation steps. This keeps the plan anchored to the
actual value of the change instead of to an arbitrary code diff.

### 7. No hidden dependencies on external text

Do not send the future implementer away to read blog posts or docs in
order to understand the plan. External references can support the work,
but the key operational knowledge has to be restated in the plan.

## How to author an ExecPlan

Start from a template and fill it with repository-specific reality.
Read the relevant source files carefully. If the task has uncertainty,
research first and capture the conclusions inside the plan. If major
technical feasibility is unknown, create a prototype milestone to prove
or disprove the approach early.

A well-authored plan does not stop at naming files. It explains the
responsibility boundaries between modules, where the behavior belongs,
and why that placement is correct.

## How to implement from an ExecPlan

Once implementation starts, the plan becomes the runbook. Do not stop
merely because one milestone is done. Proceed to the next milestone and
keep the plan current. If reality changes, update the plan before or at
the same time as the code so the plan never becomes stale.

Every meaningful stop point must leave the plan in a restartable state.
That means:

- `Progress` reflects exactly what is done and what remains;
- `Decision Log` explains any non-obvious turns;
- `Surprises & Discoveries` records facts found during work that affect
  design, scope, or validation;
- `Outcomes & Retrospective` tells the truth about what shipped and
  what did not.

## How to discuss an ExecPlan with the user

During planning, clarifying questions are valid when a blocking product
or scope decision cannot be inferred from the prompt, repository, or
existing docs. But questions should be focused and necessary. The plan
should capture the answers so the next session does not need the same
conversation again.

Once the user has approved the plan or has asked to implement it, the
agent should not keep asking for “next steps”. The plan itself defines
those next steps.

## Recommended structure of the plan

### Title

Name the concrete change in action-oriented language.

### Purpose / Big Picture

Explain the end-user effect and how success will be observed.

### Context and Orientation

Explain the relevant codebase surfaces, terms, and boundaries. Use full
paths.

### Plan of Work

Give the implementation narrative. Explain the sequence of changes and
why that sequence makes sense.

### Concrete Steps

Provide exact commands, working directories, and concrete edits. Keep
steps copy-pasteable where possible.

### Validation and Acceptance

Describe how to demonstrate success. Include tests, runtime checks,
smoke steps, or request/response examples as appropriate.

### Idempotence and Recovery

State what can be rerun safely and how to recover from partial failure,
interrupted migrations, or other mid-flight issues.

### Interfaces and Dependencies

Name the files, modules, interfaces, scripts, APIs, services, or
libraries that matter. Be explicit, not hand-wavy.

### Progress

Track granular work items with checkboxes. This is the only section
where checklists should dominate.

### Surprises & Discoveries

Record important findings that were not obvious at the start and that
changed the plan or the implementation.

### Decision Log

Record major decisions and the reasoning behind them. This prevents the
same questions from being reopened without context.

### Outcomes & Retrospective

At milestone completion or task completion, summarize what shipped,
what remains, and what was learned.

## Style rules

Prefer narrative prose over giant bullet dumps. Use bullets only where
they materially improve precision. Avoid vague statements like “update
the backend accordingly”. Name the file, the module, the interface, and
the behavior.

Keep commands exact. Include the working directory when it matters.
Include expected output or success conditions when they help a newcomer
distinguish success from failure.

## Validation discipline

Validation is part of the plan, not an afterthought. For meaningful
changes, validation should happen after milestones, not only at the
end. A good plan includes both narrow checks for the changed behavior
and the repository-level verification gate.

For internal-only changes, the plan must still explain how the effect
will be demonstrated. If the only reliable evidence is automated tests,
state which tests and what they prove.

## Prototypes and exploratory milestones

When feasibility is uncertain, add a prototype milestone. Keep it
small, bounded, and testable. A prototype is acceptable when it reduces
risk for the final implementation. The plan should say what success or
failure of the prototype means for the next step.

Parallel or temporary implementations are also acceptable when they
reduce migration risk. If two paths coexist temporarily, the plan must
explain how to validate each path and how the obsolete path will later
be removed safely.

## Relationship to this repository

In this repository, the living plan belongs in `tasks/<task-slug>/` and
works together with:

- `PLAN.md` for the execution narrative and ongoing status;
- `REQUIREMENTS.md` for behavior and constraints;
- `TEST-SPEC.md` for the red-green test path or justified alternative;
- `DOC-IMPACT.md` for documentation changes.

This adds one extra layer beyond the original OpenAI article: code
changes must also pass through a requirements → tests → failing test →
implementation → passing test → docs loop where the environment makes
that meaningful.
