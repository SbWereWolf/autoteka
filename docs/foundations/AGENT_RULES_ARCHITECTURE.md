# AGENT RULES ARCHITECTURE

This document explains how agent instructions are split in this
repository.

## 1. Rule ownership

### Root `AGENTS.md`

Owns repository-wide invariants:

- language;
- canonical workflow;
- planning trigger;
- task-record policy;
- verification contract;
- commit policy;
- forbidden paths;
- skill routing model.

### Nested `AGENTS.md`

Owns local instructions for a subtree, for example:

- local placement rules;
- local test selection;
- local doc impact;
- local operational caveats.

A nested file should refine, not duplicate, the root invariants.

### Skills

Skills own reusable specialist behavior:

- how to approach a frontend task;
- how to approach backend placement;
- how to approach `system-tests` selection;
- how to approach repo tooling changes.

A skill does not replace the root or local `AGENTS.md`.

### Reference docs

Reference docs explain details and examples. They support execution but
should not become the only place where a critical invariant is defined.

This repository uses two main reference groups:

- skill-adjacent references under `.agents/skills/**`;
- stable domain standards under `docs/foundations/*-standard.md`.

Domain standard docs should capture stable conventions, preferred
patterns, and anti-patterns. They should support the matching domain
skill, not compete with root or nested instructions.

## 2. Execution layering

When working on a file, the agent should think in this order:

1. root `AGENTS.md`
2. nearest relevant nested `AGENTS.md`
3. selected skill
4. supporting references

## 3. Why this split exists

This repo spans several distinct surfaces:

- Vue frontend
- two Laravel runtimes
- shared backend package
- system tests
- infrastructure scripts
- repository workflow tooling
- multiple doc families

One flat rule file becomes noisy and underspecified. The layered split
keeps the root strict while letting local rules stay concrete.

## 4. Drift prevention

When a workflow changes, update the owning layer first and then update
any supporting layers that mention the same behavior.

Examples:

- verification contract changed -> root `AGENTS.md`, relevant skill,
  and supporting doc references
- local backend placement changed -> nearest backend `AGENTS.md`, the
  `backend` skill if needed, and `docs/foundations/backend-standard.md`
- local frontend interaction guidance changed -> nearest frontend
  `AGENTS.md`, the `frontend` skill if needed, and
  `docs/foundations/frontend-standard.md`
- infrastructure operational practice changed -> nearest infra
  `AGENTS.md`, the `infrastructure` skill if needed, and
  `docs/foundations/infrastructure-standard.md`
- doc family ownership changed -> root or docs `AGENTS.md` plus doc map

## 5. Review expectation

Every agent-rule change must be reviewed for:

- ownership;
- precedence;
- stale references;
- duplicated instructions;
- contradictory examples.

## Restored root invariants

The root `AGENTS.md` also carries three explicit global invariants that
must not be delegated to skills:

- conflict resolution priority for safety, verification, commits, task
  records, and the code-change loop;
- environment readiness policy for blocked execution paths;
- default script exit-code interpretation when a script does not define
  a narrower contract.

## 6. Root-file design goal

The root `AGENTS.md` should stay short, strict, and accurate. Keep only
repository-wide invariants there. Move local detail to nested
`AGENTS.md`, reusable workflow behavior to skills, and long examples or
maps to reference docs.

## 7. Domain standards design goal

`backend-standard.md`, `frontend-standard.md`, and
`infrastructure-standard.md` should stay stable and low-churn. Use them
for domain conventions and anti-patterns that outlive a single task.

Do not move short-lived workflow mechanics there when those mechanics
belong in root rules, nested `AGENTS.md`, or a skill.
