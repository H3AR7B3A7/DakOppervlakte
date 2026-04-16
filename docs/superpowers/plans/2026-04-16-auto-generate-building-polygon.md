# Auto-Generate Building Polygon — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a checkbox is ticked under the address search, automatically fetch the building footprint from Belgian WFS services and add it as an editable polygon on the map.

**Architecture:** Rewrite the existing `/api/building-polygon` route to query GRB (Flanders) and UrbIS (Brussels) WFS services, with point-in-polygon matching. Add `addPolygonFromPath()` to `usePolygonDrawing` for programmatic polygon creation. Wire it all together in `DakoppervlakteApp` via a new `autoGenerate` checkbox state.

**Tech Stack:** Next.js API routes, OGC WFS (GeoJSON), Google Maps JavaScript API, Vitest + Testing Library

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/api/building-polygon/route.ts` | Rewrite | Query GRB + UrbIS WFS, pick closest building, return GeoJSON |
| `src/lib/geo.ts` | Create | Pure geometry helpers: point-in-polygon, centroid, distance |
| `src/hooks/usePolygonDrawing.ts` | Modify | Add `addPolygonFromPath()` function |
| `src/components/sidebar/AddressSearch.tsx` | Modify | Add checkbox below input |
| `src/components/DakoppervlakteApp.tsx` | Modify | Add `autoGenerate` state, modify search flow |
| `messages/nl.json` | Modify | Add 2 translation keys |
| `messages/en.json` | Modify | Add 2 translation keys |
| `messages/fr.json` | Modify | Add 2 translation keys |
| `src/__tests__/lib/geo.test.ts` | Create | Tests for geometry helpers |
| `src/__tests__/api/building-polygon.test.ts` | Create | Tests for API route |
| `src/__tests__/hooks/usePolygonDrawing.test.ts` | Modify | Test `addPolygonFromPath()` |
| `src/__tests__/components/sidebar/AddressSearch.test.tsx` | Modify | Test checkbox rendering + toggle |

---

### Task 1: Pure Geometry Helpers

**Files:**
- Create: `src/lib/geo.ts`
- Test: `src/__tests__/lib/geo.test.ts`

- [ ] **Step 1: Write failing tests for `pointInPolygon`**

Create `src/__tests__/lib/geo.test.ts`:

```typescript
import { pointInPolygon, centroid, haversineDistance } from '@/lib/geo'

describe('pointInPolygon', () => {
  const square = [
    [3.0, 51.0],
    [4.0, 51.0],
    [4.0, 52.0],
    [3.0, 52.0],
    [3.0, 51.0],
  ] as [number, number][]

  it('returns true for a point inside the polygon', () => {
    expect(pointInPolygon(51.5, 3.5, square)).toBe(true)
  })

  it('returns false for a point outside the polygon', () => {
    expect(pointInPolygon(53.0, 5.0, square)).toBe(false)
  })

  it('returns false for an empty polygon', () => {
    expect(pointInPolygon(51.5, 3.5, [])).toBe(false)
  })
})

describe('centroid', () => {
  it('calculates the centroid of a polygon ring', () => {
    const ring = [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 0],
    ] as [number, number][]
    const [cx, cy] = centroid(ring)
    expect(cx).toBeCloseTo(2.0)
    expect(cy).toBeCloseTo(2.0)
  })
})

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance(51.0, 3.0, 51.0, 3.0)).toBe(0)
  })

  it('calculates approximate distance in meters between two nearby points', () => {
    const dist = haversineDistance(51.0, 3.0, 51.001, 3.0)
    expect(dist).toBeGreaterThan(100)
    expect(dist).toBeLessThan(120)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/geo.test.ts`
Expected: FAIL — `Cannot find module '@/lib/geo'`

- [ ] **Step 3: Implement the geometry helpers**

Create `src/lib/geo.ts`:

```typescript
export function pointInPolygon(
  lat: number,
  lng: number,
  ring: [number, number][]
): boolean {
  if (ring.length < 4) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function centroid(ring: [number, number][]): [number, number] {
  let cx = 0
  let cy = 0
  const n = ring.length - 1
  for (let i = 0; i < n; i++) {
    cx += ring[i][0]
    cy += ring[i][1]
  }
  return [cx / n, cy / n]
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/geo.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/geo.ts src/__tests__/lib/geo.test.ts
git commit -m "feat: add pure geometry helpers for building polygon matching"
```

---

### Task 2: Rewrite Building Polygon API Route

**Files:**
- Rewrite: `src/app/api/building-polygon/route.ts`
- Test: `src/__tests__/api/building-polygon.test.ts`

- [ ] **Step 1: Write failing tests for the API route**

Create `src/__tests__/api/building-polygon.test.ts`:

```typescript
import { GET } from '@/app/api/building-polygon/route'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeRequest(lat?: string, lng?: string) {
  const params = new URLSearchParams()
  if (lat) params.set('lat', lat)
  if (lng) params.set('lng', lng)
  return new Request(`http://localhost/api/building-polygon?${params}`)
}

function makeWfsResponse(features: object[]) {
  return new Response(JSON.stringify({ type: 'FeatureCollection', features }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('building-polygon API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when lat/lng are missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
  })

  it('returns the building polygon from GRB when the point is inside', async () => {
    const polygon = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[3.0, 51.0], [3.001, 51.0], [3.001, 51.001], [3.0, 51.001], [3.0, 51.0]]],
      },
    }
    mockFetch.mockResolvedValueOnce(makeWfsResponse([polygon]))

    const res = await GET(makeRequest('51.0005', '3.0005'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.type).toBe('Feature')
    expect(body.geometry.type).toBe('Polygon')
  })

  it('falls back to UrbIS when GRB returns no features', async () => {
    mockFetch
      .mockResolvedValueOnce(makeWfsResponse([]))
      .mockResolvedValueOnce(makeWfsResponse([{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[4.35, 50.845], [4.351, 50.845], [4.351, 50.846], [4.35, 50.846], [4.35, 50.845]]],
        },
      }]))

    const res = await GET(makeRequest('50.8455', '4.3505'))
    const body = await res.json()

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(body.type).toBe('Feature')
  })

  it('picks the nearest building when point is outside all polygons', async () => {
    const nearBuilding = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[3.0, 51.0], [3.001, 51.0], [3.001, 51.001], [3.0, 51.001], [3.0, 51.0]]],
      },
    }
    const farBuilding = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[3.005, 51.005], [3.006, 51.005], [3.006, 51.006], [3.005, 51.006], [3.005, 51.005]]],
      },
    }
    mockFetch.mockResolvedValueOnce(makeWfsResponse([farBuilding, nearBuilding]))

    const res = await GET(makeRequest('51.0004', '3.0004'))
    const body = await res.json()

    expect(body.geometry.coordinates[0][0][0]).toBe(3.0)
  })

  it('returns empty when no buildings are found anywhere', async () => {
    mockFetch
      .mockResolvedValueOnce(makeWfsResponse([]))
      .mockResolvedValueOnce(makeWfsResponse([]))

    const res = await GET(makeRequest('51.0', '3.0'))
    const body = await res.json()

    expect(body.features).toEqual([])
    expect(body.debug).toBeDefined()
  })

  it('returns empty when the nearest building is more than 50m away', async () => {
    const farBuilding = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[3.01, 51.01], [3.011, 51.01], [3.011, 51.011], [3.01, 51.011], [3.01, 51.01]]],
      },
    }
    mockFetch.mockResolvedValueOnce(makeWfsResponse([farBuilding]))

    const res = await GET(makeRequest('51.0', '3.0'))
    const body = await res.json()

    expect(body.features).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/api/building-polygon.test.ts`
Expected: FAIL — existing route has different behavior

- [ ] **Step 3: Rewrite the API route**

Rewrite `src/app/api/building-polygon/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { pointInPolygon, centroid, haversineDistance } from '@/lib/geo'

export const dynamic = 'force-dynamic'

const WFS_SOURCES = [
  {
    name: 'GRB',
    url: 'https://geo.api.vlaanderen.be/GRB/wfs',
    typeName: 'GRB:GBG',
  },
  {
    name: 'UrbIS',
    url: 'https://geoservices-urbis.irisnet.be/geoserver/UrbIS/wfs',
    typeName: 'UrbIS:Bu',
  },
]

const BBOX_OFFSET = 0.0005
const MAX_DISTANCE_M = 50

type GeoJsonPolygon = {
  type: 'Polygon'
  coordinates: [number, number][][]
}

type GeoJsonFeature = {
  type: 'Feature'
  geometry: GeoJsonPolygon
  properties?: Record<string, unknown>
}

async function queryWfs(
  baseUrl: string,
  typeName: string,
  lat: number,
  lng: number
): Promise<GeoJsonFeature[]> {
  const bbox = `${lat - BBOX_OFFSET},${lng - BBOX_OFFSET},${lat + BBOX_OFFSET},${lng + BBOX_OFFSET},EPSG:4326`
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    bbox,
  })
  const res = await fetch(`${baseUrl}?${params}`, {
    headers: { 'User-Agent': 'DakOppervlakte/1.0' },
  })
  const data = await res.json()
  return (data.features ?? []) as GeoJsonFeature[]
}

function pickClosestBuilding(
  features: GeoJsonFeature[],
  lat: number,
  lng: number
): GeoJsonFeature | null {
  if (features.length === 0) return null

  for (const f of features) {
    const ring = f.geometry.coordinates[0]
    if (pointInPolygon(lat, lng, ring)) return f
  }

  let best: GeoJsonFeature | null = null
  let bestDist = Infinity
  for (const f of features) {
    const [cLng, cLat] = centroid(f.geometry.coordinates[0])
    const dist = haversineDistance(lat, lng, cLat, cLng)
    if (dist < bestDist) {
      bestDist = dist
      best = f
    }
  }

  return bestDist <= MAX_DISTANCE_M ? best : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)

  try {
    for (const source of WFS_SOURCES) {
      const features = await queryWfs(source.url, source.typeName, latNum, lngNum)
      const match = pickClosestBuilding(features, latNum, lngNum)
      if (match) {
        return NextResponse.json({
          type: 'Feature',
          geometry: match.geometry,
        })
      }
    }
  } catch (e) {
    console.error('WFS query error', e)
  }

  return NextResponse.json({
    features: [],
    debug: { lat, lng, msg: 'No building found' },
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/building-polygon.test.ts`
Expected: PASS (all 6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/building-polygon/route.ts src/__tests__/api/building-polygon.test.ts
git commit -m "feat: rewrite building-polygon API to use GRB + UrbIS WFS"
```

---

### Task 3: Add `addPolygonFromPath` to `usePolygonDrawing`

**Files:**
- Modify: `src/hooks/usePolygonDrawing.ts`
- Modify: `src/__tests__/hooks/usePolygonDrawing.test.ts`

- [ ] **Step 1: Write failing test for `addPolygonFromPath`**

Add to the bottom of `src/__tests__/hooks/usePolygonDrawing.test.ts`, inside the outer `describe` block:

```typescript
  describe('Auto-generated polygon from external path', () => {
    it('adds a polygon from a coordinate path without entering drawing mode', () => {
      const { result } = setup()

      act(() => {
        result.current.addPolygonFromPath([
          { lat: 51.0, lng: 3.0 },
          { lat: 51.001, lng: 3.0 },
          { lat: 51.001, lng: 3.001 },
          { lat: 51.0, lng: 3.001 },
        ])
      })

      expect(result.current.mode).toBe('idle')
      expect(result.current.polygons).toHaveLength(1)
      expect(result.current.polygons[0].label).toBe('Auto')
    })

    it('calculates the area of the auto-generated polygon', () => {
      const { result } = setup()

      act(() => {
        result.current.addPolygonFromPath([
          { lat: 51.0, lng: 3.0 },
          { lat: 51.001, lng: 3.0 },
          { lat: 51.001, lng: 3.001 },
          { lat: 51.0, lng: 3.001 },
        ])
      })

      expect(google.maps.geometry.spherical.computeArea).toHaveBeenCalled()
      expect(result.current.polygons[0].area).toBe(100)
    })

    it('does nothing with fewer than 3 points', () => {
      const { result } = setup()

      act(() => {
        result.current.addPolygonFromPath([
          { lat: 51.0, lng: 3.0 },
          { lat: 51.001, lng: 3.0 },
        ])
      })

      expect(result.current.polygons).toHaveLength(0)
    })
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/hooks/usePolygonDrawing.test.ts`
Expected: FAIL — `addPolygonFromPath is not a function`

- [ ] **Step 3: Implement `addPolygonFromPath` in the hook**

In `src/hooks/usePolygonDrawing.ts`, add this function after the `finishPolygon` callback (around line 171), and before `startDrawing`:

```typescript
  const addPolygonFromPath = useCallback(
    (path: { lat: number; lng: number }[]) => {
      const map = mapInstanceRef.current
      if (!map || path.length < 3) return

      const color = generatePolygonColor()
      const polygon = new google.maps.Polygon({
        paths: path,
        fillColor: color,
        fillOpacity: 0.25,
        strokeColor: color,
        strokeWeight: 2,
        editable: true,
        draggable: false,
        map,
      })

      const areaSqM = google.maps.geometry.spherical.computeArea(polygon.getPath())
      const area = Math.round(areaSqM * 10) / 10
      const id = crypto.randomUUID()

      const entry: PolygonEntry = {
        id,
        label: 'Auto',
        area,
        polygon,
        heading: currentHeading,
        tilt: currentTilt,
        excluded: false,
      }
      polygonsRef.current = [...polygonsRef.current, entry]
      syncPolygons()

      const updateArea = () => {
        const pts: google.maps.LatLng[] = []
        polygon.getPath().forEach((p) => pts.push(p))
        const newArea = Math.round(google.maps.geometry.spherical.computeArea(pts) * 10) / 10
        polygonsRef.current = polygonsRef.current.map((e) =>
          e.id === id ? { ...e, area: newArea } : e
        )
        syncPolygons()
      }
      polygon.getPath().addListener('set_at', updateArea)
      polygon.getPath().addListener('insert_at', updateArea)
    },
    [mapInstanceRef, currentHeading, currentTilt]
  )
```

Then add `addPolygonFromPath` to the return object:

```typescript
  return {
    mode,
    pointCount,
    polygons,
    startDrawing,
    finishPolygon,
    addPolygonFromPath,
    deletePolygon,
    renamePolygon,
    togglePolygonExcluded,
    resetAll,
    restorePolygons,
    serializedPolygons,
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/hooks/usePolygonDrawing.test.ts`
Expected: PASS (all existing + 3 new tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePolygonDrawing.ts src/__tests__/hooks/usePolygonDrawing.test.ts
git commit -m "feat: add addPolygonFromPath to usePolygonDrawing"
```

---

### Task 4: Add Translation Keys

**Files:**
- Modify: `messages/nl.json`
- Modify: `messages/en.json`
- Modify: `messages/fr.json`

- [ ] **Step 1: Add keys to all three locale files**

In `messages/nl.json`, add inside the `"Sidebar"` object:

```json
    "autoGenerate": "Automatisch dakoppervlak genereren",
    "noBuildingFound": "Geen gebouw gevonden — teken handmatig"
```

In `messages/en.json`, add inside the `"Sidebar"` object:

```json
    "autoGenerate": "Auto-generate roof selection",
    "noBuildingFound": "No building found — draw manually"
```

In `messages/fr.json`, add inside the `"Sidebar"` object:

```json
    "autoGenerate": "Générer automatiquement la sélection du toit",
    "noBuildingFound": "Aucun bâtiment trouvé — dessinez manuellement"
```

- [ ] **Step 2: Run the existing test suite to ensure nothing breaks**

Run: `npm test`
Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add messages/nl.json messages/en.json messages/fr.json
git commit -m "feat: add translation keys for auto-generate building polygon"
```

---

### Task 5: Add Checkbox to AddressSearch Component

**Files:**
- Modify: `src/components/sidebar/AddressSearch.tsx`
- Modify: `src/__tests__/components/sidebar/AddressSearch.test.tsx`

- [ ] **Step 1: Write failing tests for the checkbox**

Add to the bottom of `src/__tests__/components/sidebar/AddressSearch.test.tsx`, inside the outer `describe` block. First update the `setup` function to support the new props:

Replace the existing `setup` function:

```typescript
function setup(overrides: Partial<React.ComponentProps<typeof AddressSearch>> = {}) {
  const props = {
    value: '',
    onChange: vi.fn(),
    onSearch: vi.fn(),
    searching: false,
    error: '',
    autoGenerate: false,
    onAutoGenerateChange: vi.fn(),
    ...overrides,
  }
  render(<AddressSearch {...props} />)
  return props
}
```

Then add the new tests:

```typescript
  describe('Auto-generate checkbox', () => {
    it('renders the auto-generate checkbox', () => {
      setup()
      expect(screen.getByRole('checkbox', { name: /automatisch/i })).toBeInTheDocument()
    })

    it('reflects the autoGenerate prop value', () => {
      setup({ autoGenerate: true })
      expect(screen.getByRole('checkbox', { name: /automatisch/i })).toBeChecked()
    })

    it('calls onAutoGenerateChange when toggled', async () => {
      const onAutoGenerateChange = vi.fn()
      setup({ onAutoGenerateChange })
      await userEvent.click(screen.getByRole('checkbox', { name: /automatisch/i }))
      expect(onAutoGenerateChange).toHaveBeenCalledWith(true)
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/components/sidebar/AddressSearch.test.tsx`
Expected: FAIL — checkbox not found

- [ ] **Step 3: Update the AddressSearch component**

Replace the full contents of `src/components/sidebar/AddressSearch.tsx`:

```tsx
'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input } from '@/components/ui'

interface AddressSearchProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  searching: boolean
  error: string
  autoGenerate: boolean
  onAutoGenerateChange: (value: boolean) => void
}

export function AddressSearch({
  value,
  onChange,
  onSearch,
  searching,
  error,
  autoGenerate,
  onAutoGenerateChange,
}: AddressSearchProps) {
  const t = useTranslations('Sidebar')

  return (
    <div
      style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input
            label={t('addressLabel')}
            id="address-search"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={t('addressPlaceholder')}
            error={error}
            aria-label={t('searchAriaLabel')}
          />
        </div>
        <Button
          variant="accent"
          onClick={onSearch}
          disabled={searching || !value.trim()}
          aria-label={t('searchButtonAriaLabel')}
          style={{ padding: '10px 16px', flexShrink: 0, marginBottom: error ? 22 : 0 }}
        >
          {searching ? '…' : '→'}
        </Button>
      </div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 10,
          fontSize: 13,
          color: 'var(--text-muted)',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={autoGenerate}
          onChange={(e) => onAutoGenerateChange(e.target.checked)}
          style={{ accentColor: 'var(--accent)' }}
        />
        {t('autoGenerate')}
      </label>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/components/sidebar/AddressSearch.test.tsx`
Expected: PASS (all existing + 3 new tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar/AddressSearch.tsx src/__tests__/components/sidebar/AddressSearch.test.tsx
git commit -m "feat: add auto-generate checkbox to AddressSearch"
```

---

### Task 6: Wire Everything Together in DakoppervlakteApp

**Files:**
- Modify: `src/components/DakoppervlakteApp.tsx`

- [ ] **Step 1: Add `autoGenerate` state and `autoGenerateError` state**

In `src/components/DakoppervlakteApp.tsx`, add after the existing `const [saved, setSaved] = useState(false)` line (line 53):

```typescript
  const [autoGenerate, setAutoGenerate] = useState(false)
  const [autoGenerateError, setAutoGenerateError] = useState('')
```

- [ ] **Step 2: Destructure `addPolygonFromPath` from `usePolygonDrawing`**

Update the destructuring of `usePolygonDrawing` (line 47-49) to include `addPolygonFromPath`:

```typescript
  const {
    mode, pointCount, polygons, startDrawing, finishPolygon,
    addPolygonFromPath,
    deletePolygon, renamePolygon, togglePolygonExcluded,
    resetAll, restorePolygons, serializedPolygons,
  } = usePolygonDrawing({ mapInstanceRef, currentHeading: heading, currentTilt: tilt })
```

- [ ] **Step 3: Rewrite `handleSearch` to support auto-generate**

Replace the existing `handleSearch` callback:

```typescript
  const handleSearch = useCallback(() => {
    setAutoGenerateError('')
    geocodeAndNavigate(address, () => {
      if (!autoGenerate) {
        setTimeout(() => startDrawing(), 600)
        return
      }
      const map = mapInstanceRef.current
      if (!map) return
      const center = map.getCenter()
      if (!center) return
      const lat = center.lat()
      const lng = center.lng()
      fetch(`/api/building-polygon?lat=${lat}&lng=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.type === 'Feature' && data.geometry?.coordinates) {
            const coords = data.geometry.coordinates[0] as [number, number][]
            const path = coords.map(([lng, lat]) => ({ lat, lng }))
            addPolygonFromPath(path)
          } else {
            setAutoGenerateError(t('Sidebar.noBuildingFound'))
            setTimeout(() => setAutoGenerateError(''), 5000)
            setTimeout(() => startDrawing(), 600)
          }
        })
        .catch(() => {
          setAutoGenerateError(t('Sidebar.noBuildingFound'))
          setTimeout(() => setAutoGenerateError(''), 5000)
          setTimeout(() => startDrawing(), 600)
        })
    })
  }, [address, autoGenerate, geocodeAndNavigate, startDrawing, addPolygonFromPath, mapInstanceRef, t])
```

- [ ] **Step 4: Pass new props to AddressSearch**

Update the `<AddressSearch>` JSX (around line 149) to pass the new props:

```tsx
          <AddressSearch
            value={address}
            onChange={setAddress}
            onSearch={handleSearch}
            searching={searching}
            error={searchError || autoGenerateError}
            autoGenerate={autoGenerate}
            onAutoGenerateChange={setAutoGenerate}
          />
```

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests PASS

- [ ] **Step 6: Run type checking**

Run: `npm run check`
Expected: no type errors

- [ ] **Step 7: Commit**

```bash
git add src/components/DakoppervlakteApp.tsx
git commit -m "feat: wire auto-generate building polygon into search flow"
```

---

### Task 7: Final Integration Verification

- [ ] **Step 1: Run the full test suite and type check**

Run: `npm run check && npm test`
Expected: all checks pass, all tests pass

- [ ] **Step 2: Start the dev server and manually test**

Run: `npm run dev`

Test the following scenarios in the browser:

1. **Checkbox off (existing behavior)**: Search an address → map navigates → drawing mode auto-starts after 600ms
2. **Checkbox on, building found**: Search a Flemish address (e.g., "Meir 1, Antwerpen") → map navigates → polygon auto-appears on the building → no drawing mode started → polygon shows in list as "Auto" → area is calculated
3. **Checkbox on, no building found**: Search a rural/unknown address → error message appears briefly under the search box → drawing mode starts as fallback
4. **Auto polygon is editable**: Click on the auto-generated polygon → vertices are draggable → area updates when edited
5. **Auto polygon can be deleted/renamed**: Use the polygon list to rename or delete the auto-generated polygon

- [ ] **Step 3: Commit any fixes found during manual testing**

If everything works, no commit needed. If fixes were needed, commit them.

- [ ] **Step 4: Update the ROADMAP**

In `ROADMAP.md`, mark the building polygon item as done:

Change:
```
- [ ] Belgium is supposed to have a register of polygons...
```
To:
```
- [x] Belgium is supposed to have a register of polygons...
```

```bash
git add ROADMAP.md
git commit -m "docs: mark auto-generate building polygon as done in ROADMAP"
```
