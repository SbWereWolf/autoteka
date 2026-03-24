---
name: verify
description: Use after meaningful changes and after each major milestone to run the mandatory baseline verification gate, then add the strongest relevant direct checks for the changed surface. Do not treat the quick baseline gate as complete proof for system-tests, docs, tooling, or infrastructure changes.
---

Use after significant changes, after major milestones, and before any
requested commit.

## Baseline gate

Always run:

```powershell
pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal
```

Stop on non-zero exit code.

## Important limits of the baseline gate

The baseline gate currently validates platform artifacts and runs only a
quick subset of frontend and backend tests.

It does not by itself prove:

- `system-tests/` changes;
- `infrastructure/tests/` changes;
- docs-only changes;
- `scripts/agent/`, `.agents/`, `.codex/`, or `lint/` changes;
- browser-only UI flows;
- contract changes that require direct HTTP or end-to-end evidence.

It also uses a cache over selected source trees, so changes in tests,
docs, scripts, configs, and workflow files can evade direct coverage.

## Test-integrity rule

When reviewing or verifying a change, treat suspicious test edits as a
first-class risk.

Flag the change when a failing test appears to have been silenced by:

- weakening or deleting assertions;
- removing coverage for the changed behavior;
- reshaping the test expectation without a corresponding approved
  requirement change, review finding, or documented exception.

Prefer fixing the implementation first. Test changes are acceptable
only when the test is shown to be wrong, obsolete, or inconsistent with
the accepted specification.

## Direct-check rule

After the baseline gate, run the strongest relevant direct checks for
the changed surface.

Choose commands from:

- `docs/manual/TESTING.md`
- `.agents/skills/exec-plan/references/repo-test-matrix.md`
- the nearest nested `AGENTS.md`

Examples:

- frontend behavior -> targeted unit or UI/browser checks;
- backend contract -> direct HTTP or `system-tests` quick checks;
- `system-tests/` change -> targeted `npm --prefix system-tests ...`;
- repo-tooling change -> direct script smoke checks;
- docs change -> lint/doc checks and linked behavior checks where the
  doc makes executable claims.

## Reporting format

Return only:

- baseline gate result;
- direct checks run;
- short summary of what failed or passed;
- any suspicious test-silencing pattern that needs review attention;
- the minimal next repair target if something failed.

Do not implement unrelated fixes.
