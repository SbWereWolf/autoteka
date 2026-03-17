# Repository test matrix for ExecPlan work

Use this matrix when filling `TEST-SPEC.md`, selecting the red phase,
and choosing milestone verification.

## 1. Baseline rule

`pwsh scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal`
is always the baseline quick gate, but never the only evidence when a
more direct test surface exists.

## 2. Surface -> direct test mapping

### Frontend

- `frontend/src/components`, `frontend/src/pages`,
  `frontend/src/router`, `frontend/src/state.ts` ->
  `npm --prefix frontend run test:unit`
- `frontend/src/api` or request/response behavior ->
  `npm --prefix frontend run test:api:online` when backend availability
  matters
- browser-only interaction or visual flow ->
  `npm --prefix frontend run test:ui:mock`
- same-origin end-to-end flow ->
  `npm --prefix frontend run test:e2e` or a matching `system-tests`
  profile

### Backend

- `backend/apps/ShopAPI/**` ->
  `cd backend/apps/ShopAPI && php artisan test`
- `backend/apps/ShopOperator/**` ->
  `cd backend/apps/ShopOperator && php artisan test`
- `backend/packages/SchemaDefinition/**` -> both runtime suites
- shared package or contract change -> every affected runtime suite
- API route/serialization/HTTP behavior ->
  `npm --prefix system-tests run test:quick-local` or the closest
  supported profile

### Infrastructure

- `infrastructure/**` -> `npm --prefix infrastructure/tests test`
- runtime wiring/dev profile behavior ->
  `npm --prefix system-tests run test:quick-dev`
- browser-visible runtime flow -> smallest supported UI/system profile

### Test harness / verification tooling

- `system-tests/**`, `infrastructure/tests/**`, `frontend/tests/**`,
  `frontend/e2e/**`, `frontend/ui-mock/**`, `scripts/agent/**`,
  `lint/**`, root test configs -> run the directly affected test or
  script entrypoint, not only the root quick gate

## 3. Cache caveat

`verify.ps1 -TestProfile minimal` caches some quick blocks by selected
source trees only. If the change is limited to tests, test configs,
verification scripts, or env files that affect tests, direct test runs
are mandatory. Clearing `/.runtime/verify/minimal-src-cache.json` before
the final quick gate is acceptable when needed.

## 4. Choosing the strongest sufficient evidence

Prefer this order:

1. the narrowest failing and then passing test proving the exact change;
2. the smallest runtime/system test proving the contract or flow;
3. the mandatory repo quick gate;
4. stronger integration/system profiles when the changed risk justifies
   them.

Record the exact chosen evidence in `TEST-SPEC.md` and `PLAN.md`.
