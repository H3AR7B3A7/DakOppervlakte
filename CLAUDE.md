<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Dakoppervlakte — CLAUDE.md

Project richtlijnen voor AI-assistenten. Lees dit volledig voordat je code schrijft.

---

## Architecture

| Layer | Where | Rule |
|---|---|---|
| Pages | `app/page.tsx` | Shell only. No logic, no state. |
| Smart components | `components/DakoppervlakteApp.tsx` | State lives here via hooks. No raw style objects. |
| Dumb components | `components/sidebar/`, `components/map/` | Props-only. No API calls, no global state. |
| Pure UI | `components/ui/` | Stateless. Primitives + children only. |
| Hooks | `hooks/` | One concern per hook. Encapsulate all side effects. |
| API routes | `app/api/` | Proxy for external services + DB access. |

## Key files

- `src/components/DakoppervlakteApp.tsx` — main smart component, all orchestration
- `src/hooks/useGoogleMaps.ts` — Google Maps script + instance lifecycle
- `src/hooks/usePolygonDrawing.ts` — drawing FSM (idle → drawing → finish)
- `src/hooks/useUsageCounter.ts` — global counter fetch + increment
- `src/hooks/useSearchHistory.ts` — user history fetch + persist
- `src/lib/types.ts` — shared types (`Search`, `PolygonEntry`, `DrawingMode`)
- `src/lib/utils.ts` — pure helpers (`formatArea`, `generatePolygonColor`, `normalizeHeading`)
- `src/lib/db.ts` — Neon client factory

## API rules

- `/api/counter` and `/api/building-polygon` are **public** — no `auth().protect()`
- `/api/searches` is **protected** — always check `auth()` and return 401 if no `userId`
- All routes that touch the DB must handle `table does not exist` errors gracefully
- Add a `debug` field to error responses so the failure point is visible

## Testing rules (short version)

> **Test use cases, not implementations. Mock as little as possible.** See README.md for the full philosophy.

1. **Write tests from the user's perspective** — actions and observable outcomes, never internal state or class names
2. **Tests must fail when the feature breaks** — if you can delete the implementation and the test passes, it's wrong
3. **Group by scenario, not by component** — `describe('User draws a polygon')`, not `describe('DrawingHint')`
4. **Mock as little as possible** — only mock true external systems (Google Maps, Clerk, network). Never mock your own hooks, components, or pure functions. If something is hard to test without mocking, improve the design instead.
5. **Mock at the boundary** — when you must mock, do it at the outermost edge (the external SDK or `fetch`), never inside your own codebase
6. **API tests use the real route handler** — import and call it with a `Request`; assert on `Response` status + body

## Tooling

- **Test runner**: Vitest (`npm test` / `npm run test:ui`)
- **Component testing**: `@testing-library/react` + `@testing-library/user-event`
- **Setup file**: `vitest.setup.ts` — imports `@testing-library/jest-dom` and installs the Google Maps stub
- **Google Maps stub**: `src/__tests__/__mocks__/googleMaps.ts` — imported once in setup, never per-test

## Workflows

- **New component**: create in the correct layer, export from the barrel `index.ts` in that folder
- **New API data**: add the type to `src/lib/types.ts`, fetch in a hook, pass result as props
- **New test**: check the use-case list in README.md first; add to the relevant `__tests__/` file; do not mock unless forced to
- **Debugging**: add a `debug` field to JSON responses, use `console.error` in catch blocks
- **Development**: After making changes, ALWAYS run `npm run check` and `npm test`.
- **Testing Commands**:
  - Run all tests: `npm test`
  - Run single test file: `npx vitest run <path-to-file>`
  - Watch mode: `npm run test:watch`
