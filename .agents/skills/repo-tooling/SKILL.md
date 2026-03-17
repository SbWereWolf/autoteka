---
name: repo-tooling
description: Use for repository workflow mechanics and tooling: scripts, scripts/agent, lint tooling, AGENTS.md, nested AGENTS, Codex skills, subagent configs, commit/verify workflow, and instruction hygiene. Do not use for application business logic or UI work.
---

# Repo tooling

Apply this skill for repository mechanics rather than product behavior.

## What belongs here

Use this skill when the task changes:

- `scripts/*`
- `scripts/agent/*`
- `lint/*`
- `.agents/*`
- `.codex/*`
- `AGENTS.md` or nested `AGENTS.md`
- workflow contracts, verification policy, or agent routing

## Rules

1. Prefer the smallest workflow change that closes the real gap.
2. Do not claim a tooling change is verified by a cached app test gate
   alone.
3. When changing verification or commit behavior, update both the root
   rule and the nearest supporting docs.
4. For agent-rule changes, review instruction layering and remove drift.
5. When changing a script, validate the script directly.
6. Keep paths and commands copy-pasteable.

## Minimum direct checks

Examples:

- `scripts/agent/preflight.ps1` -> run it with `-Json`
- `scripts/agent/changed-files.ps1` -> run it with `-Json`
- `scripts/agent/verify.ps1` -> rerun the baseline gate and state cache
  limitations explicitly
- `AGENTS.md` / skills / subagent configs -> review references, paths,
  and routing examples for staleness

Use `docs/foundations/AGENT_RULES_ARCHITECTURE.md` and
`docs/foundations/CODE_REVIEW.md` as supporting references.
