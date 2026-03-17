# INFRASTRUCTURE STANDARD

This document defines stable infrastructure conventions for this
repository.

It is a reference for infrastructure-oriented work. It does not
override:

1. root `AGENTS.md`;
2. the nearest nested `AGENTS.md`;
3. explicit verification, commit, task-record, or code-change-loop
   rules.

Use this document together with the `infrastructure` skill.

## 1. Reproducibility first

Infrastructure work must preserve reproducibility across local,
verification, CI, and deployment surfaces whenever the repository
supports those surfaces.

Prefer explicit and reviewable behavior over hidden defaults or
machine-specific assumptions.

## 2. Runtime wiring is product behavior

Treat runtime wiring, env selection, build steps, container behavior,
and bootstrap paths as user-affecting behavior, not invisible support
code.

If a config or wiring change can alter application outcomes, document it
and verify it directly.

## 3. Safety of change

Prefer additive or reversible changes when possible.

When a change cannot be easily reversed, record:

- the rollback expectation;
- the operational caveat;
- the exact validation path used to justify the change.

## 4. Script discipline

Scripts are part of the repository contract.

When changing scripts:

- preserve argument clarity and exit-code behavior unless the task
  intentionally changes them;
- prefer deterministic behavior over clever fallback logic;
- update documentation when invocation or prerequisites change.

## 5. Configuration discipline

Configuration changes must stay explicit.

Avoid:

- silent fallback to alternative tools or environments;
- hidden dependence on local shell history or machine state;
- untracked assumptions about credentials, ports, paths, or installed
  binaries.

## 6. Verification and observability

Infrastructure work is not complete when the file changed; it is complete
when the changed runtime surface was actually exercised as strongly as
this repository allows.

If only manual verification is available, write the manual path clearly.

## 7. Anti-patterns

Avoid these infrastructure anti-patterns:

- configuration magic that is hard to review;
- script changes without direct checks;
- rollout-affecting changes without rollback notes;
- environment assumptions that are not documented;
- treating baseline quick verification as sufficient proof for runtime,
  CI, deploy, or tooling changes.
