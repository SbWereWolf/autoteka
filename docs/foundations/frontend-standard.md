# FRONTEND STANDARD

This document defines stable frontend conventions for this repository.

It is a reference for frontend-oriented work. It does not override:

1. root `AGENTS.md`;
2. the nearest nested `AGENTS.md`;
3. explicit verification, commit, task-record, or code-change-loop
   rules.

Use this document together with the `frontend` skill.

## 1. User-visible behavior first

Describe frontend work in terms of what the user can see or do.

Prefer changes that preserve predictable interaction behavior,
accessibility, and state transitions over changes that only simplify
code while making the UI less understandable.

## 2. Placement and scope

Keep changes close to the UI surface that owns the behavior.

Prefer focused changes in the smallest practical scope:

- component-level when the behavior is local;
- page- or flow-level when the behavior spans screens or routing;
- shared abstractions only when reuse is real and already justified.

Do not centralize logic prematurely just because two files look similar.

## 3. State and async behavior

Treat loading, error, empty, stale, and success states as first-class
behavior.

When state or async logic changes:

- verify the user-visible transitions, not only internal helper logic;
- keep retry, disabled, and validation behavior explicit;
- avoid hidden coupling between routing, fetch, and rendering state.

## 4. Accessibility and semantics

Accessibility is part of correctness.

When changing interactive UI:

- preserve semantic structure where applicable;
- keep keyboard and focus behavior predictable;
- avoid introducing visual-only meaning when textual or semantic cues
  are needed.

## 5. Forms and validation

Form behavior must stay understandable to the user.

When touching forms:

- keep validation timing and feedback consistent;
- ensure error states are testable and visible;
- do not broaden accepted input silently if it changes the actual user
  contract.

## 6. Shared frontend abstractions

Shared composables, stores, helpers, or UI primitives are useful only
when they reduce real repetition without hiding behavior.

Prefer local implementation first when the shared abstraction would be
more complex than the concrete need.

## 7. Anti-patterns

Avoid these frontend anti-patterns:

- broad UI rewrites without proving a user-visible benefit;
- hidden async state transitions;
- “refactors” that change validation or focus behavior accidentally;
- over-centralizing state or abstractions too early;
- declaring frontend work complete without proving the browser-visible
  behavior and updating related docs.
