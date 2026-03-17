# Frontend local instructions

Apply these rules when the current working area is `frontend/`.

## Scope

Primary skill: `frontend`.
Also use `layout-and-design` when semantics, focus, keyboard behavior,
forms, headings, or ARIA are materially affected.

## Test selection

Choose the smallest sufficient test surface:

- component/state/local UI behavior -> `npm run test:unit`
- API client or frontend/backend contract -> `npm run test:api:online`
  when backend availability is part of the change
- browser-only interaction or visual flow -> `npm run test:ui:mock`
- same-origin user flow with real backend -> `npm run test:e2e` or the
  closest supported `system-tests` profile

Do not rely on root `verify.ps1` as the only evidence when frontend test
files, Playwright config, Vitest config, or API integration tests change.

## Repo-native placement

- Presentational and local interaction logic -> components/pages/
  composables in `frontend/src/`
- Shared state -> `frontend/src/state.ts` or a narrow shared layer
- API glue -> `frontend/src/api/`
- Theme tokens -> CSS variables and theme layer
- Frontend scripts -> `frontend/scripts/`

## Doc impact

When behavior, startup, env usage, or test commands change, review at
least these docs:

- `frontend/README.md`
- `README.md`
- `docs/manual/USER_MANUAL.md`
- `docs/manual/TESTING.md`
- `docs/foundations/IMPLEMENTATION.md`
