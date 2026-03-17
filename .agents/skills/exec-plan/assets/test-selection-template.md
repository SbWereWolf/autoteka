# Test selection for <task-slug>

## Changed surfaces

- `<path>` — <what changed>
- `<path>` — <what changed>

## Direct target tests

- Command: `<command>`
  - Why this is needed:
  - Red signal expected before implementation:
  - Green signal expected after implementation:

## Repository gate

- Command: `pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal`
  - Why the baseline gate is still needed:

## Cache caveat check

- [ ] The task changes no test/config/verify surface that could be hidden by the minimal verify cache.
- [ ] Or the directly affected tests/scripts were run explicitly.
- [ ] Or the quick cache was cleared before final verification.

## Final evidence set

List the exact commands that will be cited as proof.
