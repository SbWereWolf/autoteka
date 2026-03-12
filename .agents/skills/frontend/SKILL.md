---
name: "frontend"
description: "Use for Vue 3.5 + Vite 5 + Tailwind 4.2 frontend work in this repo: components, state, pages, API client usage, frontend tests, and code review of frontend changes. Do not use for pure layout/accessibility tasks when no Vue/frontend code changes are needed; use layout-and-design for that."
---

# Frontend

Apply this skill for `frontend/` work.

## Stack

Work only inside this stack:

- Vue 3.5+ Composition API
- Vite 5+
- Tailwind CSS 4.2+
- HTML5
- CSS custom properties

Do not switch to React, Nuxt, Bootstrap, jQuery, SCSS, or CSS-in-JS unless the user explicitly asks to go outside the approved stack.

## What belongs here

Use this skill when the task changes:

- Vue components, pages, state, composables, API client usage
- frontend tests
- same-origin API integration through `VITE_API_BASE_URL`
- theme editor UI behavior

If the task is mainly about semantics, landmarks, headings, forms, focus, keyboard support, modal accessibility, or ARIA decisions, also load `layout-and-design`.

## Rules

1. Build from semantic HTML first, then state/behavior, then visual styling.
2. Use Composition API and keep component responsibility narrow.
3. Keep network access, data normalization, and shared state outside random presentational components.
4. Use Tailwind as the main styling mechanism.
5. Use CSS variables for theme/design tokens.
6. Do not solve document structure with Tailwind classes alone.
7. Default `VITE_API_BASE_URL` to `/api/v1` for same-origin operation.
8. When changing frontend behavior, update or add the smallest relevant test.

## How to place code

- UI and local UI behavior -> component/page/composable in `frontend/src/`
- API glue -> frontend API client layer
- Shared visual tokens -> CSS vars / theme layer
- Test for changed behavior -> `frontend/tests`, `frontend/e2e`, or matching frontend test area

## How to answer

When implementing or reviewing frontend work:

- state which files should change
- keep examples small and repo-native
- call out any accessibility impact explicitly
- mention required tests or checks

Read `references/frontend-standard.md` for the full repo-specific rules and examples.
