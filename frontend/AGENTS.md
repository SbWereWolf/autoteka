# Frontend local instructions

These instructions refine the root `AGENTS.md` for `frontend/`.

## Primary skill

Use `frontend` unless the task is primarily semantic or accessibility
structure, in which case `layout-and-design` may be primary.

## Verification

The root baseline gate covers quick frontend unit checks for
`frontend/src`, but it does not prove browser-only interaction,
Playwright scenarios, or online API integration.

Use the smallest direct check that proves the changed behavior:

- unit logic -> `npm run test:unit:parallel`
- offline UI behavior -> `npm run test:ui:mock`
- online API behavior -> `API_BASE_URL=... npm run test:api:online`
- browser flow -> `PLAYWRIGHT_BASE_URL=... npm run test:e2e`

Run from `frontend/`.

## Doc impact

When commands, routes, or API configuration assumptions change, update
`frontend/README.md` and any affected manuals.
