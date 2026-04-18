# Dakoppervlakte Documentation

Interactive web application for calculating roof surface areas using Google Maps. Users search an address, draw polygons on the satellite view, and get area calculations in square meters.

## Architecture

- [Architecture Overview](architecture.md) -- component layers, data flow, external integrations

## Flow Diagrams

| Flow | Diagram | Description |
|------|---------|-------------|
| Address Search | [address-search.mermaid](address-search.mermaid) | User searches address, map navigates to location |
| Polygon Drawing | [polygon-drawing.mermaid](polygon-drawing.mermaid) | User draws polygon on map, area is calculated |
| Save Calculation | [save-calculation.mermaid](save-calculation.mermaid) | Authenticated user saves calculation to history |
| Restore Search | [restore-search.mermaid](restore-search.mermaid) | User restores a previously saved search |
| Building Detection | [building-detection.mermaid](building-detection.mermaid) | API detects building geometry from coordinates |
| Auth Flow | [auth-flow.mermaid](auth-flow.mermaid) | Clerk sign-in, session cookie, server-side `auth()` check on `/api/searches` |

## State & Structure Diagrams

| Entity | Diagram | Description |
|--------|---------|-------------|
| Hook Composition | [hook-composition.mermaid](hook-composition.mermaid) | How DakoppervlakteApp delegates to 6 hooks, their dependencies, and state ownership |
| Drawing Mode | [drawing-mode-states.mermaid](drawing-mode-states.mermaid) | FSM for the polygon drawing lifecycle |
| Polygon Visibility | [polygon-visibility.mermaid](polygon-visibility.mermaid) | Per-polygon Visible/Hidden FSM driven by map heading + tilt |
| Domain Model | [domain-model.mermaid](domain-model.mermaid) | TypeScript types: PolygonData (persisted) vs PolygonEntry (runtime) vs Search |

## Architecture Decisions

See [docs/adr/](adr/) for Architecture Decision Records (context, decision, consequences, rejected alternatives).

| ADR | Title |
|-----|-------|
| [0001](adr/0001-client-side-area-calculation.md) | Compute polygon area in the browser |
| [0002](adr/0002-upsert-by-user-and-address.md) | Upsert saved searches by (user_id, address) |
| [0003](adr/0003-orientation-based-polygon-visibility.md) | Hide polygons when map orientation doesn't match draw-time orientation |
| [0004](adr/0004-public-vs-protected-api-routes.md) | Split API routes into public and Clerk-protected sets |
| [template](adr/0000-template.md) | ADR template |

## Reference

| Document | Purpose |
|----------|---------|
| [Glossary](glossary.md) | Project-specific terms: GRB, UrbIS, WFS, PolygonData vs PolygonEntry, headingsMatch, `debug` field, etc. |
| [Gotchas](gotchas.md) | Tribal knowledge — behaviours that have surprised contributors |
| [Migrations](migrations.md) | Current init-db approach, its limitations, and the drizzle-kit roadmap |

## Example Payloads

| Payload | File | Description |
|---------|------|-------------|
| Search POST | [search-upsert.example.json](search-upsert.example.json) | Request body for saving a calculation |
| Search GET | [search-response.example.json](search-response.example.json) | Response from fetching user search history |
| Building Polygon | [building-polygon-response.example.json](building-polygon-response.example.json) | Response from building detection API |
| Autogen Counter | [autogen-counter-response.example.json](autogen-counter-response.example.json) | GET + POST response shapes for /api/autogen-counter |
| Error Responses | [error-responses.example.json](error-responses.example.json) | Error response shapes for all API endpoints |

## Testing

The project uses Vitest + jsdom + `@testing-library/react` + `@testing-library/user-event`. Coverage target is 80%+, currently spanning 41 test files under `src/__tests__/`.

| Aspect | Convention |
|--------|-----------|
| Style | BDD-style Given-When-Then, grouped by user scenario (`describe('User draws a polygon')`) |
| Mocking | Mock only external boundaries: Google Maps API, Clerk, fetch. Never mock own hooks/components/utils |
| Google Maps stub | Global stub in `src/__tests__/__mocks__/googleMaps.ts`, installed once in `vitest.setup.ts` |
| Custom render | `src/__tests__/test-utils.tsx` wraps components in `NextIntlClientProvider` (nl locale) |
| Hook tests with i18n | Use `renderHookWithIntl` helper from test-utils for hooks that call `useTranslations()` |
| API route tests | Import handler directly, call with `Request`, assert on `Response` status + body |
| Coverage provider | v8; excludes `src/app/api/**`, `src/lib/init-db.ts`, test files |

```bash
npm test               # Run all tests with coverage
npm run test:watch     # Watch mode
npx vitest run src/__tests__/path/to/file.test.ts   # Single file
```

## API Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/counter` | Public | Get global address-search count |
| POST | `/api/counter` | Public | Increment global address-search count |
| GET | `/api/autogen-counter` | Public | Get global auto-generated-polygon count |
| POST | `/api/autogen-counter` | Public | Increment global auto-generated-polygon count |
| GET | `/api/searches` | Protected (Clerk) | Fetch user's saved searches |
| POST | `/api/searches` | Protected (Clerk) | Save or update a calculation |
| DELETE | `/api/searches?id=<id>` | Protected (Clerk) | Delete a saved search |
| GET | `/api/building-polygon?lat=&lng=` | Public | Detect building geometry at coordinates (GRB Vlaanderen, UrbIS Brussels fallback) |
| GET | `/api/init` | Public | Initialize database tables |

## Environment Variables

| Variable | Required | Description | Where to obtain | Example value |
|----------|----------|-------------|-----------------|---------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key, used client-side for authentication UI components | [Clerk Dashboard](https://dashboard.clerk.com) | `pk_live_...` |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key, used server-side by Clerk middleware and `auth()` calls | [Clerk Dashboard](https://dashboard.clerk.com) | `sk_live_...` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Yes | Google Maps JavaScript API key, used client-side to load the Maps SDK | [Google Cloud Console](https://console.cloud.google.com) | `AIza...` |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string, used server-side by API routes via `@neondatabase/serverless` | Auto-injected by Vercel Neon integration, or from [Neon Console](https://console.neon.tech) | `postgresql://...` |

## API Response Examples

### GET `/api/counter`

Returns the current global calculation count. Falls back to `0` if the table does not exist yet.

```json
{ "count": 42 }
```

### POST `/api/counter`

Increments the global calculation count by one and returns the new value.

```json
{ "count": 43 }
```

### DELETE `/api/searches?id=42`

Deletes a saved search by ID. Requires Clerk authentication.

```json
{ "ok": true }
```

### GET `/api/init`

Initializes the database tables (`searches`, `usage_counter`) and seeds the counter row.

```json
{ "status": "\u2705 Database tables created and seeded" }
```

## External Integrations

| Service | Purpose | URL | Key |
|---------|---------|-----|-----|
| Google Maps JavaScript API | Map display, geocoding, polygon drawing, area calculation | https://maps.googleapis.com/maps/api/js | `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Clerk | Authentication, user management | https://clerk.com | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| Neon PostgreSQL | Serverless database for searches and usage counters | https://neon.tech | `DATABASE_URL` |
| GRB Vlaanderen (WFS) | Building-footprint polygons for Flanders | https://geo.api.vlaanderen.be/GRB/wfs | (no key required) |
| UrbIS Brussels (WFS) | Building-footprint polygons for the Brussels-Capital region | https://geoservices-urbis.irisnet.be/geoserver/UrbIS/wfs | (no key required) |

## Getting Started

### Prerequisites

- Node.js 20+ (required by React 19 / Next.js 16)
- A Google Maps API key with **Maps JavaScript API** and **Geocoding API** enabled
- A Clerk account with a project configured for your domain
- A Neon PostgreSQL database (or the Vercel Neon integration)

### Local Setup

```bash
git clone <repo-url> && cd DakOppervlakte
cp .env.example .env.local          # Fill in all 4 env vars
npm install
npm run dev                          # Starts at http://localhost:3000
```

### Verify Your Setup

1. `npm run dev` -- the app should open at `http://localhost:3000` and display a satellite map of Belgium
2. Visit `http://localhost:3000/api/init` -- should return `{ "status": "..." }` and create the DB tables
3. The map should load with satellite imagery. If it's grey/blank, check `NEXT_PUBLIC_GOOGLE_MAPS_KEY` and ensure Maps JavaScript API is enabled in Google Cloud Console
4. `npm test` -- all 41 test files should pass with 80%+ coverage

## Deployment

The app is deployed on **Vercel** with the Neon PostgreSQL integration.

**Live:** https://dak-oppervlakte.vercel.app/

### Steps

1. **Import the repo** in the Vercel dashboard
2. **Configure environment variables** -- add all 4 vars from the Environment Variables table above. If using the Vercel Neon integration, `DATABASE_URL` is auto-injected.
3. **Initialize the database** -- after the first deploy, visit `https://<your-domain>/api/init` to create the `searches` and `usage_counter` tables. Alternatively, run `npm run db:init` locally with `DATABASE_URL` pointing to the production database.
4. **Configure Clerk redirect URIs** -- in the Clerk Dashboard, add your Vercel domain to the allowed redirect URLs.

### Database Initialization

There are two ways to initialize the DB schema:

| Method | Command | When to use |
|--------|---------|-------------|
| API route | `GET /api/init` | First deploy on Vercel (no local tooling needed) |
| CLI script | `npm run db:init` | Local development or full schema with migrations |

Note: `npm run db:init` (via `src/lib/init-db.ts`) includes the `polygons JSONB` column and `UNIQUE(user_id, address)` constraint. The `/api/init` route creates a minimal schema -- run `db:init` for the complete setup.

Both init paths are throwaway glue that will be replaced by proper migration tooling — see [migrations.md](migrations.md) for the roadmap.

## Troubleshooting

See [gotchas.md](gotchas.md) for tribal knowledge about non-obvious behaviours (unreachable "no building found" error, counter-increment timing, etc.).

| Problem | Cause | Fix |
|---------|-------|-----|
| `relation "searches" does not exist` | DB not initialized | Visit `/api/init` or run `npm run db:init` |
| Map is grey or blank | Invalid or missing Google Maps key | Check `NEXT_PUBLIC_GOOGLE_MAPS_KEY`; enable Maps JavaScript API + Geocoding API in Google Cloud Console |
| Auth buttons don't appear | Clerk keys misconfigured | Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local` |
| Auth redirects fail | Redirect URI not allowed | Add `http://localhost:3000` (dev) or your Vercel domain to Clerk's allowed redirect URLs |
| Tests fail on fresh clone | Setup file not loading | Ensure `vitest.setup.ts` exists and `vitest.config.mts` references it |
| `Cannot find module '@/...'` | Path alias issue | Check `tsconfig.json` has `"@/*": ["./src/*"]` and restart the dev server |
