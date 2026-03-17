# CODE REVIEW

This document defines the minimum self-review standard for agent work in
this repository.

## 1. Routing and planning

Before accepting the diff, check:

- the primary skill matches the changed surface;
- `exec-plan` was used when the task was structural, ambiguous,
  cross-cutting, or workflow-changing;
- local `AGENTS.md` instructions closer to the changed files were
  followed.

## 2. Scope discipline

Reject or rework the diff if it:

- changes unrelated files without a clear reason;
- mixes workflow/tooling refactors into product changes without need;
- hides documentation debt by postponing doc updates;
- claims verification that was not actually run.

## 3. Verification integrity

Check explicitly:

- the mandatory baseline gate was run when required;
- direct checks were run for the changed surface;
- the final answer distinguishes baseline gate from direct checks;
- no one claimed that `verify.ps1 -TestProfile minimal` proves surfaces
  it does not directly cover.

## 4. TDD-style discipline

For code and executable configuration changes, check:

- `REQUIREMENTS.md` exists when `exec-plan` was required;
- `TEST-SPEC.md` defines the intended red and green checks;
- the red phase was observed or the exception was documented honestly;
- implementation stayed close to the stated requirement.

## 5. Documentation integrity

Check:

- changed behavior is reflected in the right doc family;
- cross-links still make sense;
- commands and paths in docs still match the repo;
- `DOC-IMPACT.md` is current when `exec-plan` is active.

## 6. Tooling and workflow changes

For changes in `scripts/`, `.agents/`, `.codex/`, `lint/`, or agent
rules, review:

- path correctness;
- command correctness;
- instruction precedence;
- stale examples;
- cache caveats and verification limits.

## 7. Completion standard

A task is not done if any of the following remain unclear:

- what changed;
- where it changed;
- what was verified;
- what remains unproven.
