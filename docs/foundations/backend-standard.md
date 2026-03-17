# BACKEND STANDARD

This document defines stable backend conventions for this repository.

It is a reference for backend-oriented work. It does not override:

1. root `AGENTS.md`;
2. the nearest nested `AGENTS.md`;
3. explicit verification, commit, task-record, or code-change-loop
   rules.

Use this document together with the `backend` skill.

## 1. Ownership and placement

Place code in the narrowest backend application or package that owns the
behavior.

Use these placement defaults:

- `backend/apps/ShopAPI/**` for public or integration-facing API
  behavior;
- `backend/apps/ShopOperator/**` for operator-facing workflows and admin
  behavior;
- `backend/packages/**` for shared backend abstractions that are truly
  used by more than one runtime or that define stable shared contracts.

Do not move code into a shared package only to avoid duplication in a
single task. Shared packages raise contract and verification cost.

## 2. Public contract discipline

Treat these as contracts unless the task explicitly changes them:

- request and response shapes;
- validation behavior;
- serialization and resource output;
- authorization outcomes;
- event payloads;
- CLI signatures;
- database schemas used across boundaries.

If a contract must change:

1. make the change explicit in requirements and task records;
2. update the dependent tests first;
3. update related docs and rollout notes;
4. escalate verification.

## 3. Schema and migration discipline

Schema and migration changes are high-risk backend changes.

When touching migrations, database structure, or shared schema
assumptions:

- prefer additive and reviewable transitions;
- avoid hidden destructive behavior;
- call out rollback constraints explicitly;
- record any data-migration or rollout caveat in documentation.

Do not treat a successful baseline gate as sufficient evidence for a
schema-sensitive change.

## 4. Business-rule placement

Keep business rules close to the layer that owns the behavior.

Prefer explicit domain or application services over scattering critical
rules across controllers, policies, listeners, or view/resource layers.

Controllers and command entry points should coordinate work, not hide
complex policy or pricing logic.

## 5. Transactions and consistency

For money flow, orders, inventory, permissions, and other consistency-
sensitive areas:

- prefer explicit transaction boundaries;
- keep side effects ordered and reviewable;
- avoid mixing persistence, remote calls, and event emission in ways
  that obscure failure behavior;
- state any consistency limitation clearly when stronger guarantees are
  not available.

## 6. Validation and authorization

Validation and authorization are part of observable behavior.

When they change:

- update tests that prove the intended allow/deny or accept/reject
  behavior;
- update operator or API-facing docs when the change is user-visible;
- avoid "silent broadening" of permissions or accepted payloads.

## 7. Shared package caution

Changes under `backend/packages/**` have wider blast radius.

Before introducing or expanding shared abstractions, check that the
benefit outweighs the extra coupling. Prefer a local change first unless
shared ownership is clearly justified.

When a shared package changes, verify all affected runtimes, not only
package-level or nearest-app tests.

## 8. Anti-patterns

Avoid these backend anti-patterns:

- moving code to shared packages too early;
- changing contracts implicitly;
- broad refactors without a visible user or operator benefit;
- business rules hidden in controllers or resources;
- schema changes without rollout or rollback thinking;
- validation or authorization drift without test updates;
- declaring backend work "done" while contract or operator docs are
  stale.
