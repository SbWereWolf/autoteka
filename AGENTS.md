# AGENTS.md

## Language

The agent must write in Russian. Project text artifacts must also 
be in Russian, except where standard English syntax is required 
for a command, flag, API, filename, library, technology name, 
or where English is explicitly required by this document.

If there is no loss of precision between a Russian and an English 
formulation, the agent must choose Russian.

## 0. Canonical Workflow (Mandatory)

Always follow this sequence:

1. preflight
3. implement change
4. verify

Never bypass scripts under [scripts](scripts/agent/).

---

## 0.1 Structural Change Definition

A change is structural if it does at least one of the following:

- adds, removes, splits, or moves modules or packages;
- changes public contracts, schemas, routes, or integration boundaries;
- changes build, runtime, operational, or environment wiring;
- changes shared abstractions used by multiple areas of the system.

---

## 1. Verification Policy

All changes must pass:

[verify](scripts/agent/verify.ps1):
`scripts/agent/verify.ps1 -Staged -LintMode check -TestProfile minimal`

`minimal` profile is quick and must verify:
- frontend unit tests (no browser)
- backend quick tests in [ShopAPI](backend/apps/ShopAPI)
- backend quick tests in [ShopOperator](backend/apps/ShopOperator)

Exit code != 0 = stop.

---

## 1.1 Verification Escalation

Use the default verification command for low-risk isolated changes.

Escalate verification to the strongest repository-supported level when the change touches:

- database schema or migrations;
- authentication, authorization, or permissions;
- money flow, checkout, orders, or inventory consistency;
- shared packages or public contracts;
- deployment, runtime wiring, or environment configuration;
- cross-application integration points.

If stronger automated verification is not available, state that limitation explicitly in the final answer.

---

## 2. Commit Policy

Create commits only when explicitly requested by the user.

If a commit is requested, it must be created only via:

```powershell
"scripts/agent/commit.ps1" `
    -Message "<a short summary of the changes>" `
    -Body "<Explain why the changes were made>" `
    -AISystemName "<AI system name>" `
    -LLMName "<LLM name>"
```

Requirements:
- Message <= 50 chars
- Body multiline (use `\n` as EOL), each line <= 72 chars

Never push to origin or other remotes.

---

## 3. Forbidden Paths

Never commit:

- `operational/*`
- `logs/*`
- `tasks/*`
- `inbox/*`

---

## 4. Multi-Agent Use

Large refactors must use subagents:

- `explorer` → map impact
- `scribe` → implement
- `verifier` → gate
- `commit_curator` → finalize

---

## 5. Output Discipline

Agents must:
- keep explanations brief and decision-relevant
- prefer structured summaries
- state blockers and verification results explicitly
- use skills where applicable

---

## 6. Skill Routing

Before implementing any change, classify the task and load the matching skill from [skills/](.agents/skills/).

Use exactly one primary skill unless the task clearly spans multiple specializations.
If multiple skills apply, choose one primary skill and use others only for narrow subordinate parts.

### 6.1 Primary skills

- `frontend` — Vue 3.5+, Vite 5+, Tailwind 4.2+, component logic, composables, state, forms, client UI behavior.
- `layout-and-design` — semantic HTML, W3C/WHATWG, WCAG, ARIA, landmarks, headings, focus, contrast, target size, modal/dialog behavior.
- `backend` — Laravel 12+, PHP 8.2+, MoonShine 4.8+, ShopAPI, ShopOperator, shared business packages, tests, transactions, placement of backend logic.
- `infrastructure` — Ubuntu 24+, Bash, Docker, Docker Compose, deployment scripts, service wiring, runtime operations, environment configuration.
- `tech-writer` — docs, runbooks, manuals, IMPLEMENTATION, DEPLOY, USER/CLERK/ADMIN manuals, TESTING docs, cross-links between docs and checks.

### 6.2 Skill selection rules

- If the task changes markup semantics, accessibility, form UX, keyboard/focus behavior, use `layout-and-design`.
- If the task changes Vue/Tailwind/client code, use `frontend`.
- If the task changes PHP/Laravel/MoonShine/API/business logic/tests/migrations, use `backend`.
- If the task changes Docker/Compose/Bash/runtime config/ops scripts, use `infrastructure`.
- If the task changes documentation structure, manuals, runbooks, implementation docs, infra docs, or test-case linking, use `tech-writer`.

### 6.3 Boundary rules

- Do not use `frontend` for backend or infrastructure work.
- Do not use `layout-and-design` as a substitute for frontend component architecture.
- Do not use `backend` for infrastructure-only tasks.
- Do not use `tech-writer` for code implementation unless the task is explicitly documentation-first.
- Do not load all skills by default.

### 6.4 Priority when task spans multiple areas

Use this priority order to choose the primary skill:

1. `tech-writer` for documentation deliverables
2. `infrastructure` for runtime and operational changes
3. `backend` for server/business changes
4. `frontend` for client implementation
5. `layout-and-design` for semantic/a11y refinement

When a task spans code + docs, implement with the code skill first and use `tech-writer` only for the documentation part.
When a task spans frontend + accessibility, use `frontend` as primary and `layout-and-design` for markup/a11y decisions.

---

## 7. Conflict Resolution

If a skill instruction conflicts with this file:

1. safety and repository constraints from this file win;
2. verification and commit rules from this file win;
3. domain-specific implementation rules come from the selected skill.

---

## 8. Script exit codes policy (mandatory)

0 = ok
1 = error
2 = arguments validation failed
3 = missing dependency

---

## 9. Environment setup policy

If something required for the task is missing from the environment,
do not search for workarounds and do not substitute other tools.

Instead, clearly tell the user what must be installed or configured,
provide exact steps, and stop until the user confirms the environment
is ready.
