# Dakoppervlakte

[![CI](https://github.com/H3AR7B3A7/DakOppervlakte/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/H3AR7B3A7/DakOppervlakte/actions/workflows/ci.yml)

A roof surface calculation tool built with Next.js and Google Maps. Users search for an address, detect building outlines, draw polygons on a satellite map, and calculate roof areas. Supports multiple languages (Dutch, English, French) and persists search history per user.

The app is publicly available at **[https://dak-oppervlakte.vercel.app/](https://dak-oppervlakte.vercel.app/)** -- no setup required to try it.

## Prerequisites

- **Node.js** >= 20
- **Google Cloud** account with the Maps JavaScript API enabled
- **Clerk** account for authentication
- **Neon** Postgres database (or the Vercel Neon integration)

## Getting Started

```bash
git clone <repo-url> && cd DakOppervlakte

cp .env.example .env.local
# Fill in the environment variables (see table below)

npm install
npm run db:init
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

## Environments

| Environment | URL                                  |
|-------------|--------------------------------------|
| Local       | http://localhost:3000                |
| Production  | https://dak-oppervlakte.vercel.app/  |

## Testing

```bash
# Run full suite with coverage
npm test

# Watch mode
npm run test:watch

# Run a single test file
npx vitest run src/__tests__/example.test.ts

# Run tests matching a name pattern
npx vitest run -t "draws a polygon"

# Interactive UI
npm run test:ui
```

## Quality Gate

`npm run check` is the local quality gate. It runs, in order:

1. `npx tsc --noEmit` -- TypeScript type check
2. `biome check --write .` -- Biome lint + format (auto-fix)
3. `npm run check:arch` -- `dependency-cruiser` layering rules
4. `npm run check:raw-styles` -- custom check for raw inline styles outside smart components

CI (`.github/workflows/ci.yml`) runs `npm run check`, `npm test`, and `npm run build` on every push and pull request to `master`.

## Environment Variables

| Variable | Purpose | Where to obtain |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend auth key | [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | Clerk server-side auth key | [Clerk Dashboard](https://dashboard.clerk.com) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps JavaScript API key | [Google Cloud Console](https://console.cloud.google.com) |
| `DATABASE_URL` | Neon Postgres connection string | [Neon Console](https://console.neon.tech) or Vercel integration |

## Tech Stack

- **Framework** -- Next.js 16 (App Router) with React 19
- **Language** -- TypeScript 6
- **Auth** -- Clerk
- **Database** -- Neon Postgres (raw SQL via `@neondatabase/serverless`)
- **Maps** -- Google Maps JavaScript API
- **i18n** -- next-intl (NL, EN, FR)
- **Styling** -- Inline React `style={{}}` objects (Tailwind CSS 4 installed for CSS variables/resets in `globals.css`)
- **Testing** -- Vitest, Testing Library, jsdom, v8 coverage
- **Linter / formatter** -- Biome 2 (no semicolons, single quotes, 100-char lines)
- **Architecture check** -- dependency-cruiser (enforces CLAUDE.md layering; `npm run check:arch`)

## Architecture

The codebase uses a three-layer component model: a single **smart** orchestrator (`DakoppervlakteApp`) wires six custom hooks and passes data into **dumb** presentational components (`components/sidebar/`, `components/map/`), which in turn compose **pure** UI primitives (`components/ui/`). Side effects live exclusively in hooks. These layering rules are enforced in CI by `dependency-cruiser` (`npm run check:arch`). See [`docs/architecture.md`](docs/architecture.md) for the full diagram and layer rules.

## Project Structure

```
src/
  app/          # Next.js pages and API routes
  components/   # UI components (smart, dumb, pure)
  hooks/        # Custom React hooks (one concern per hook)
  lib/          # Shared types, utilities, DB client
  i18n/         # Internationalization configuration
  __tests__/    # Test files
messages/       # Translation files (nl, en, fr)
docs/           # Architecture docs and API examples
```

## Deployment

The stack is optimized for [Vercel](https://vercel.com):

1. Connect the repository in the Vercel dashboard
2. Set the four environment variables (see table above)
3. Enable the Vercel Neon integration (auto-injects `DATABASE_URL`)
4. Deploy -- Vercel auto-detects the Next.js framework

Production: [https://dak-oppervlakte.vercel.app/](https://dak-oppervlakte.vercel.app/)

## Troubleshooting

- **`DATABASE_URL must be set in .env.local`** -- the env file must be named `.env.local`, not `.env`. Copy `.env.example` to `.env.local` and fill in the values.
- **Map is blank or fails to load** -- verify `NEXT_PUBLIC_GOOGLE_MAPS_KEY` is set, that the Maps JavaScript API is enabled in Google Cloud, and that `http://localhost:3000` is an allowed HTTP referrer for the key.
- **`npm run db:init` fails with a Neon error** -- confirm `DATABASE_URL` is a valid Neon connection string (not a placeholder) and that the Neon project is not suspended.
- **`auth()` / Clerk 401s** -- ensure both `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set; a missing secret key silently breaks server routes.

More known pitfalls and their causes are collected in [`docs/gotchas.md`](docs/gotchas.md).

## Documentation

Additional architecture documentation, sequence diagrams, and API response examples are available in the [`docs/`](docs/) folder.
