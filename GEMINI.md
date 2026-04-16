# Dakoppervlakte

Roof-area measurement tool. Users search an address on Google Maps, draw polygons on rooftops, and get area calculations. Auth via Clerk, i18n via next-intl (nl/en/fr, default nl), DB on Neon Postgres.

## Build & Test Commands

```bash
npm run dev          # Start dev server
npm run build        # Type-check + build
npm run check        # Type-check (tsc --noEmit) + lint (eslint --fix) -- run before considering work complete
npm test             # Vitest run with coverage
npm run test:watch   # Vitest watch mode
npm run test:ui      # Vitest browser UI
npx vitest run src/__tests__/path/to/file.test.ts   # Single file
npx vitest run -t "test name pattern"                # Single test by name
```

## Architecture

| Layer | Location | Rules |
|---|---|---|
| Pages | `src/app/[locale]/page.tsx` | Shell only. No logic, no state. |
| Smart components | `src/components/DakoppervlakteApp.tsx` | Orchestrates hooks + state. No raw fetch calls. |
| Dumb components | `src/components/sidebar/`, `src/components/map/` | Props-only. No API calls, no global state. |
| UI primitives | `src/components/ui/` | Stateless. Props + children only. Barrel-exported via `index.ts`. |
| Hooks | `src/hooks/` | One concern per hook. All side effects encapsulated here. |
| API routes | `src/app/api/` | Proxy external services + DB access. |
| Types | `src/lib/types.ts` | Shared types: `Search`, `PolygonEntry`, `PolygonData`, `DrawingMode` |
| Utils | `src/lib/utils.ts` | Pure helpers: `generatePolygonColor`, `normalizeHeading` |

## Entry Points

- `src/components/DakoppervlakteApp.tsx` -- main smart component, all orchestration
- `src/hooks/useGoogleMaps.ts` -- Google Maps script loading + map instance lifecycle
- `src/hooks/usePolygonDrawing.ts` -- drawing FSM (idle <-> drawing), polygon visibility by heading/tilt
- `src/hooks/useUsageCounter.ts` -- global usage counter fetch + increment
- `src/hooks/useSearchHistory.ts` -- per-user search history fetch + persist
- `src/lib/db.ts` -- Neon serverless client factory (`getDb()`)
- `src/proxy.ts` -- Clerk + next-intl middleware (NOT named `middleware.ts`)
- `src/i18n/routing.ts` -- locale config: nl (default), en, fr

## Path Aliases

`@/*` maps to `./src/*` (tsconfig.json)

## API Rules

| Route | Auth | Notes |
|---|---|---|
| `/api/counter` | Public | Usage counter. Auto-creates table on first call. |
| `/api/building-polygon` | Public | Proxies Nominatim for building geometry. |
| `/api/searches` | Protected | `auth()` required, returns 401 without `userId`. Upserts on `(user_id, address)`. |
| `/api/init` | Public | DB table initialization. |

- `/api/counter` handles `table does not exist` errors gracefully (auto-creates table and retries). Other DB routes (`/api/searches`) do not.
- `/api/building-polygon` includes a `debug` field in its fallback response. Other routes do not.

## Testing Patterns

- **Framework**: Vitest + jsdom + `@testing-library/react` + `@testing-library/user-event`
- **Setup**: `vitest.setup.ts` imports `@testing-library/jest-dom` and global Google Maps stub
- **Google Maps stub**: `src/__tests__/__mocks__/googleMaps.ts` -- installed once globally, never per-test. `computeArea` returns 100 m^2 by default; override with `vi.mocked(...).mockReturnValue`
- **Philosophy**: Test use cases, not implementations. Group by scenario (`describe('User draws a polygon')`), not by component
- **Mocking**: Mock only external boundaries (Google Maps, Clerk, fetch). Never mock own hooks/components/utils
- **API tests**: Import route handler directly, call with `Request`, assert on `Response` status + body
- **Custom render**: Component tests should import `render` from `src/__tests__/test-utils.tsx` (wraps in `NextIntlClientProvider` with nl locale and messages), not from `@testing-library/react` directly
- **Coverage**: v8 provider; excludes `src/app/api/**`, `src/lib/init-db.ts`, test files

## Env Vars

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   # Clerk auth
CLERK_SECRET_KEY                    # Clerk server-side
NEXT_PUBLIC_GOOGLE_MAPS_KEY         # Google Maps JS API
DATABASE_URL                        # Neon Postgres connection string
```

## Key Gotchas

- **Middleware file is `src/proxy.ts`**, not `middleware.ts`. Combines Clerk auth + next-intl. Skips i18n for `/api/` routes.
- **Inline styles for components** -- component styling uses inline `style={{}}` objects. Tailwind is installed for CSS resets/variables in `globals.css`. `layout.tsx` uses `className` for font and layout. No CSS modules.
- **Polygon visibility is orientation-based** -- polygons store `heading` and `tilt` at creation time; only visible when map orientation matches (via `normalizeHeading`)
- **Search save is upsert** -- `ON CONFLICT (user_id, address)` updates existing entry instead of creating duplicate
- **Polygons can be excluded** -- `excluded: boolean` on `PolygonEntry` removes from total area calculation
- **Next.js 16** -- APIs and conventions may differ from earlier versions. Check `node_modules/next/dist/docs/` before assuming standard patterns.
- **React 19** -- uses latest React; be aware of breaking changes vs React 18
- **`globals: true`** in vitest config -- `describe`, `it`, `expect`, `vi` available without imports
