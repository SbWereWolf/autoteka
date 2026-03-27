# ShopOperator local instructions

These instructions refine the root and `backend/AGENTS.md` for
`backend/apps/ShopOperator/`.

## Scope

This runtime owns MoonShine/admin runtime behavior, resource wiring,
operator-facing flows, and runtime-specific policies or presentation.

## Rules

1. Do not move reusable business rules into MoonShine resources.
2. When an operator-visible workflow changes, update the relevant
   manual.
3. If admin UI behavior changed in a way users can observe, add direct
   system or UI evidence when quick backend tests are not enough.
4. It is prohibited to produce bicycles if similar functionality exists.

Use `./backend/apps/ShopOperator/vendor/moonshine/moonshine/src` as
source of truth for develop MoonShine artifacts

## Direct checks

Run from `backend/apps/ShopOperator`:

```bash
php artisan test
```
