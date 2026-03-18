# Infrastructure local instructions

These instructions refine the root `AGENTS.md` for `infrastructure/`.

## Primary skill

Use `infrastructure`.

## Scope

This tree owns runtime wiring, bootstrap, maintenance, observability,
repair, and deployment logic.

## Verification

The root baseline gate is required but not sufficient.

Use direct infra checks, usually:

```bash
npm --prefix infrastructure/tests test
```

Для интеграционных тестов backup/restore (TC-DEPLOY-024) требуется 
`infrastructure/tests/.env` с переменной `BASH_PATH`. 
Скопируйте `example.env` в `win.env` или `nix.env`, заполните пути,
затем: `pwsh ./scripts/swap-env.ps1 load -t infrastructure-tests-env`.

Add targeted script smoke checks when changing a specific runtime,
maintenance, or repair script.

## Doc impact

When runtime or operational behavior changes, update:

- `infrastructure/DEPLOY.md`
- affected manuals in `docs/manual/*`
