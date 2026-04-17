import { renderHook, act } from '@testing-library/react'
import { usePolygonDrawing } from '@/hooks/usePolygonDrawing'
import { MockPolygon, MockMarker, MockAdvancedMarkerElement, MockPolyline } from '../__mocks__/googleMaps'

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
      (listeners[event] ?? []).forEach((cb) => cb(...args))
    },
  }
}

function setup(overrides?: { heading?: number; tilt?: number }) {
  const map = createMockMap()
  const mapInstanceRef = { current: map as unknown as google.maps.Map }
  const heading = overrides?.heading ?? 0
  const tilt = overrides?.tilt ?? 0

  const hookResult = renderHook(
    (props) => usePolygonDrawing({
      mapInstanceRef,
      currentHeading: props.heading,
      currentTilt: props.tilt,
    }),
    { initialProps: { heading, tilt } }
  )

  return { map, mapInstanceRef, ...hookResult }
}

describe('User draws and manages roof polygons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    MockPolygon.mockClear()
    MockMarker.mockClear()
    MockAdvancedMarkerElement.mockClear()
    MockPolyline.mockClear()
  })

  describe('Before the user starts drawing', () => {
    it('has no polygons and shows idle state', () => {
      const { result } = setup()
      expect(result.current.mode).toBe('idle')
      expect(result.current.pointCount).toBe(0)
      expect(result.current.polygons).toEqual([])
    })
  })

  describe('User starts drawing a polygon', () => {
    it('shows a crosshair cursor on the map', () => {
      const { result, map } = setup()
      act(() => result.current.startDrawing())
      expect(map.setOptions).toHaveBeenCalledWith({ draggableCursor: 'crosshair' })
    })

    it('shows a preview line while drawing', () => {
      const { result } = setup()
      act(() => result.current.startDrawing())
      expect(MockPolyline).toHaveBeenCalledOnce()
    })

    it('stays idle when the map is not yet available', () => {
      const mapInstanceRef = { current: null }
      const { result } = renderHook(() =>
        usePolygonDrawing({ mapInstanceRef, currentHeading: 0, currentTilt: 0 })
      )
      act(() => result.current.startDrawing())
      expect(result.current.mode).toBe('idle')
    })
  })

  describe('User clicks points on the map', () => {
    it('tracks the number of placed points', () => {
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

    it('places a visible marker for each clicked point', () => {
      const { result, map } = setup()
      act(() => result.current.startDrawing())

      act(() => {
        map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
      })
      act(() => {
        map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
      })

      expect(MockAdvancedMarkerElement).toHaveBeenCalledTimes(2)
    })

    it('ignores map clicks that have no coordinates', () => {
      const { result, map } = setup()
      act(() => result.current.startDrawing())

      act(() => {
        map._trigger('click', {})
      })
      expect(result.current.pointCount).toBe(0)
    })
  })

  describe('User finishes drawing a polygon', () => {
    it('adds the polygon to the list and returns to idle', () => {
      const { result, map } = setup()
      act(() => result.current.startDrawing())

      act(() => {
        map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
        map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
        map._trigger('click', { latLng: { lat: () => 51.05, lng: () => 4.2 } })
      })

      act(() => result.current.finishPolygon())

      expect(result.current.mode).toBe('idle')
      expect(result.current.polygons).toHaveLength(1)
      expect(result.current.polygons[0].label).toBe('Vlak 1')
    })

    it('does nothing with fewer than 3 points', () => {
      const { result, map } = setup()
      act(() => result.current.startDrawing())

      act(() => {
        map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
        map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
      })

      act(() => result.current.finishPolygon())

      expect(result.current.mode).toBe('drawing')
      expect(result.current.polygons).toHaveLength(0)
    })

    it('calculates the area of the drawn shape', () => {
      const { result, map } = setup()
      act(() => result.current.startDrawing())

      act(() => {
        map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
        map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
        map._trigger('click', { latLng: { lat: () => 51.05, lng: () => 4.2 } })
      })

      act(() => result.current.finishPolygon())

      expect(google.maps.geometry.spherical.computeArea).toHaveBeenCalled()
      expect(result.current.polygons[0].area).toBe(100)
    })

    it('can also finish by double-clicking the map', () => {
      const { result, map } = setup()
      act(() => result.current.startDrawing())

      act(() => {
        map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
        map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
        map._trigger('click', { latLng: { lat: () => 51.05, lng: () => 4.2 } })
      })

      act(() => {
        map._trigger('dblclick', { stop: vi.fn() })
      })

      expect(result.current.mode).toBe('idle')
      expect(result.current.polygons).toHaveLength(1)
    })

    it('remembers the map orientation at the time of drawing', () => {
      const { result, map } = setup({ heading: 90, tilt: 45 })
      act(() => result.current.startDrawing())

      act(() => {
        map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
        map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
        map._trigger('click', { latLng: { lat: () => 51.05, lng: () => 4.2 } })
      })

      act(() => result.current.finishPolygon())

      expect(result.current.polygons[0].heading).toBe(90)
      expect(result.current.polygons[0].tilt).toBe(45)
    })

    it('auto-names successive polygons Vlak 1, Vlak 2, etc.', () => {
      const { result, map } = setup()

      act(() => result.current.startDrawing())
      act(() => {
        map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
        map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
        map._trigger('click', { latLng: { lat: () => 51.05, lng: () => 4.2 } })
      })
      act(() => result.current.finishPolygon())

      act(() => result.current.startDrawing())
      act(() => {
        map._trigger('click', { latLng: { lat: () => 52, lng: () => 5 } })
        map._trigger('click', { latLng: { lat: () => 52.1, lng: () => 5.1 } })
        map._trigger('click', { latLng: { lat: () => 52.05, lng: () => 5.2 } })
      })
      act(() => result.current.finishPolygon())

      expect(result.current.polygons[0].label).toBe('Vlak 1')
      expect(result.current.polygons[1].label).toBe('Vlak 2')
    })
  })

  describe('User undoes the last placed point while drawing', () => {
    it('right-clicking the map removes the most recent point', () => {
      const { result, map } = setup()
      act(() => result.current.startDrawing())
      act(() => {
        map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
        map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
      })
      expect(result.current.pointCount).toBe(2)

      act(() => {
        map._trigger('rightclick', { stop: vi.fn() })
      })

      expect(result.current.pointCount).toBe(1)
    })

    it('undoing with no placed points is a no-op', () => {
      const { result } = setup()
      act(() => result.current.startDrawing())
      expect(result.current.pointCount).toBe(0)

      act(() => result.current.undoLastPoint())

      expect(result.current.pointCount).toBe(0)
    })
  })

  describe('User manages existing polygons', () => {
    function setupWithPolygon() {
      const ctx = setup()
      act(() => ctx.result.current.startDrawing())
      act(() => {
        ctx.map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
        ctx.map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
        ctx.map._trigger('click', { latLng: { lat: () => 51.05, lng: () => 4.2 } })
      })
      act(() => ctx.result.current.finishPolygon())
      return ctx
    }

    it('user can delete a polygon', () => {
      const { result } = setupWithPolygon()
      const id = result.current.polygons[0].id

      act(() => result.current.deletePolygon(id))

      expect(result.current.polygons).toHaveLength(0)
    })

    it('deleted polygon disappears from the map', () => {
      const { result } = setupWithPolygon()
      const polygon = result.current.polygons[0].polygon
      const id = result.current.polygons[0].id

      act(() => result.current.deletePolygon(id))

      expect(polygon.setMap).toHaveBeenCalledWith(null)
    })

    it('user can rename a polygon', () => {
      const { result } = setupWithPolygon()
      const id = result.current.polygons[0].id

      act(() => result.current.renamePolygon(id, 'Voordak'))

      expect(result.current.polygons[0].label).toBe('Voordak')
    })

    it('user can exclude and re-include a polygon from total', () => {
      const { result } = setupWithPolygon()
      const id = result.current.polygons[0].id

      expect(result.current.polygons[0].excluded).toBe(false)

      act(() => result.current.togglePolygonExcluded(id))
      expect(result.current.polygons[0].excluded).toBe(true)

      act(() => result.current.togglePolygonExcluded(id))
      expect(result.current.polygons[0].excluded).toBe(false)
    })
  })

  describe('User resets all work', () => {
    it('removes all polygons and returns to idle', () => {
      const { result, map } = setup()

      act(() => result.current.startDrawing())
      act(() => {
        map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
        map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
        map._trigger('click', { latLng: { lat: () => 51.05, lng: () => 4.2 } })
      })
      act(() => result.current.finishPolygon())

      act(() => result.current.resetAll())

      expect(result.current.polygons).toHaveLength(0)
      expect(result.current.mode).toBe('idle')
    })
  })

  describe('User restores a previous search', () => {
    it('recreates the saved polygons on the map', () => {
      const { result } = setup()

      act(() => {
        result.current.restorePolygons([
          { id: 'a', label: 'Voordak', area: 50, path: [{ lat: 51, lng: 4 }, { lat: 51.1, lng: 4.1 }, { lat: 51.05, lng: 4.2 }], heading: 0, tilt: 0 },
          { id: 'b', label: 'Achterdak', area: 30, path: [{ lat: 52, lng: 5 }, { lat: 52.1, lng: 5.1 }, { lat: 52.05, lng: 5.2 }], heading: 0, tilt: 0 },
        ])
      })

      expect(result.current.polygons).toHaveLength(2)
      expect(result.current.polygons[0].label).toBe('Voordak')
      expect(result.current.polygons[1].label).toBe('Achterdak')
    })
  })

  describe('Saving polygon data for persistence', () => {
    it('produces a serializable snapshot of all polygons', () => {
      const { result, map } = setup()

      act(() => result.current.startDrawing())
      act(() => {
        map._trigger('click', { latLng: { lat: () => 51, lng: () => 4 } })
        map._trigger('click', { latLng: { lat: () => 51.1, lng: () => 4.1 } })
        map._trigger('click', { latLng: { lat: () => 51.05, lng: () => 4.2 } })
      })
      act(() => result.current.finishPolygon())

      const serialized = result.current.serializedPolygons
      expect(serialized).toHaveLength(1)
      expect(serialized[0]).toHaveProperty('id')
      expect(serialized[0]).toHaveProperty('label', 'Vlak 1')
      expect(serialized[0]).toHaveProperty('area')
      expect(serialized[0]).toHaveProperty('path')
      expect(serialized[0]).toHaveProperty('heading', 0)
      expect(serialized[0]).toHaveProperty('tilt', 0)
    })
  })

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
})
