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
    // Override computeArea for this test so the assertion exercises the hook's
    // rounding logic rather than just the mock's default integer return value.
    // mockReturnValueOnce is consumed by the single computeArea call in
    // finishPolygon, after which the factory default (() => 100) takes over.
    ;(
      google.maps.geometry.spherical.computeArea as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValueOnce(123.456)
    const { result, map } = setup()
    drawThreePoints(map, result)
    act(() => result.current.finishPolygon())
    expect(result.current.mode).toBe('idle')
    expect(result.current.polygons).toHaveLength(1)
    // 123.456 rounded to 1 decimal place is 123.5 — if the hook stopped
    // rounding, this would read 123.456 and fail.
    expect(result.current.polygons[0].area).toBe(123.5)
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
    const setMapMock = polygon.setMap as ReturnType<typeof vi.fn>
    expect(setMapMock).not.toHaveBeenCalledWith(null)

    rerender({ heading: 90, tilt: 0 })
    expect(setMapMock).toHaveBeenCalledWith(null)

    // Snapshot the call count AFTER the hide step so subsequent assertions
    // only see calls made by the re-alignment branch — the setup-time
    // setMap(nonNullMap) from addPolygonFromPath must not satisfy the check.
    const callsAfterHide = setMapMock.mock.calls.length

    rerender({ heading: 0, tilt: 0 })

    const callsAfterRealign = setMapMock.mock.calls.slice(callsAfterHide)
    expect(callsAfterRealign.length).toBeGreaterThan(0)
    expect(callsAfterRealign[callsAfterRealign.length - 1][0]).not.toBeNull()
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
    const setMapNullCallsAfterToggle = (
      polygon.setMap as ReturnType<typeof vi.fn>
    ).mock.calls.filter((call) => call[0] === null).length
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
