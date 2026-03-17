# AGENT RULES STRESS TEST

This document records a scenario-based stress test of the agent rules
against the actual project structure.

The goal was not to run product code. The goal was to dry-run the rules
against realistic task shapes and identify where an agent would likely
choose the wrong skill, the wrong verification, or the wrong document
updates.

## Findings summary

### 1. The baseline verification gate was being over-credited

`pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal`
remains a required baseline gate, but it does not directly prove every
surface in the repo.

Most important gaps:

- `system-tests/` changes;
- `infrastructure/tests/` changes;
- docs-only changes;
- `scripts/agent/`, `.agents/`, `.codex/`, and `lint/` changes;
- browser-only or runtime-integration UI behavior.

Applied fix:

- clarified the verification contract in root `AGENTS.md`;
- rewrote the `verify` skill;
- added `repo-test-matrix.md`.

### 2. The repo needed routeable ownership for system behavior and
repo tooling

Without dedicated ownership, an agent could wrongly force
`infrastructure`, `backend`, or `tech-writer` onto tasks that are really
about behavioral tests or repository mechanics.

Applied fix:

- added `system-tests` skill;
- added `repo-tooling` skill.

### 3. Tooling changes needed explicit direct checks

A cached app test gate can look green even when `verify.ps1`,
`changed-files.ps1`, or local rules changed.

Applied fix:

- added direct-check expectations for repo-tooling work;
- added local rules for `scripts/` and `scripts/agent/`.

### 4. Docs needed stronger mapping to code and tests

Docs exist in several families with different responsibilities.
Without a map, an agent can update the wrong document or skip one.

Applied fix:

- added `repo-doc-map.md`;
- added `docs/AGENTS.md` and review requirements.

## Scenario matrix

### Scenario 1 — frontend component behavior bug

Expected routing:

- primary skill: `frontend`
- support: `layout-and-design` only if semantics or a11y drive the task

Expected checks:

- baseline gate;
- targeted frontend unit or UI/mock/browser check.

Risk without the fix:

- agent claims baseline gate alone proves interactive behavior.

### Scenario 2 — ShopAPI response shape change

Expected routing:

- primary skill: `backend`
- `exec-plan`: required because public contract changed

Expected checks:

- baseline gate;
- direct HTTP or `system-tests` quick check.

Risk without the fix:

- agent stops after backend tests and skips contract evidence.

### Scenario 3 — SchemaDefinition change

Expected routing:

- primary skill: `backend`
- `exec-plan`: required

Expected checks:

- baseline gate;
- both backend runtimes checked directly.

Risk without the fix:

- agent treats package change as if one runtime were enough.

### Scenario 4 — system-tests-only change

Expected routing:

- primary skill: `system-tests`

Expected checks:

- baseline gate only as baseline;
- targeted `system-tests` profile.

Risk without the fix:

- agent uses backend or infra rules and skips actual scenario evidence.

### Scenario 5 — `scripts/agent/verify.ps1` change

Expected routing:

- primary skill: `repo-tooling`
- `exec-plan`: required if semantics changed

Expected checks:

- baseline gate;
- direct script smoke checks;
- explicit cache caveat.

Risk without the fix:

- agent declares success based on the very script it changed.

### Scenario 6 — infra runtime or deploy change

Expected routing:

- primary skill: `infrastructure`

Expected checks:

- baseline gate;
- `npm --prefix infrastructure/tests test`;
- doc/runbook update.

Risk without the fix:

- agent relies on app quick tests that do not cover infra flow.

### Scenario 7 — docs-only change

Expected routing:

- primary skill: `tech-writer`

Expected checks:

- doc lint/checks;
- linked behavior check when the doc makes executable claims.

Risk without the fix:

- agent skips validation because no product code changed.

### Scenario 8 — `AGENTS.md` or skill change

Expected routing:

- primary skill: `repo-tooling`
- `exec-plan`: required if precedence or routing changed

Expected checks:

- path/reference review;
- consistency review across rule layers.

Risk without the fix:

- agent updates one layer and leaves stale guidance elsewhere.
