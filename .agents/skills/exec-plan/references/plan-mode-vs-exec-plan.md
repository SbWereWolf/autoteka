# Plan mode vs ExecPlan in this repository

## Native Plan mode

Plan mode is the interactive front-end capability that lets Codex gather
context, ask clarifying questions, and build a stronger plan before it
starts implementation.

Use Plan mode when:

- the request is fuzzy or under-specified;
- you want to review the approach before code changes happen;
- you expect important clarifying questions.

## ExecPlan skill

The `exec-plan` skill is the repository workflow for creating and
maintaining durable task records under `tasks/<task-slug>/`.

Use the skill when:

- work is complex or structural;
- the task needs a living plan that survives long runs and hand-offs;
- you want requirements, tests, documentation impact, and milestone
  status recorded in files.

## Recommended workflow

### Best default for ambiguous work

1. Start in native Plan mode.
2. Let Codex gather context and ask the necessary clarifying questions.
3. Have it produce or update `tasks/<task-slug>/PLAN.md` and companion
   files through the `exec-plan` skill.
4. Review the plan.
5. Ask Codex to implement that plan.

### Best default for already clear work

If the task is already well specified, you can skip native Plan mode
and directly ask Codex to use `$exec-plan` and create the task folder.

## Question behavior

During planning, focused questions are acceptable when a blocking
product or scope decision cannot be inferred from the repository or the
prompt.

During implementation from an approved `PLAN.md`, the agent should not
ask for “next steps”. It should proceed milestone by milestone, keeping
all task records current.

## Operational rule for this repo

If you want maximum predictability, use this two-step pattern:

1. `/plan` or “plan this with $exec-plan”
2. “Implement tasks/<task-slug>/PLAN.md”

That gives you an explicit review point before code changes while still
preserving the durable file-based workflow.
