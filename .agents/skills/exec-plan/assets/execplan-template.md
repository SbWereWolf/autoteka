# <Task title>

> Living document. Keep `Progress`, `Surprises & Discoveries`,
> `Decision Log`, and `Outcomes & Retrospective` current.

## Purpose / Big Picture

Describe what the user will be able to do after this change and how the
result will be observed.

## Context and Orientation

Explain the relevant repository areas for a newcomer.

- Path: `<repo-relative-path>` — what lives here and why it matters
- Path: `<repo-relative-path>` — what lives here and why it matters

Define any non-obvious terms used below.

## Plan of Work

Write the implementation narrative in prose.

## Concrete Steps

1. From `<working-directory>`, run `<command>` to establish the current
   baseline.
2. Edit `<repo-relative-path>` to change `<behavior>`.
3. Edit `<repo-relative-path>` to add or update `<tests>`.
4. Update related docs listed in `DOC-IMPACT.md`.

## Validation and Acceptance

### Mandatory baseline gate

- Command: `pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal`
  - Expected: baseline quick gate passes

### Direct checks for the changed surface

- Command: `<command>`
  - Expected: `<observable result>`
- Command: `<command>`
  - Expected: `<observable result>`

Describe the end-user or operator-visible success condition.

## Idempotence and Recovery

Explain what can be repeated safely and how to recover from partial
failure.

## Interfaces and Dependencies

- `<module / class / function / script>` — why it matters
- `<module / class / function / script>` — why it matters

## Progress

- [ ] Task folder created and baseline captured.
- [ ] Requirements documented in `REQUIREMENTS.md`.
- [ ] Tests documented in `TEST-SPEC.md`.
- [ ] Relevant failing test reproduced or exception recorded.
- [ ] Implementation completed for current milestone.
- [ ] Related documentation updated.
- [ ] Mandatory baseline gate passed.
- [ ] Direct checks passed or limits documented.

## Surprises & Discoveries

### <Date> — <Short finding>

Observation:

Evidence:

Impact on plan:

## Decision Log

### <Date> — <Decision title>

Decision:

Rationale:

Impact:

## Outcomes & Retrospective

Summarize what shipped, what remains, and what was learned.
