# AGENTS.md

## 0. Canonical Workflow (Mandatory)

Always follow this sequence:

1. preflight
2. journal (if structural change)
3. implement change
4. verify
5. safe-commit

Never bypass scripts under scripts/agent/.

---

## 1. Verification Policy

All changes must pass:

scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal

`minimal` profile is quick and must verify:
- frontend unit tests (no browser)
- backend quick tests in `backend/apps/ShopAPI`
- system quick HTTP profile: `cd system-tests && npm run test:quick-local`

Exit code != 0 = stop.

---

## 2. Commit Policy

Commits must be created only via:

scripts/agent/commit.ps1 -Message "<english message>"

Requirements:
- Subject <= 50 chars
- Blank second line
- Ends with: Author: <name>

---

## 3. Forbidden Paths

Never commit:

- operational/*
- logs/*

---

## 4. Multi-Agent Use

Large refactors must use subagents:

- explorer → map impact
- scribe → implement
- verifier → gate
- commit_curator → finalize

---

## 5. Output Discipline

Agents must:
- Avoid narrative explanations
- Prefer structured summaries
- Use skills where applicable
- 
