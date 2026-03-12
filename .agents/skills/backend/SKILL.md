---
name: "backend"
description: "Use for Laravel/PHP backend work in this repo: ShopAPI, ShopOperator, backend/packages, Eloquent, migrations usage, backend tests, and architecture decisions about where backend code belongs. Do not use for deploy Bash/systemd/docker work; use infrastructure for that."
---

# Backend

Apply this skill for `backend/` work.

## Stack

Work only inside this stack:

- Laravel 12+
- PHP 8.2+
- MoonShine 4.8+
- SQLite 3.35+
- Composer path packages

## Repo architecture

Treat the backend as four responsibility zones:

- `backend/packages/SchemaDefinition` -> schema only
- `backend/packages/*` -> shared business packages
- `backend/apps/ShopOperator` -> MoonShine runtime
- `backend/apps/ShopAPI` -> API runtime

`ShopOperator` and `ShopAPI` are separate runtimes, not two layers inside one Laravel app.

## Main placement rule

If logic must work the same from:

- ShopOperator
- ShopAPI
- CLI
- jobs
- tests

then it belongs in `backend/packages/*`.

If logic is only about:

- MoonShine resource/form configuration
- HTTP request/response shape
- JSON serialization
- route/policy/auth glue

then it stays in the runtime module.

## Rules

1. `SchemaDefinition` contains schema truth only.
2. Shared business logic lives in `backend/packages/*`.
3. Do not duplicate one use case in ShopOperator and ShopAPI.
4. Do not keep business orchestration inside controllers, `ModelResource`, `Request`, or Eloquent models.
5. Treat Eloquent as persistence/infrastructure, not as the domain.
6. For new business logic: test first, then implementation.
7. Open transactions where the use case runs, not in the interface layer.
8. Design for SQLite as the real target database.

## How to answer

When implementing or reviewing backend work:

- say where the code belongs first
- separate package logic from runtime glue
- keep examples small and package-oriented
- call out the minimal required tests

Read `references/backend-standard.md` for the full repo-specific rules and examples.
