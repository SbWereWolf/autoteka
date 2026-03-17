# Repository documentation map for ExecPlan work

Use this map when filling `DOC-IMPACT.md`.

## Core permanent docs

- `README.md` -> repo entrypoint, local setup, high-level testing,
  runtime overview
- `docs/foundations/IMPLEMENTATION.md` -> technical structure and
  current implementation boundaries
- `docs/manual/TESTING.md` -> test profiles, env isolation, how to run
  evidence
- `infrastructure/DEPLOY.md` -> deploy/runtime/maintenance mechanics
- `docs/manual/ADMIN_MANUAL.md` -> operator-facing maintenance and
  admin actions
- `docs/manual/USER_MANUAL.md` -> front office user flows
- `docs/manual/CLERC_MANUAL.md` -> clerk/back office data workflows
- `backend/README.md` -> backend entrypoint
- `frontend/README.md` -> frontend entrypoint
- `scripts/README.md` -> repo-level scripting and environment helpers

## Change -> likely docs to review

### Frontend behavior or startup

Review:

- `frontend/README.md`
- `README.md`
- `docs/manual/USER_MANUAL.md`
- `docs/manual/TESTING.md`
- `docs/foundations/IMPLEMENTATION.md`

### Backend contract, schema, or back office behavior

Review:

- `backend/README.md`
- `README.md`
- `docs/foundations/IMPLEMENTATION.md`
- `docs/manual/TESTING.md`
- `docs/manual/ADMIN_MANUAL.md`
- `docs/manual/CLERC_MANUAL.md`

### Infrastructure / deploy / maintenance

Review:

- `infrastructure/DEPLOY.md`
- `docs/manual/ADMIN_MANUAL.md`
- `docs/manual/TESTING.md`
- `docs/foundations/IMPLEMENTATION.md`
- `README.md`

### Repo scripts / verification / env workflow

Review:

- `scripts/README.md`
- `docs/manual/TESTING.md`
- `README.md`
- `docs/foundations/IMPLEMENTATION.md` when architecture or workflow
  boundaries change

## Rule

Do not assume a change is “self-documenting”. If the change alters how
someone develops, verifies, deploys, operates, or uses the system,
review the relevant permanent docs explicitly and record the result in
`DOC-IMPACT.md`.
