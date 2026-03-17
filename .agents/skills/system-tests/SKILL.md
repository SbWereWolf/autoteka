---
name: system-tests
description: Use for changes in system-tests, end-to-end behavior checks, HTTP smoke tests, Playwright or Vitest scenarios that span runtime boundaries, and for proving observable user or operator behavior after runtime changes.
---

# System tests

Apply this skill for `system-tests/` and behavior checks that cross
runtime boundaries.

## What belongs here

Use this skill when the task changes:

- `system-tests/cases/*`
- `system-tests/ui/*`
- `system-tests/scripts/*`
- runtime-facing test selection or profile usage
- behavior checks linked to docs or manuals

## Main rule

System behavior must be proven with the narrowest meaningful scenario,
not with the heaviest profile by default.

Choose the smallest test profile that proves the changed behavior.
Escalate to heavier profiles only when the lighter profile cannot prove
it.

## Default profile choices

- HTTP/API or smoke behavior -> `npm --prefix system-tests run test:quick-local`
  or `test:quick-dev`
- UI/browser behavior in dev runtime ->
  `npm --prefix system-tests run test:ui-headless-dev`
- local visual investigation ->
  `npm --prefix system-tests run test:ui-headed-local`
- prod-like final pass -> use the relevant `*-prod` profile only when
  the task really needs that confidence level

## Rules

1. Prefer the smallest scenario that proves the contract.
2. Keep tests observable and behavior-first.
3. Do not silently widen a quick smoke task into a full UI matrix.
4. When changing docs-linked behavior, preserve or update the mapping
   to the relevant document.
5. When a runtime contract changes, coordinate with the primary runtime
   skill but keep the system-test evidence explicit.

Read `docs/manual/TESTING.md` and
`.agents/skills/exec-plan/references/repo-test-matrix.md` before making
verification claims.
