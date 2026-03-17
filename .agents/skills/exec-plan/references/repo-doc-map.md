# Repo documentation map for agent work

Use this map when deciding what docs must change after code or workflow
changes.

## Foundations

### `docs/foundations/IMPLEMENTATION.md`

Update when the task changes:

- architecture or responsibility boundaries;
- how modules connect;
- where logic belongs;
- how frontend, backend, packages, or infra pieces relate.

## Manuals

### `docs/manual/USER_MANUAL.md`

Update when end users can do something new or differently.

### `docs/manual/CLERC_MANUAL.md`

Update when operator or clerk workflows change.

### `docs/manual/ADMIN_MANUAL.md`

Update when admin workflows, setup, or theme editor operations change.

### `docs/manual/TESTING.md`

Update when:

- test profiles change;
- new test commands are added;
- env/config rules for testing change;
- quick-vs-heavy verification guidance changes.

## Runtime and infra docs

### `backend/README.md`

Update when backend workspace structure or responsibility split changes.

### `frontend/README.md`

Update when frontend commands, test commands, routes, or runtime API
configuration change.

### `system-tests/README.md`

Update when system-test profiles, structure, or usage changes.

### `infrastructure/DEPLOY.md`

Update when deployment, runtime, maintenance, repair, or operational
procedures change.

## Agent and workflow docs

### `AGENTS.md` and nested `AGENTS.md`

Update when:

- repository workflow changes;
- skill routing changes;
- direct-check policy changes;
- new local instruction layers are introduced.

### `docs/foundations/CODE_REVIEW.md`

Update when review policy or diff acceptance criteria change.

### `docs/foundations/AGENT_RULES_ARCHITECTURE.md`

Update when rule ownership or instruction layering changes.
