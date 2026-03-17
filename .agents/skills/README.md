# Codex repo skills

This directory is formatted for repo-local Codex skill discovery.

## Included skills

### Meta and utility

- `exec-plan`
- `preflight`
- `verify`
- `safe-commit`

### Primary domain skills

- `frontend`
- `backend`
- `infrastructure`
- `layout-and-design`
- `tech-writer`

## Why this layout works for Codex

- Each skill is narrow and task-specific.
- Each `SKILL.md` starts with `name` and `description` metadata.
- Skill descriptions are explicit about when they should and should
  not trigger.
- Long standards live in `references/` so metadata stays sharp and the
  full rules load only when the skill is chosen.
- Reusable scaffolds live in `assets/`.
- Repo-wide invariants stay in `AGENTS.md`, while nested `AGENTS.md`
  files sharpen local behavior near the working subtree.

## Routing model used in this repo

- `exec-plan` is a planning meta-skill for complex work.
- One primary domain skill should own implementation.
- Utility skills support repository workflow and do not replace the
  primary skill.
- Review work follows `docs/foundations/CODE_REVIEW.md` in addition to
  the relevant domain skill.

## How to verify in Codex CLI

1. Put `.agents/skills/` at the repository root.
2. Start Codex CLI in the repo.
3. Run `/skills` and confirm the skills are listed.
4. Test explicit invocation with prompts such as:
   - `$exec-plan plan a structural backend refactor`
   - `$backend review this Laravel controller`
   - `$frontend refactor this Vue page`
   - `$layout-and-design audit this modal`
   - `$infrastructure review this runtime script`
   - `$tech-writer rewrite this IMPLEMENTATION section`

## Notes

- Keep repo-wide invariants in `AGENTS.md`.
- Keep specialist workflows in these skills.
- Keep task-specific execution records under `tasks/<task-slug>/`.
- Keep local subtree-specific rules in nested `AGENTS.md` files rather
  than bloating the root file indefinitely.
