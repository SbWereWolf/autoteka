# Stress-test scenarios for agent rules

Use these scenarios as a mental check before claiming that the ruleset
covers the current task.

## Scenario 1 — frontend UI behavior change

Expected routing:

- primary skill: `frontend`
- supporting skill: `layout-and-design` only if semantics/a11y drive the
  task
- `exec-plan`: optional unless the task is structural or cross-cutting

Expected verification:

- baseline gate
- direct frontend unit or UI/browser check proving the changed behavior

## Scenario 2 — backend API contract change

Expected routing:

- primary skill: `backend`
- `exec-plan`: required if the public contract changed

Expected verification:

- baseline gate
- direct HTTP or `system-tests` quick check proving the contract

## Scenario 3 — shared package or schema change

Expected routing:

- primary skill: `backend`
- `exec-plan`: required

Expected verification:

- baseline gate
- direct checks in both backend runtimes
- migration/recovery notes when applicable

## Scenario 4 — system-tests-only change

Expected routing:

- primary skill: `system-tests`
- `exec-plan`: only if the task is large, ambiguous, or structural

Expected verification:

- baseline gate as baseline only
- targeted `system-tests` profile

## Scenario 5 — verify or agent-script change

Expected routing:

- primary skill: `repo-tooling`
- `exec-plan`: required if workflow or verification semantics changed

Expected verification:

- baseline gate
- direct smoke checks of the changed scripts
- explicit cache caveat when the verification script changed

## Scenario 6 — infrastructure change

Expected routing:

- primary skill: `infrastructure`
- `exec-plan`: required for structural or operationally risky changes

Expected verification:

- baseline gate
- `npm --prefix infrastructure/tests test`
- runbook/doc impact captured

## Scenario 7 — docs-only change

Expected routing:

- primary skill: `tech-writer`
- `exec-plan`: optional unless cross-document or workflow-heavy

Expected verification:

- targeted doc lint/checks
- linked behavior checks when the doc makes executable claims

## Scenario 8 — AGENTS or skill change

Expected routing:

- primary skill: `repo-tooling`
- `exec-plan`: required if routing or precedence changed

Expected verification:

- path/reference review
- consistency review across root rules, local rules, skills, and docs
