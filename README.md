# DakOppervlakte

DakOppervlakte is a tool designed for efficient calculation of roof areas for solar panel installations or renovation projects. It utilizes automatic building geometry detection for regions in Belgium.

## Features

- 🏢 **Automatic Building Detection**: Leverages official data from Digitaal Vlaanderen (Basisregisters) and UrbIS (Brussels).
- 🗺 **Map Integration**: Interactive satellite maps with rotation and tilt capabilities.
- 📐 **Accurate Area Measurement**: Direct calculation of the 2D footprint area.
- 💾 **History**: Save your calculations with integration via Clerk for user authentication.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Maps**: Google Maps JavaScript API
- **Data**: Basisregisters Vlaanderen & UrbIS
- **Database**: Neon Postgres
- **Auth**: Clerk
- **Testing**: Vitest + Testing Library

## Setup

1. Clone the repository.
2. Copy `.env.example` to `.env.local` and fill in the necessary API keys:
   - `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
   - `DATABASE_URL` (Neon Postgres)
   - `CLERK_SECRET_KEY` & `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`
5. Run tests: `npm test`

## Deployment

The application is optimized for Vercel. Ensure all environment variables are configured in the Vercel Dashboard.

---

## Component Architecture Overview

DakOppervlakte follows a layered component architecture to ensure maintainability and scalability:

| Layer                | Location                                 | Rule                                                                                                                  |
|----------------------|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| **Pages**            | `app/page.tsx`                           | Server component shell only. No logic, no state.                                                                      |
| **Smart Components** | `components/DakoppervlakteApp.tsx`       | Manages its own state via hooks, orchestrates child components, and calls custom hooks. Avoids raw JSX styling.       |
| **Dumb Components**  | `components/sidebar/`, `components/map/` | Receive all data and callbacks through props. They do not make direct API calls or manage global state.               |
| **Pure UI**          | `components/ui/`                         | Stateless components that accept only primitive props and children. Designed for maximum reusability across projects. |

---

## Contribution

We welcome contributions to DakOppervlakte! Please refer to our contribution guidelines for details on how to submit your changes.

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

---
