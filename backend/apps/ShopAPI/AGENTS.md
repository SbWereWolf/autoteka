# ShopAPI local instructions

These instructions refine the root and `backend/AGENTS.md` for
`backend/apps/ShopAPI/`.

## Scope

This runtime owns API routes, request/response glue, serialization,
controller wiring, and API-facing runtime configuration.

## Rules

1. Do not hide reusable business logic in controllers.
2. If a change affects observable API contract, record it as a contract
   change and add direct HTTP or `system-tests` evidence.
3. Update docs when endpoint behavior, payload shape, or route usage
   changes.

## Direct checks

Run from `backend/apps/ShopAPI`:

```bash
php artisan test --parallel --processes=2
```

Add direct API/system evidence when the changed behavior is meant to be
observable over HTTP.
