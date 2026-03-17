---
name: frontend
description: Use this skill for frontend application changes in JavaScript or TypeScript, especially under frontend source trees, UI components, pages, stores, composables, client-side routing, browser behavior, accessibility, and frontend tests.
---

# Frontend skill

Use this skill for frontend changes and browser-facing behavior.

Typical scope:

- `frontend/**`
- UI components, pages, forms, stores, hooks/composables, client-side
  routing, state transitions, validation, and browser-visible flows;
- frontend test files and supporting frontend tooling that directly
  affects UI behavior.

Do not use this skill as a substitute for the `exec-plan` meta-skill
when the task is structural, ambiguous, cross-cutting, or multi-step.

## Standards and references

Use this skill together with:

- `docs/foundations/frontend-standard.md` — stable frontend
  conventions, UI behavior expectations, accessibility priorities, and
  anti-pattern guidance.
- `.agents/skills/frontend/references/frontend-standard.md` —
  repository-specific frontend stack, component/state/style guidance,
  implementation examples, and testing defaults.

The foundations document defines stable domain-level frontend
conventions. The local reference adds repository-specific operational
frontend guidance and examples. These documents support this skill but
do not override:
1. root `AGENTS.md`;
2. the nearest nested `AGENTS.md`;
3. explicit verification, commit, task-record, or code-change-loop
   rules.

## Implementation focus

When using this skill:

1. describe the user-visible behavior first;
2. preserve accessibility and predictable interaction behavior;
3. prefer focused component- or flow-level changes before broad UI
   rewrites;
4. update tests and related documentation together with code.

## Test selection

Choose checks that prove the changed browser-facing behavior directly.
Do not assume the baseline gate alone is enough.

At minimum:

- run the relevant frontend unit tests for the changed area;
- when user flows, routing, async state, or integration behavior
  changed, add the strongest repository-supported direct checks;
- when the change affects contracts shared with backend or system tests,
  include the relevant cross-surface checks.

Use repo-native commands from:

- `docs/manual/TESTING.md`
- the nearest nested `AGENTS.md`
- `.agents/skills/exec-plan/references/repo-test-matrix.md`

Always include at least one check that demonstrates the intended UI or
browser behavior, not only code-level correctness.

## Documentation impact

When frontend behavior changes, review and update the related
user-facing or developer-facing documentation.

Typical documentation impact includes:

- flow descriptions and screenshots when applicable;
- form behavior and validation notes;
- browser/runtime assumptions;
- setup or local run instructions when tooling changed;
- verification steps for changed UI behavior;
- task records under `tasks/<task-slug>/` when `exec-plan` is active.

Use:

- `tasks/<task-slug>/DOC-IMPACT.md` when `exec-plan` is active;
- `.agents/skills/exec-plan/references/repo-doc-map.md`;
- the nearest nested `AGENTS.md`;
- `docs/foundations/frontend-standard.md` for stable frontend
  conventions.

Do not mark the task complete while frontend documentation drift
remains unresolved.
