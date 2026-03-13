# Codex repo skills

This directory is formatted for repo-local Codex skill discovery.

## Included skills

- `frontend`
- `backend`
- `infrastructure`
- `layout-and-design`
- `tech-writer`

## Why this layout works for Codex

- Each skill is narrow and task-specific.
- Each `SKILL.md` starts with `name` and `description` metadata.
- Long standards live in `references/` so metadata stays sharp and the full rules load only when the skill is chosen.

## How to verify in Codex CLI

1. Put `.agents/skills/` at the repository root.
2. Start Codex CLI in the repo.
3. Run `/skills` and confirm the five skills are listed.
4. Test explicit invocation with prompts such as:
   - `$backend review this Laravel controller`
   - `$frontend refactor this Vue page`
   - `$layout-and-design audit this modal`
   - `$infrastructure review this deploy script`
   - `$tech-writer rewrite this IMPLEMENTATION section`

## Notes

- Keep repo-wide invariants in `AGENTS.md`.
- Keep specialist workflows in these skills.
- If one task spans multiple areas, Codex can use more than one skill.
