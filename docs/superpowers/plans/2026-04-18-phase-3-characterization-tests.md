# Phase 3 — Characterization Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two characterization test files that lock in the current observable behavior of `handleSearch` (in `DakoppervlakteApp.tsx`) and `usePolygonDrawing`, so Phase 4 (domain extraction) and Phase 5 (orchestrator slim-down) can refactor safely.

**Architecture:** Pure additive — two new test files, no production code changes, no modifications to existing tests. Both files mock only true external boundaries (`fetch`, Google Maps stub, Clerk stub) and exercise the real components/hooks. Label assertions are deliberately loose because Phase 4 localizes `'Vlak N'` / `'Auto'`.

**Tech Stack:** Vitest 4, @testing-library/react, @testing-library/user-event, existing Google Maps stub (`src/__tests__/__mocks__/googleMaps.ts`), existing test-utils wrapper with next-intl provider (`src/__tests__/test-utils.tsx`).

**Scope note:** The existing `src/__tests__/hooks/usePolygonDrawing.test.ts` already covers much of the hook API, but it asserts hardcoded `'Vlak 1'` / `'Auto'` label strings. The spec explicitly calls for a separate behavior file with loose label assertions that survives Phase 4 localization. We keep the existing file as-is (Phase 4 will update its label assertions when it does the localization); the new file is the safety net Phase 5 relies on.

---

## File Structure

**Create:**

- `src/__tests__/components/DakoppervlakteApp.search.test.tsx` — covers the four `handleSearch` branches (auto-gen on/found, auto-gen on/not-found, auto-gen on/fetch-error, auto-gen off) plus restore-from-history. Asserts observable outcomes only.
- `src/__tests__/hooks/usePolygonDrawing.behavior.test.tsx` — covers the public API contract using loose label assertions and adds two scenarios the existing file does not cover (orientation sync visibility, exclude-stays-on-map).

**Do not modify:**

- `src/components/DakoppervlakteApp.tsx` — Phase 5 refactors this; this phase establishes the safety net.
- `src/hooks/usePolygonDrawing.ts` — same reason.
- `src/__tests__/hooks/usePolygonDrawing.test.ts` — kept intact; Phase 4 will update its hardcoded label assertions when it localizes labels.
- `src/__tests__/__mocks__/googleMaps.ts` — reused as-is.
- `src/__tests__/test-utils.tsx` — reused as-is.

---

## Task 1: Characterization tests for `handleSearch` + restore

**Files:**
- Create: `src/__tests__/components/DakoppervlakteApp.search.test.tsx`

**Context for the subagent:**
- `DakoppervlakteApp.tsx:72-121` defines `handleSearch` with four branches:
  1. Auto-gen ON + `fetch('/api/building-polygon')` returns `{type:'Feature', geometry.coordinates}` → `addPolygonFromPath(path)` + `incrementAutogenCount(address)`.
  2. Auto-gen ON + response is anything else → `setAutoGenerateError(t('Sidebar.noBuildingFound'))`, `setTimeout(..., 5000)` clears error, `setTimeout(() => startDrawing(), 600)`.
  3. Auto-gen ON + promise rejects → same as branch 2.
  4. Auto-gen OFF → `setTimeout(() => startDrawing(), 600)`, no fetch.
- Before any branch runs: `setAutoGenerateError('')`, `setSaved(false)`, if auto-gen then `resetAll()`, then `geocodeAndNavigate(address, continuation)`. Continuation does `incrementSearchCount(address)`, `setSearchFormCollapsed(true)`, `setDrawerOpen(false)` before taking the branch.
- `DakoppervlakteApp.tsx:123-139` defines `handleRestore`: sets address, `resetAll`, clears flags, collapses form, closes drawer, geocodes, then `setTimeout(() => restorePolygons(restored.polygons), 500)` if polygons exist.
- The existing `DakoppervlakteApp.test.tsx` already has working fetch/Clerk/Geocoder mock setup — copy that approach verbatim.
- `t('Sidebar.noBuildingFound')` resolves to `"Geen gebouw gevonden — teken handmatig"` via the NL messages loaded by `test-utils.tsx`.

- [ ] **Step 1: Write the characterization test file**

Create `src/__tests__/components/DakoppervlakteApp.search.test.tsx` with this exact content:

```tsx
// Coverage baseline (recorded 2026-04-18, Phase 3):
//   DakoppervlakteApp.tsx handleSearch lines covered: TBD — filled in Task 3.
//   Do not let Phase 4/5 coverage drop below this baseline for handleSearch.

import userEvent from '@testing-library/user-event'
import { DakoppervlakteApp } from '@/components/DakoppervlakteApp'
import { MockGeocoder, MockMap } from '../__mocks__/googleMaps'
import { act, render, screen, waitFor } from '../test-utils'

const { mockUserRef } = vi.hoisted(() => ({
  mockUserRef: { current: null as { id: string } | null },
}))

vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div data-testid="user-button" />,
  Show: ({ when, children }: { when: string; children: React.ReactNode }) => {
    const isSignedIn = !!mockUserRef.current
    if (when === 'signed-in' && isSignedIn) return <>{children}</>
    if (when === 'signed-out' && !isSignedIn) return <>{children}</>
    return null
  },
  useUser: () => ({ user: mockUserRef.current }),
}))

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

type BuildingResponse = 'feature' | 'non-feature' | 'reject'

function setupFetch(opts: {
  history?: unknown[]
  building?: BuildingResponse
} = {}) {
  const history = opts.history ?? []
  fetchMock.mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method ?? 'GET'
    if (url.includes('/api/autogen-counter')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ count: method === 'POST' ? 8 : 7 }),
        text: async () => JSON.stringify({ count: method === 'POST' ? 8 : 7 }),
      })
    }
    if (url.includes('/api/counter')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ count: method === 'POST' ? 43 : 42 }),
        text: async () => JSON.stringify({ count: method === 'POST' ? 43 : 42 }),
      })
    }
    if (url.includes('/api/searches')) {
      if (method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => history,
          text: async () => JSON.stringify(history),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: 1 }),
        text: async () => '{"id":1}',
      })
    }
    if (url.includes('/api/building-polygon')) {
      if (opts.building === 'feature') {
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [4.4, 51.1],
                [4.41, 51.1],
                [4.41, 51.11],
                [4.4, 51.1],
              ],
            ],
          },
        }
        return Promise.resolve({
          ok: true,
          json: async () => feature,
          text: async () => JSON.stringify(feature),
        })
      }
      if (opts.building === 'reject') {
        return Promise.reject(new Error('network down'))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ error: 'not found' }),
        text: async () => '{"error":"not found"}',
      })
    }
    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => '{}' })
  })
}

function wireGeocoder() {
  const geocoder = MockGeocoder.mock.results[MockGeocoder.mock.results.length - 1].value
  geocoder.geocode.mockImplementation(
    (_req: unknown, cb: (results: unknown[], status: string) => void) => {
      cb([{ geometry: { location: { lat: () => 51.1, lng: () => 4.4 } } }], 'OK')
    },
  )
  return geocoder
}

function getMapInstance() {
  return MockMap.mock.results[MockMap.mock.results.length - 1].value
}

function countFetchCalls(predicate: (url: string, init?: RequestInit) => boolean) {
  return fetchMock.mock.calls.filter(([url, init]) =>
    typeof url === 'string' ? predicate(url, init as RequestInit | undefined) : false,
  ).length
}

beforeEach(() => {
  mockUserRef.current = null
  localStorage.clear()
})
afterEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('handleSearch: auto-generate ON and the building lookup succeeds', () => {
  it('adds an auto polygon, increments both counters, collapses form, closes drawer', async () => {
    setupFetch({ building: 'feature' })
    const user = userEvent.setup()
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1, Antwerpen')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    // Search counter POST fires
    await waitFor(() => {
      expect(
        countFetchCalls((u, init) => u.includes('/api/counter') && init?.method === 'POST'),
      ).toBeGreaterThanOrEqual(1)
    })
    // Autogen counter POST fires
    await waitFor(() => {
      expect(
        countFetchCalls((u, init) => u.includes('/api/autogen-counter') && init?.method === 'POST'),
      ).toBe(1)
    })
    // Polygon appears in the sidebar list (loose label assertion)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /vlakken/i })).toBeInTheDocument()
    })
    // Search form collapses — address textbox is gone, "new search" button is shown
    expect(screen.queryByRole('textbox', { name: /adres/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nieuwe zoekopdracht/i })).toBeInTheDocument()
  })
})

describe('handleSearch: auto-generate ON and the response is not a Feature', () => {
  it('shows the error, clears it after 5s, and starts drawing after 600ms', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    setupFetch({ building: 'non-feature' })
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Unknown 99')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    // Error visible
    await waitFor(() => {
      expect(screen.getByText(/geen gebouw gevonden/i)).toBeInTheDocument()
    })

    // Drawing starts after 600ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.getByText(/tekenmode actief/i)).toBeInTheDocument()

    // Error clears after 5s total
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })
    expect(screen.queryByText(/geen gebouw gevonden/i)).not.toBeInTheDocument()

    // Autogen counter NOT incremented
    expect(
      countFetchCalls((u, init) => u.includes('/api/autogen-counter') && init?.method === 'POST'),
    ).toBe(0)
  })
})

describe('handleSearch: auto-generate ON and the building lookup rejects', () => {
  it('falls back to the same error/drawing path as a non-Feature response', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    setupFetch({ building: 'reject' })
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      expect(screen.getByText(/geen gebouw gevonden/i)).toBeInTheDocument()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.getByText(/tekenmode actief/i)).toBeInTheDocument()

    expect(
      countFetchCalls((u, init) => u.includes('/api/autogen-counter') && init?.method === 'POST'),
    ).toBe(0)
  })
})

describe('handleSearch: auto-generate OFF', () => {
  it('skips the building-polygon fetch and starts drawing after 600ms', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    setupFetch()
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    // Uncheck the auto-generate checkbox
    const autoGenCheckbox = screen.getByRole('checkbox', { name: /automatisch dakoppervlak/i })
    await user.click(autoGenCheckbox)
    expect(autoGenCheckbox).not.toBeChecked()

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.getByText(/tekenmode actief/i)).toBeInTheDocument()

    // No building-polygon fetch
    expect(countFetchCalls((u) => u.includes('/api/building-polygon'))).toBe(0)
    // No autogen counter POST
    expect(
      countFetchCalls((u, init) => u.includes('/api/autogen-counter') && init?.method === 'POST'),
    ).toBe(0)
  })
})

describe('handleRestore: restoring a search from history', () => {
  it('populates the address, restores polygons after 500ms, collapses form, closes drawer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockUserRef.current = { id: 'user_123' }
    setupFetch({
      history: [
        {
          id: 1,
          address: 'Grote Markt 1, Brussel',
          area_m2: 250,
          created_at: '2025-01-01',
          polygons: [
            {
              id: 'p1',
              label: 'Dak A',
              area: 250,
              path: [
                { lat: 51.1, lng: 4.4 },
                { lat: 51.2, lng: 4.5 },
                { lat: 51.15, lng: 4.6 },
              ],
              heading: 0,
              tilt: 0,
            },
          ],
        },
      ],
    })
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    await waitFor(() => {
      expect(screen.getByText('Grote Markt 1, Brussel')).toBeInTheDocument()
    })

    await user.click(screen.getByTitle('Deze zoekopdracht herstellen'))

    // Address is restored into the header / current-address display
    await waitFor(() => {
      expect(screen.getAllByText('Grote Markt 1, Brussel').length).toBeGreaterThan(0)
    })

    // Polygons restore after 500ms delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    expect(screen.getAllByText('Dak A').length).toBeGreaterThan(0)

    // Search form is collapsed
    expect(screen.queryByRole('textbox', { name: /adres/i })).not.toBeInTheDocument()
  })
})

describe('Map integration sanity — the map actually receives a navigation', () => {
  // Guards the shared prelude: handleSearch must geocode + call map.setCenter before any branch runs.
  it('calls setCenter on the map for any successful search', async () => {
    setupFetch({ building: 'feature' })
    const user = userEvent.setup()
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      expect(getMapInstance().setCenter).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: Run the new file and verify all tests pass**

Run: `npx vitest run src/__tests__/components/DakoppervlakteApp.search.test.tsx`
Expected: 6 tests pass (1 for each describe block). Zero failures.

If any test fails, do not proceed. Read the failure, compare against `DakoppervlakteApp.tsx:72-139` and the existing `DakoppervlakteApp.test.tsx` mock pattern, and fix the test (not the production code). Behavior is the source of truth; if the test's expectation is wrong, change the test.

- [ ] **Step 3: Run full suite to confirm no collateral damage**

Run: `npm test`
Expected: all tests pass, including the 6 new ones. Previous count was 228 — new total should be 234 (228 + 6).

- [ ] **Step 4: Run check**

Run: `npm run check`
Expected: `tsc --noEmit` clean, `biome check --write .` clean, `depcruise src` clean (0 violations).

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/components/DakoppervlakteApp.search.test.tsx
git commit -m "$(cat <<'EOF'
test: Phase 3 — characterize handleSearch + restore branches

Adds characterization tests covering the 4 handleSearch branches
(auto-gen on/found, on/not-found, on/reject, off) and restore-from-history.
Observable outcomes only; mocks limited to fetch, Google Maps stub, Clerk.
Loose label assertions so Phase 4 label localization does not break them.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Characterization tests for `usePolygonDrawing` (behavior, loose labels)

**Files:**
- Create: `src/__tests__/hooks/usePolygonDrawing.behavior.test.tsx`

**Context for the subagent:**
- `usePolygonDrawing.ts` returns this public API: `mode, pointCount, polygons, startDrawing, finishPolygon, undoLastPoint, addPolygonFromPath, deletePolygon, renamePolygon, togglePolygonExcluded, resetAll, restorePolygons, serializedPolygons`.
- `usePolygonDrawing.ts:36-53` contains the orientation-sync `useEffect`. Rule: a polygon is shown when `normalizeHeading(p.heading) === normalizeHeading(currentHeading) && p.tilt === currentTilt`, otherwise `p.polygon.setMap(null)` is called. `normalizeHeading` is in `src/lib/utils.ts` and wraps a heading into `[0, 360)`.
- `MockPolygon` exposes `setMap` and `getMap` (initialized to the map passed at construction via `options.map`). This means `p.polygon.getMap() === map` inside the effect's equality check.
- `finishPolygon` requires `tempPathRef.current.length >= 3` otherwise it bails and leaves `mode = 'drawing'`.
- `addPolygonFromPath` requires `path.length >= 3` otherwise it bails silently and `mode` stays `'idle'`.
- Manual polygon label: `'Vlak ${polygonsRef.current.length + 1}'`. Auto polygon label: `'Auto'`. Do NOT assert these strings literally — use loose assertions (non-empty string).
- `computeArea` is mocked in `googleMaps.ts` to return `100`, so `polygons[0].area === 100` after rounding.
- The existing hook test file `src/__tests__/hooks/usePolygonDrawing.test.ts` provides the `createMockMap()` / `setup()` helper pattern. Reuse the same pattern — do not try to hoist it into a shared helper in this phase (that would be pre-emptive refactoring).

- [ ] **Step 1: Write the behavior test file**

Create `src/__tests__/hooks/usePolygonDrawing.behavior.test.tsx` with this exact content:

```tsx
// Coverage baseline (recorded 2026-04-18, Phase 3):
//   usePolygonDrawing.ts lines covered: TBD — filled in Task 3.
//   Do not let Phase 4/5 coverage drop below this baseline for usePolygonDrawing.
//
// Label assertions in this file are intentionally loose — Phase 4 localizes
// 'Vlak N' / 'Auto' via next-intl. Use: expect(p.label).toEqual(expect.any(String))
// and expect(p.label).not.toBe(''). Do NOT hardcode label strings.

import { act, renderHook } from '@testing-library/react'
import { usePolygonDrawing } from '@/hooks/usePolygonDrawing'
import {
  MockAdvancedMarkerElement,
  MockMarker,
  MockPolygon,
  MockPolyline,
} from '../__mocks__/googleMaps'

function createMockMap() {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {}
  return {
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    setOptions: vi.fn(),
    setHeading: vi.fn(),
    setTilt: vi.fn(),
    getHeading: vi.fn(() => 0),
    getTilt: vi.fn(() => 0),
    getZoom: vi.fn(() => 8),
    addListener: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      listeners[event] ??= []
      listeners[event].push(cb)
      return { remove: vi.fn() }
    }),
    _trigger: (event: string, ...args: unknown[]) => {
      ;(listeners[event] ?? []).forEach((cb) => {
        cb(...args)
      })
    },
  }
}

function setup(overrides?: { heading?: number; tilt?: number }) {
  const map = createMockMap()
  const mapInstanceRef = { current: map as unknown as google.maps.Map }
  const heading = overrides?.heading ?? 0
  const tilt = overrides?.tilt ?? 0

  const hookResult = renderHook(
    (props: { heading: number; tilt: number }) =>
      usePolygonDrawing({
        mapInstanceRef,
        currentHeading: props.heading,
        currentTilt: props.tilt,
        locale: 'nl-BE',
      }),
    { initialProps: { heading, tilt } },
  )

  return { map, mapInstanceRef, ...hookResult }
}

function drawThreePoints(
  map: ReturnType<typeof createMockMap>,
  result: { current: ReturnType<typeof usePolygonDrawing> },
) {
  act(() => result.current.startDrawing())
  act(() => {
    map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
    map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
    map._trigger('click', { latLng: { lat: () => 51.05, lng: () => 4.2 } })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  MockPolygon.mockClear()
  MockMarker.mockClear()
  MockAdvancedMarkerElement.mockClear()
  MockPolyline.mockClear()
})

describe('Public API: drawing lifecycle', () => {
  it('startDrawing sets a crosshair cursor on the map', () => {
    const { result, map } = setup()
    act(() => result.current.startDrawing())
    expect(map.setOptions).toHaveBeenCalledWith({ draggableCursor: 'crosshair' })
    expect(result.current.mode).toBe('drawing')
  })

  it('clicking the map adds points and increments pointCount', () => {
    const { result, map } = setup()
    act(() => result.current.startDrawing())
    act(() => {
      map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
    })
    expect(result.current.pointCount).toBe(1)
    act(() => {
      map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
    })
    expect(result.current.pointCount).toBe(2)
  })

  it('undoLastPoint decrements pointCount', () => {
    const { result, map } = setup()
    act(() => result.current.startDrawing())
    act(() => {
      map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
      map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
    })
    expect(result.current.pointCount).toBe(2)
    act(() => result.current.undoLastPoint())
    expect(result.current.pointCount).toBe(1)
  })

  it('finishPolygon with fewer than 3 points leaves state in drawing mode, no polygon', () => {
    const { result, map } = setup()
    act(() => result.current.startDrawing())
    act(() => {
      map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
      map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
    })
    act(() => result.current.finishPolygon())
    expect(result.current.polygons).toHaveLength(0)
    expect(result.current.mode).toBe('drawing')
  })

  it('finishPolygon with 3+ points adds a polygon, returns to idle, and exposes a rounded area', () => {
    const { result, map } = setup()
    drawThreePoints(map, result)
    act(() => result.current.finishPolygon())
    expect(result.current.mode).toBe('idle')
    expect(result.current.polygons).toHaveLength(1)
    expect(result.current.polygons[0].area).toBe(100)
    // Loose label assertion — Phase 4 localizes the string
    expect(result.current.polygons[0].label).toEqual(expect.any(String))
    expect(result.current.polygons[0].label).not.toBe('')
  })
})

describe('Public API: addPolygonFromPath', () => {
  it('rejects paths with fewer than 3 points silently', () => {
    const { result } = setup()
    act(() => {
      result.current.addPolygonFromPath([
        { lat: 51, lng: 4 },
        { lat: 51.1, lng: 4.1 },
      ])
    })
    expect(result.current.polygons).toHaveLength(0)
    expect(result.current.mode).toBe('idle')
  })

  it('accepts paths with 3+ points and labels them without entering drawing mode', () => {
    const { result } = setup()
    act(() => {
      result.current.addPolygonFromPath([
        { lat: 51, lng: 4 },
        { lat: 51.1, lng: 4.1 },
        { lat: 51.05, lng: 4.2 },
      ])
    })
    expect(result.current.polygons).toHaveLength(1)
    expect(result.current.mode).toBe('idle')
    expect(result.current.polygons[0].label).toEqual(expect.any(String))
    expect(result.current.polygons[0].label).not.toBe('')
  })
})

describe('Public API: restorePolygons', () => {
  it('replaces the current list and preserves heading/tilt/label from each entry', () => {
    const { result } = setup()
    act(() => {
      result.current.restorePolygons([
        {
          id: 'a',
          label: 'Voordak',
          area: 50,
          path: [
            { lat: 51, lng: 4 },
            { lat: 51.1, lng: 4.1 },
            { lat: 51.05, lng: 4.2 },
          ],
          heading: 90,
          tilt: 45,
        },
      ])
    })
    expect(result.current.polygons).toHaveLength(1)
    expect(result.current.polygons[0].label).toBe('Voordak')
    expect(result.current.polygons[0].heading).toBe(90)
    expect(result.current.polygons[0].tilt).toBe(45)
  })
})

describe('Public API: orientation sync', () => {
  it('hides a polygon when the map rotates away and shows it again when aligned', () => {
    const { result, rerender } = setup({ heading: 0, tilt: 0 })

    act(() => {
      result.current.addPolygonFromPath([
        { lat: 51, lng: 4 },
        { lat: 51.1, lng: 4.1 },
        { lat: 51.05, lng: 4.2 },
      ])
    })
    const polygon = result.current.polygons[0].polygon
    expect(polygon.setMap).not.toHaveBeenCalledWith(null)

    // Rotate map to a mismatched heading — polygon should be hidden
    rerender({ heading: 90, tilt: 0 })
    expect(polygon.setMap).toHaveBeenCalledWith(null)

    // Return to original orientation — polygon re-shown
    rerender({ heading: 0, tilt: 0 })
    const mapCalls = (polygon.setMap as ReturnType<typeof vi.fn>).mock.calls
    const lastNonNullCall = [...mapCalls].reverse().find((call) => call[0] !== null)
    expect(lastNonNullCall).toBeDefined()
  })
})

describe('Public API: togglePolygonExcluded', () => {
  it('flips the excluded flag without removing the polygon from the map', () => {
    const { result } = setup()
    act(() => {
      result.current.addPolygonFromPath([
        { lat: 51, lng: 4 },
        { lat: 51.1, lng: 4.1 },
        { lat: 51.05, lng: 4.2 },
      ])
    })
    const id = result.current.polygons[0].id
    const polygon = result.current.polygons[0].polygon
    expect(result.current.polygons[0].excluded).toBe(false)

    act(() => result.current.togglePolygonExcluded(id))
    expect(result.current.polygons[0].excluded).toBe(true)
    // The polygon is still on the map (no setMap(null) triggered by exclusion alone)
    const setMapNullCallsAfterToggle = (polygon.setMap as ReturnType<typeof vi.fn>).mock.calls
      .filter((call) => call[0] === null).length
    expect(setMapNullCallsAfterToggle).toBe(0)

    act(() => result.current.togglePolygonExcluded(id))
    expect(result.current.polygons[0].excluded).toBe(false)
  })
})

describe('Public API: resetAll', () => {
  it('clears all polygons and returns mode to idle', () => {
    const { result, map } = setup()
    drawThreePoints(map, result)
    act(() => result.current.finishPolygon())
    expect(result.current.polygons).toHaveLength(1)

    act(() => result.current.resetAll())
    expect(result.current.polygons).toHaveLength(0)
    expect(result.current.mode).toBe('idle')
  })
})
```

- [ ] **Step 2: Run the new file and verify all tests pass**

Run: `npx vitest run src/__tests__/hooks/usePolygonDrawing.behavior.test.tsx`
Expected: 11 tests pass across 6 describe blocks. Zero failures.

If the orientation-sync test fails because the existing hook only calls `setMap(null)` when `shouldBeOnMap === false && p.polygon.getMap() === map`, check `MockPolygon` in `src/__tests__/__mocks__/googleMaps.ts` — its constructor must set the map from `options.map` so `getMap()` returns it. If it doesn't, the test should still pass because the effect runs on dependency change regardless of prior getMap state for newly-inserted polygons. If the test is flaky, instrument by logging `(polygon.setMap as any).mock.calls` and investigate.

- [ ] **Step 3: Run full suite to confirm no collateral damage**

Run: `npm test`
Expected: all tests pass. New total: 245 (234 + 11).

- [ ] **Step 4: Run check**

Run: `npm run check`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/hooks/usePolygonDrawing.behavior.test.tsx
git commit -m "$(cat <<'EOF'
test: Phase 3 — characterize usePolygonDrawing public API

Adds behavior-only characterization tests with loose label assertions so
Phase 4 (domain extraction + label localization) can refactor without
rewriting tests. Covers: drawing lifecycle, addPolygonFromPath, restore,
orientation sync, togglePolygonExcluded stays on map, resetAll.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Record coverage baselines + final verification

**Files:**
- Modify: `src/__tests__/components/DakoppervlakteApp.search.test.tsx` (top comment — baseline numbers)
- Modify: `src/__tests__/hooks/usePolygonDrawing.behavior.test.tsx` (top comment — baseline numbers)

**Context:** The spec requires recording the coverage baseline for `handleSearch` and `usePolygonDrawing` at the top of each characterization file. Phase 4/5 must not regress below these numbers.

- [ ] **Step 1: Run coverage and capture the numbers**

Run: `npx vitest run --coverage src/__tests__/components/DakoppervlakteApp.search.test.tsx src/__tests__/hooks/usePolygonDrawing.behavior.test.tsx`

From the coverage table, record:
- `src/components/DakoppervlakteApp.tsx` — the `% Stmts` and `% Lines` columns
- `src/hooks/usePolygonDrawing.ts` — the `% Stmts` and `% Lines` columns

If v8 coverage fails to install or run, fall back to: record a narrative baseline ("covers 4 handleSearch branches + restore; covers 11 usePolygonDrawing scenarios") — the spec's intent is "coverage can only go up", which does not strictly require numeric coverage if v8 is broken on this machine.

- [ ] **Step 2: Update the comment at the top of `DakoppervlakteApp.search.test.tsx`**

Replace the placeholder block with the actual numbers. Example (substitute your real numbers):

```tsx
// Coverage baseline (recorded 2026-04-18, Phase 3):
//   DakoppervlakteApp.tsx — Stmts: 67.12%, Lines: 67.12% (handleSearch 4 branches + restore)
//   Do not let Phase 4/5 coverage drop below this baseline for handleSearch.
```

If using a narrative baseline because v8 failed:

```tsx
// Coverage baseline (recorded 2026-04-18, Phase 3 — v8 coverage unavailable):
//   Scenarios: auto-gen ON/found, ON/non-feature, ON/reject, OFF, restore-from-history,
//   map-setCenter sanity. Phase 4/5 must not drop any of these scenarios.
```

- [ ] **Step 3: Update the comment at the top of `usePolygonDrawing.behavior.test.tsx`**

Replace the placeholder block with the actual numbers. Example:

```tsx
// Coverage baseline (recorded 2026-04-18, Phase 3):
//   usePolygonDrawing.ts — Stmts: 82.4%, Lines: 82.4% (public API behavior)
//   Do not let Phase 4/5 coverage drop below this baseline for usePolygonDrawing.
//
// Label assertions in this file are intentionally loose — Phase 4 localizes
// 'Vlak N' / 'Auto' via next-intl. Use: expect(p.label).toEqual(expect.any(String))
// and expect(p.label).not.toBe(''). Do NOT hardcode label strings.
```

- [ ] **Step 4: Tick the spec line in ROADMAP if applicable**

Read `ROADMAP.md`. There is no current Phase 3-specific roadmap line; the characterization tests are a design-doc milestone, not a user-facing roadmap item. Leave ROADMAP unchanged.

- [ ] **Step 5: Run the full gates**

Run: `npm run check && npm test && npm run build`
Expected: all three green. Build should still succeed (no production changes).

- [ ] **Step 6: Commit the coverage baselines**

```bash
git add src/__tests__/components/DakoppervlakteApp.search.test.tsx src/__tests__/hooks/usePolygonDrawing.behavior.test.tsx
git commit -m "$(cat <<'EOF'
docs: Phase 3 — record coverage baselines in characterization tests

Baseline numbers (or narrative if v8 unavailable) written into the top
comment of each Phase 3 file. Phase 4/5 must not regress below these.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Self-review notes

- **Spec coverage:** All five `handleSearch` scenarios (auto-gen on/found, on/not-found, on/reject, off, restore) are covered by Task 1. All eight bullet points from the `usePolygonDrawing.behavior.test.tsx` section of the spec are covered by Task 2 (lifecycle covers startDrawing/click/pointCount/undo/finish<3/finish≥3/mode return, addPolygonFromPath covers <3 rejection, restorePolygons covers label+heading+tilt preservation, orientation sync test exists, togglePolygonExcluded stays-on-map test exists, resetAll test exists).
- **No placeholder code:** Every code block contains real, runnable TypeScript. The coverage baseline comments contain placeholder text that Task 3 replaces with real numbers — that is the intended Task 3 work, not a plan deficiency.
- **Type consistency:** `PolygonEntry`, `PolygonData`, `DrawingMode` all match `src/lib/types.ts`. Mock names (`MockMap`, `MockPolygon`, `MockGeocoder`, `MockAdvancedMarkerElement`, `MockPolyline`) match `src/__tests__/__mocks__/googleMaps.ts`. Hook return shape used in tests matches `usePolygonDrawing.ts` exports exactly.
- **Label looseness:** No task asserts `'Vlak 1'` or `'Auto'` as a literal. All label checks are `expect(...).toEqual(expect.any(String))` and `expect(...).not.toBe('')` or a custom user-given label like `'Voordak'` from `restorePolygons`.
- **No production changes:** Tasks 1–3 only write to `src/__tests__/**`. `DakoppervlakteApp.tsx` and `usePolygonDrawing.ts` are untouched.
