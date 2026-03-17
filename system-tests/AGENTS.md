# System-tests local instructions

These instructions refine the root `AGENTS.md` for `system-tests/`.

## Primary skill

Use `system-tests`.

## Profile selection

Choose the lightest profile that proves the changed behavior:

- quick local HTTP/smoke -> `npm run test:quick-local`
- quick dev runtime -> `npm run test:quick-dev`
- dev UI headless -> `npm run test:ui-headless-dev`
- local visual investigation -> `npm run test:ui-headed-local`
- prod-like final pass -> use the relevant `*-prod` profile only when
  the task really needs that level of evidence

## Rules

1. Do not widen a quick HTTP task into a UI matrix without reason.
2. Keep assertions behavior-first and observable.
3. When tests correspond to docs or manuals, keep the mapping honest.
4. If the task changes only the tests, do not claim product behavior
   changed unless the runtime was also verified.
