# scripts/agent local instructions

These instructions refine the root and `scripts/AGENTS.md` for
`scripts/agent/`.

## Scope

This subtree defines the repository workflow entry points used by
agents: preflight, changed-files, lint-changed, test-changed, verify,
and commit wrappers.

## Rules

1. Treat changes here as workflow-semantic changes.
2. Prefer `exec-plan` when changing verification, commit, or routing
   semantics.
3. Validate the changed scripts directly with safe flags where
   possible.
4. When changing `verify.ps1`, state the cache limitation explicitly.
5. Keep PowerShell and shell wrapper expectations aligned.
