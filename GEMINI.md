# Dakoppervlakte

## Architecture

| Layer | Where | Rule |
|---|---|---|
| Pages | `src/app/[locale]/page.tsx` | Shell only. No logic, no state. |
| Smart components | `src/components/DakoppervlakteApp.tsx` | App state lives here via hooks. No raw `style={{}}` — enforced by `scripts/check-raw-styles.mjs` (currently scans `DakoppervlakteApp.tsx` + `Header.tsx`). |
| Dumb components | `src/components/{sidebar,map,layout}/` | Props-in, callbacks-out. Local UI state and `useTranslations` are fine; no API calls or global state. |
| Pure UI | `src/components/ui/` | Stateless. Primitives + children only. |
| Hooks | `src/hooks/` | One concern per hook. Encapsulate all side effects. |
| Domain | `src/domain/{geo,orientation,polygon,search}/` | Pure TS (types + helpers). No React, no framework imports — enforced by `domain-is-pure`. |
| Infrastructure | `src/lib/infrastructure/` | DB / external-service adapters. Governed by `infrastructure-boundaries`. |
| API routes | `src/app/api/` | Proxy for external services + DB access. |

## Key files

- `src/components/DakoppervlakteApp.tsx` — thin orchestrator; wires 6 hooks (`useUsageCounter` called twice) + `Header`
- `src/components/Header.tsx` — logo, usage counts, Clerk auth buttons
- `src/hooks/useGoogleMaps.ts` — Google Maps script + instance lifecycle
- `src/hooks/useMapOrientation.ts` — heading/tilt/zoom state, bidirectional map sync
- `src/hooks/useGeocoding.ts` — address lookup, geocoding API, error state
- `src/hooks/usePolygonDrawing.ts` — drawing FSM: `idle ↔ drawing` (`finishPolygon` returns to `idle`)
- `src/hooks/useUsageCounter.ts` — parameterised counter (`/api/counter` default, also `/api/autogen-counter`); fetch + increment with per-address dedupe in `localStorage`
- `src/hooks/useSearchHistory.ts` — history fetch + save + delete
- `src/lib/types.ts` — live/browser types only: `PolygonEntry`, `DrawingMode`
- `src/lib/db.ts` — Neon client factory (`getDb()` reads `DATABASE_URL`)
- `src/domain/{geo,orientation,polygon,search}/` — pure helpers + types per slice (e.g. `normalizeHeading`, `generatePolygonColor`, `Search`, `PolygonData`)

## API rules

- Public (no auth): `/api/counter`, `/api/autogen-counter`, `/api/building-polygon`, `/api/init`
- Protected: `/api/searches` — always check `auth()` and return 401 if no `userId`
- DB-touching routes should handle `table does not exist` gracefully and include a `debug` field in error responses. Done in `/api/counter`, `/api/autogen-counter`, `/api/building-polygon`. `/api/searches` is the current outlier and should be brought into line when touched.

## Testing rules (short version)

> **Test use cases, not implementations. Mock as little as possible.** See README.md for the full philosophy.

1. **Write tests from the user's perspective** — actions and observable outcomes, never internal state or class names
2. **Tests must fail when the feature breaks** — if you can delete the implementation and the test passes, it's wrong
3. **Group by scenario, not by component** — `describe('User draws a polygon')`, not `describe('DrawingHint')`
4. **Mock as little as possible** — only mock true external systems (Google Maps, Clerk, network). Never mock your own hooks, components, or pure functions. If something is hard to test without mocking, improve the design instead.
5. **Mock at the boundary** — when you must mock, do it at the outermost edge (the external SDK or `fetch`), never inside your own codebase
6. **API tests use the real route handler** — import and call it with a `Request`; assert on `Response` status + body

## Environment

Copy `.env.example` to `.env.local` (not `.env` — Next.js only auto-loads `.env.local` for local dev).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (auto-injected by Vercel Neon integration in prod) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk backend key |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps JS API key |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | `tsc --noEmit` then `next build` |
| `npm run start` | Serve the production build |
| `npm run check` | Full pipeline: `tsc --noEmit` → `biome check --write .` → `check:arch` → `check:raw-styles` |
| `npm run lint` | Biome only (`biome check --write .`) |
| `npm test` | All tests once (`vitest run --coverage`) |
| `npx vitest run <path>` | Single test file |
| `npx vitest -t "<name>"` | Single test by name |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:init` | Throwaway bootstrap (`tsx src/lib/init-db.ts`) — slated for replacement by real migrations; see `docs/migrations.md` |

**Always run `npm run check` and `npm test` before considering work complete.**

## Tooling

- **Test runner**: Vitest + jsdom; `@testing-library/react` + `@testing-library/user-event`
- **Setup file**: `vitest.setup.ts` — imports `@testing-library/jest-dom` and installs the Google Maps stub
- **Google Maps stub**: `src/__tests__/__mocks__/googleMaps.ts` — installed once in setup, never per-test
- **i18n render wrapper**: `src/__tests__/test-utils.tsx` — wraps components in `NextIntlClientProvider` with `locale='nl'`. Import `render` from there, not from `@testing-library/react` directly.
- **Linter / formatter**: Biome (`biome.json`); no semicolons, single quotes, 100-char lines
- **Architecture check**: `dependency-cruiser` (`.dependency-cruiser.cjs`); enforces `ui-is-pure`, `dumb-no-hooks-or-app`, `hooks-no-components-or-app`, `below-app-no-app`, `domain-is-pure`, `infrastructure-boundaries`, `no-circular`
- **Raw-style check**: `scripts/check-raw-styles.mjs` — blocks `style={{...}}` in smart components (currently scans `DakoppervlakteApp.tsx` + `Header.tsx` only)

## Workflows

- **New component**: create in the correct layer, export from the barrel `index.ts` in that folder
- **New API data**: add the type to `src/domain/<slice>/types.ts` (or `src/lib/types.ts` only for live `google.maps` objects); fetch in a hook; pass the result as props. Types under `src/lib/` cannot import from `src/domain/` — the `domain-is-pure` rule will reject it.
- **New test**: check the use-case list in README.md first; add to the relevant `src/__tests__/` file; import `render` from `src/__tests__/test-utils.tsx`; do not mock unless forced to
- **Debugging**: add a `debug` field to JSON responses, `console.error` in catch blocks
- **Before committing**: `npm run check` (typecheck + lint + arch + raw-styles) then `npm test`. Do not skip.

## Further reading

- `README.md` — full testing philosophy and use-case list
- `docs/gotchas.md` — known surprising behaviours (unreachable `noBuildingFound` error, counter fires on search not save). Tests should NOT codify these — fix the bug instead.
- `docs/architecture.md`, `docs/adr/` — architectural decisions
- `docs/migrations.md` — planned move off `init-db.ts` to real DB versioning
