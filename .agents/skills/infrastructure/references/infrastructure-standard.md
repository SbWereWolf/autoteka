# Infrastructure standard

## Scope

This skill covers:

- infrastructure scripts;
- install/rollout/uninstall;
- backup/restore;
- watchdog;
- maintenance;
- docker compose runtime;
- systemd automation;
- operational diagnostics.

## Target stack

- Ubuntu 24+
- Bash
- Docker Compose

## Repo rules

Infrastructure logic belongs in `INFRA_ROOT`.

- `infrastructure/DEPLOY.md` is the full infrastructure specification.
- `docs/manual/ADMIN_MANUAL.md` is the operator-facing practical runbook.
- `IMPLEMENTATION.md` should not become an operations manual.

## How to do it

```bash
#!/usr/bin/env bash
set -euo pipefail

docker compose -f "$INFRA_ROOT"/runtime/docker-compose.dev.yml up --build -d
```

## How not to do it

```bash
#!/usr/bin/env bash

docker compose up -d
php artisan migrate
cd ../somewhere
rm -rf /tmp/*
```

The bad version is unsafe and underspecified: it has no strict shell mode, no explicit compose file, and mixes unrelated actions.

## Operational guidance

Prefer scripts that:

- fail fast;
- log meaningful steps;
- make target files/services explicit;
- are safe to rerun;
- keep diagnostics close to the failing operation.

## Validation

After infra changes, specify the smallest relevant validation:

- targeted script test;
- infrastructure test;
- service health check;
- documented manual verification in the matching runbook.
