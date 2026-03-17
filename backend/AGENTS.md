# Backend local instructions

Apply these rules when the current working area is inside `backend/`.

## Scope

Primary skill: `backend`.

## Architecture boundaries

Treat backend as four zones:

- `backend/packages/SchemaDefinition` -> schema truth only
- `backend/packages/*` -> shared business logic
- `backend/apps/ShopAPI` -> API runtime glue
- `backend/apps/ShopOperator` -> back office runtime glue

If logic must behave the same from both runtimes, CLI jobs, or tests,
it belongs in a shared package, not in a runtime-specific controller,
resource, request, or model.

## Test selection

- `backend/apps/ShopAPI/**` -> run `cd backend/apps/ShopAPI && php artisan test`
- `backend/apps/ShopOperator/**` -> run `cd backend/apps/ShopOperator && php artisan test`
- `backend/packages/SchemaDefinition/**` -> run both runtime suites
- shared package or contract changes -> run every affected runtime suite
- API route/serialization/HTTP behavior changes -> add the smallest
  relevant `system-tests` profile, normally `npm --prefix system-tests
  run test:quick-local`

Do not rely on root `verify.ps1` as the only evidence when backend tests,
phpunit config, artisan test setup, or schema/runtime contracts change.

## Transactions and placement

- Open transactions in the use case that owns the business operation.
- Keep controllers/resources thin.
- Treat Eloquent as persistence/infrastructure, not as the domain.

## Doc impact

When contracts, schema, setup, or operator behavior change, review at
least these docs:

- `backend/README.md`
- `README.md`
- `docs/foundations/IMPLEMENTATION.md`
- `docs/manual/TESTING.md`
- `docs/manual/ADMIN_MANUAL.md`
- `docs/manual/CLERC_MANUAL.md`
