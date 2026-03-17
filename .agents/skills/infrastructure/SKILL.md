---
name: infrastructure
description: Use this skill for infrastructure, environment, CI, deployment, runtime wiring, Docker, scripts, provisioning, and operations-facing changes, especially where configuration or execution environment can change application behavior.
---

# Infrastructure skill

Use this skill for infrastructure and runtime-wiring changes.

Typical scope:

- `infrastructure/**`
- deployment and environment wiring;
- Docker and container runtime behavior;
- CI or automation definitions;
- runtime configuration, secrets handling patterns, and bootstrap code;
- operational scripts outside the dedicated repo-tooling skill scope.

Do not use this skill as a substitute for the `exec-plan` meta-skill
when the task is structural, ambiguous, cross-cutting, or multi-step.

## Implementation focus

When using this skill:

1. treat environment and runtime behavior as part of the product, not as
   invisible support code;
2. prefer explicit, reviewable configuration changes over hidden magic;
3. preserve reproducibility across local, CI, and deployment surfaces;
4. update validation steps and documentation together with code.

## Test selection

Infrastructure changes require direct checks that match the changed
runtime surface. The baseline gate alone is never sufficient here.

At minimum:

- run the repository-supported checks that exercise the changed script,
  config, build, container, or deployment surface;
- when application runtime behavior changes indirectly through config or
  wiring, include the relevant downstream application checks;
- when the change affects verification tooling or agent scripts,
  include those direct checks explicitly.

Use repo-native commands from:

- `docs/manual/TESTING.md`
- the nearest nested `AGENTS.md`
- `.agents/skills/exec-plan/references/repo-test-matrix.md`

If no strong automated check exists, document the limitation and record
concrete manual validation steps.

## Documentation impact

Infrastructure changes almost always have documentation impact.

Review and update at least the relevant parts of:

- environment setup instructions;
- deployment or rollback notes;
- operator or maintainer runbooks;
- verification instructions;
- troubleshooting guidance;
- task records under `tasks/<task-slug>/` when `exec-plan` is active.

Use:

- `tasks/<task-slug>/DOC-IMPACT.md` when `exec-plan` is active;
- `.agents/skills/exec-plan/references/repo-doc-map.md`;
- the nearest nested `AGENTS.md`.

Do not mark the task complete while infrastructure-facing documentation
or operational guidance is stale.
