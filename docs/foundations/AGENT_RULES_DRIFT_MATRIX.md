# AGENT RULES DRIFT MATRIX

This document records the main duplication, drift, and conflict checks
for the current agent-rules package.

## 1. Resolved hard drift

### A. Root skill inventory pointed to missing skills

Before this round, root `AGENTS.md` and `.agents/skills/README.md`
referred to routeable skills that did not physically exist in the
package:

- `preflight`
- `safe-commit`
- `backend`
- `frontend`
- `infrastructure`
- `layout-and-design`
- `tech-writer`

Resolution:

- restored these skills under `.agents/skills/*`;
- restored their repository-specific reference docs where they were
  expected.

Why it mattered:

- routing guidance must not name skills that cannot actually load.

### B. `exec-plan` referenced non-existent support files

Before this round, `exec-plan/SKILL.md` referenced missing files under
`references/` and `assets/`.

Resolution:

- restored the missing reference and template files;
- left only paths that now physically exist.

Why it mattered:

- a skill must not instruct the agent to consult files that are absent.

## 2. Accepted duplication

The following duplication is intentional and should remain aligned,
not fully removed.

### A. Verification rules in root `AGENTS.md` and `verify` skill

Reason:

- root `AGENTS.md` owns the invariant;
- the `verify` skill owns the reusable verification workflow.

Alignment rule:

- baseline command, cache caveat, and direct-check rule must say the
  same thing in both places.

### B. Planning/task-record rules in root `AGENTS.md` and `exec-plan`

Reason:

- root `AGENTS.md` defines when planning is mandatory;
- `exec-plan` defines how the planning workflow is executed.

Alignment rule:

- required files under `tasks/<task-slug>/` must stay identical.

### C. Local verification notes in nested `AGENTS.md` and primary skills

Reason:

- nested `AGENTS.md` is path-local;
- the skill is reusable and routeable.

Alignment rule:

- skills may describe the approach;
- nested files may name subtree-specific commands or caveats.

## 3. Ownership boundaries

### Root `AGENTS.md` owns

- precedence
- canonical workflow
- planning trigger
- task-record policy
- code-change loop
- environment readiness
- verification contract
- commit policy
- forbidden paths
- skill routing model

### Nested `AGENTS.md` own

- subtree placement rules
- subtree direct-check commands
- subtree doc-impact caveats

### Skills own

- reusable specialist workflows
- routing descriptions
- approach guidance
- support references and templates

### Reference docs own

- long-form standards
- examples
- checklists
- maps

## 4. Current non-conflicts that may look suspicious

### A. Root says “exactly one primary skill”; `layout-and-design` may be subordinate

Not a conflict.

Interpretation:

- exactly one primary skill owns the task;
- a second skill may be loaded only for a narrow subordinate concern.

### B. Docs-only tasks skip red-green but still require direct checks

Not a conflict.

Interpretation:

- the code-change loop does not apply to pure docs work;
- executable claims in docs still need direct validation.

### C. Baseline gate is mandatory but not sufficient

Not a conflict.

Interpretation:

- the baseline gate is always required for non-trivial changes;
- direct checks are an additional obligation for the changed surface.

## 5. Future drift checks

Review agent-rule changes against this checklist:

- [ ] Every skill named in root `AGENTS.md` exists on disk.
- [ ] Every file referenced from any `SKILL.md` exists on disk.
- [ ] Root invariants are not silently moved into skills.
- [ ] Nested `AGENTS.md` refine root rules instead of replacing them.
- [ ] Verification wording remains aligned between root, `verify`, and
      local subtree instructions.
- [ ] `tasks/<task-slug>/` required file names stay consistent between
      root and `exec-plan`.
