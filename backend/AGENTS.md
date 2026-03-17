# Backend local instructions

These instructions refine the root `AGENTS.md` for `backend/`.

## Primary skill

Use `backend`.

## Placement rule

- `backend/packages/SchemaDefinition` -> schema truth only
- `backend/packages/*` -> shared business logic
- `backend/apps/ShopAPI` -> API runtime glue and HTTP concerns
- `backend/apps/ShopOperator` -> admin runtime glue and MoonShine
  concerns

If logic must work the same in both runtimes, it does not belong in only
one runtime.

## Verification

The baseline gate covers quick tests for both runtimes, but public
contract changes often also require direct HTTP or `system-tests`
evidence.

For shared package changes, verify both runtimes directly.
