# DakOppervlakte

DakOppervlakte is een efficiënte tool voor het berekenen van dakoppervlakken voor zonnepanelen of renovatieprojecten, met automatische detectie van gebouwgeometrieën in België.

## Features

- 🏢 **Automatische Gebouwdetectie**: Gebruik van officiële data van Digitaal Vlaanderen (Basisregisters) en UrbIS (Brussel).
- 🗺 **Kaartintegratie**: Interactieve satellietkaarten met rotatie en tilt-ondersteuning.
- 📐 **Nauwkeurige Oppervlaktemeting**: Directe berekening van de 2D-voetafdruk.
- 💾 **Geschiedenis**: Sla uw berekeningen op met integratie via Clerk.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Maps**: Google Maps JavaScript API
- **Data**: Basisregisters Vlaanderen & UrbIS
- **Database**: Neon Postgres
- **Auth**: Clerk
- **Testing**: Vitest + Testing Library

## Setup

1. Clone de repository.
2. Kopieer `.env.example` naar `.env` en vul de benodigde API-keys in:
   - `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
   - `DATABASE_URL` (Neon Postgres)
   - `CLERK_SECRET_KEY` & `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Installeer dependencies: `npm install`
4. Start de ontwikkelserver: `npm run dev`
5. Voer tests uit: `npm test`

## Deployment

De applicatie is geoptimaliseerd voor Vercel. Zorg dat alle omgevingsvariabelen in het Vercel Dashboard zijn ingesteld.

---

## Project Structure

```
src/
  app/                          # Next.js App Router
    layout.tsx                  # Root layout: ClerkProvider, fonts, metadata
    page.tsx                    # Thin page shell — renders <DakoppervlakteApp />
    api/
      counter/route.ts          # Public: GET/POST global usage counter
      searches/route.ts         # Protected: GET/POST user search history
      building-polygon/route.ts # Proxy: Nominatim building geometry
      init/route.ts             # DB initialisation helper

  components/
    ui/                         # Pure UI — no state, no side effects
      Button.tsx
      Input.tsx
      Spinner.tsx
      Logo.tsx
      Badge.tsx
    map/                        # Map-specific dumb components
      MapView.tsx               # Renders the Google Maps container
      MapOverlayControls.tsx    # Rotate / tilt overlay buttons
      DrawingOverlay.tsx        # Bottom hint bar during drawing
    sidebar/                    # Sidebar dumb components
      AddressSearch.tsx
      RotationControls.tsx
      PolygonList.tsx
      TotalAreaDisplay.tsx
      DrawingHint.tsx
      StepGuide.tsx
      SearchHistory.tsx
      SaveResetControls.tsx
    DakoppervlakteApp.tsx       # Smart component — all state + orchestration

  hooks/
    useGoogleMaps.ts            # Script loading + map instance lifecycle
    usePolygonDrawing.ts        # Drawing FSM: start → place points → finish
    useUsageCounter.ts          # Fetch count on mount, increment on save
    useSearchHistory.ts         # Fetch + persist search history

  lib/
    db.ts                       # Neon client factory
    types.ts                    # Shared TypeScript types
    utils.ts                    # Pure helpers (formatArea, generateColor…)
    init-db.ts                  # One-shot DB schema initialisation script

  __tests__/
    __mocks__/
      googleMaps.ts             # Global Google Maps API stub (jsdom can't load it)
    hooks/                      # Hook-level tests via renderHook
    components/                 # Component-level use-case tests
    api/                        # API route handler tests
    DakoppervlakteApp.test.tsx  # Full integration / use-case tests
```

### Component layers

| Layer | Location | Rule |
|---|---|---|
| **Pages** | `app/page.tsx` | Server component shell only. No logic, no state. |
| **Smart components** | `components/DakoppervlakteApp.tsx` | Own state via hooks, orchestrate child components, call hooks. No raw JSX styling. |
| **Dumb components** | `components/sidebar/`, `components/map/` | Receive all data and callbacks via props. No direct API calls, no global state. |
| **Pure UI** | `components/ui/` | Stateless. Accept only primitive props + children. Fully reusable across projects. |

---

## Testing Philosophy

> **Tests must describe what the user can do, not how the code is built.**

A test that breaks only when the implementation changes (but the user experience is still correct) is a bad test. A test that breaks when the user experience breaks — regardless of how the internals are refactored — is a good test.

### The core rules

**1. Test use cases, not implementations.**

Write tests in terms of user actions and observable outcomes. Avoid asserting on internal state, component class names, or implementation details.

```ts
// ❌ Bad — tests implementation
expect(component.state.mode).toBe('drawing')
expect(wrapper.find('.drawing-hint')).toHaveLength(1)

// ✅ Good — tests user experience
expect(screen.getByText(/tekenmode actief/i)).toBeInTheDocument()
```

**2. Tests must fail when the feature breaks.**

If you can delete or completely rewrite the implementation and the test still passes, the test is not doing its job. Every test must have a clear failure condition tied to a user-facing behaviour.

**3. Describe scenarios, not components.**

Group tests by what the user is trying to accomplish, not by which component is under test.

```ts
// ❌ Bad — component-centric
describe('DrawingHint component', () => {
  it('renders correctly', ...)
  it('shows correct text for 0 points', ...)
})

// ✅ Good — use-case centric
describe('User draws a polygon', () => {
  it('shows how many points have been placed', ...)
  it('offers a finish button once 3 points are placed', ...)
  it('prevents finishing with fewer than 3 points', ...)
})
```

**4. One assertion per scenario (as much as possible).**

Each `it` block should capture one behaviour. When a test fails, you want to know exactly which behaviour broke without reading a wall of assertions.

**5. Mock as little as possible — only when absolutely necessary.**

The more you mock, the less you're testing. Every mock is a gap between your tests and reality. Before reaching for a mock, ask: *can I use the real thing?* Real pure functions, real components, and real in-memory state never need mocking.

You **may** mock when:
- The dependency is a **true external system** that the test environment cannot provide (browser APIs like Google Maps, third-party SDKs like Clerk).
- The dependency has **unacceptable side effects** in tests (writing to a real database, network calls).
- The dependency makes tests **non-deterministic** in a way that cannot be seeded.

Never mock because something is "hard to set up". Hard to set up usually means the design needs improving. Our component architecture — where dumb components receive everything via props — means you almost never need to mock anything when testing below the smart-component level.

```ts
// ❌ Bad — mocking your own code
vi.mock('@/hooks/usePolygonDrawing')
vi.mock('@/components/sidebar/PolygonList')

// ✅ Good — use the real components; mock only the true external boundary
global.fetch = vi.fn()
// Google Maps global stubbed once in vitest.setup.ts — never per-test
```

**6. Mock at the boundary, not inside the system.**

When a mock is necessary, place it at the outermost layer — the point where your code meets the external world. Never mock something that lives inside your own codebase.

```ts
// ❌ Bad — mocking inside the system
vi.mock('@/lib/db')

// ✅ Good — mock the external SDK your lib wraps, or stub fetch responses
vi.mock('@neondatabase/serverless')
```

**7. Hooks tests use `renderHook` with realistic inputs.**

Don't test hooks by inspecting internal variables. Test them by asserting on what they return and what side effects they cause — exactly as a consuming component would experience them.

**8. API route tests exercise the full route handler.**

Import the route handler directly and call it with a real `Request` object. Assert on the `Response` status and JSON body. Do not mock the route handler itself.

### Use cases to test (current scope)

```
User searches for an address
  ✓ navigates the map to the address and enters drawing mode
  ✓ shows an error when the address is not found
  ✓ disables the search button when the input is empty
  ✓ disables the search button while a search is in progress

User draws a polygon
  ✓ shows drawing mode is active after starting
  ✓ shows how many points have been placed
  ✓ does not offer a finish button with fewer than 3 points
  ✓ offers a finish button once 3 points are placed
  ✓ shows the area after completing a polygon
  ✓ updates the area when a vertex is dragged

User manages polygons
  ✓ can rename a polygon by clicking its label
  ✓ cancels rename on Escape
  ✓ does not rename if the new label is empty
  ✓ can delete a polygon; total area updates accordingly
  ✓ shows a combined total when multiple polygons exist

User saves a result
  ✓ increments the global usage counter on save
  ✓ persists the entry to history when signed in
  ✓ shows a sign-up upsell when signed out
  ✓ shows a saved confirmation after saving

Map orientation controls
  ✓ rotates the map when the rotate buttons are clicked
  ✓ resets heading to north (0°) when N is clicked
  ✓ toggles 3D perspective tilt between 0° and 45°

Pure utilities
  ✓ formatArea rounds and localises correctly
  ✓ generatePolygonColor produces valid HSL in a safe hue range
  ✓ normalizeHeading wraps heading values to [0, 360)

API: counter
  ✓ GET returns the current count
  ✓ POST increments and returns the new count

API: searches
  ✓ GET returns history for the authenticated user
  ✓ POST saves a new entry for the authenticated user
  ✓ GET returns 401 when unauthenticated
  ✓ POST returns 401 when unauthenticated
```
