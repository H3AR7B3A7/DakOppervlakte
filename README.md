# Dakoppervlakte

A roof surface calculation tool built with Next.js and Google Maps. Users search for an address, detect building outlines, draw polygons on a satellite map, and calculate roof areas. Supports multiple languages (Dutch, English, French) and persists search history per user.

## Prerequisites

- **Node.js** >= 20
- **Google Cloud** account with the Maps JavaScript API enabled
- **Clerk** account for authentication
- **Neon** Postgres database (or the Vercel Neon integration)

## Getting Started

```bash
git clone <repo-url> && cd DakOppervlakte

cp .env.example .env
# Fill in the environment variables (see table below)

npm install
npm run db:init
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

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

## Environment Variables

| Variable | Purpose | Where to obtain |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend auth key | [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | Clerk server-side auth key | [Clerk Dashboard](https://dashboard.clerk.com) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps JavaScript API key | [Google Cloud Console](https://console.cloud.google.com) |
| `DATABASE_URL` | Neon Postgres connection string | [Neon Console](https://console.neon.tech) or Vercel integration |

## Tech Stack

- **Framework** -- Next.js 16 (App Router) with React 19
- **Language** -- TypeScript 5
- **Auth** -- Clerk
- **Database** -- Neon Postgres (raw SQL via `@neondatabase/serverless`)
- **Maps** -- Google Maps JavaScript API
- **i18n** -- next-intl (NL, EN, FR)
- **Styling** -- Inline React `style={{}}` objects (Tailwind CSS 4 installed for CSS variables/resets in `globals.css`)
- **Testing** -- Vitest, Testing Library, jsdom, v8 coverage

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

## Documentation

Additional architecture documentation, sequence diagrams, and API response examples are available in the [`docs/`](docs/) folder.
