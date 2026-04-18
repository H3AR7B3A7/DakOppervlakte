import { act, renderHook } from '@testing-library/react'
import { useMapOrientation } from '@/hooks/useMapOrientation'

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
      ;(listeners[event] ?? []).forEach((cb) => cb(...args))
    },
  }
}

describe('useMapOrientation', () => {
  describe('Initial state', () => {
    it('starts with heading 0, tilt 0, zoom 8', () => {
      const mapInstanceRef = { current: null }
      const { result } = renderHook(() => useMapOrientation({ mapInstanceRef, mapLoaded: false }))
      expect(result.current.heading).toBe(0)
      expect(result.current.tilt).toBe(0)
      expect(result.current.zoom).toBe(8)
    })

    it('cannot enable 3D at default zoom level 8', () => {
      const mapInstanceRef = { current: null }
      const { result } = renderHook(() => useMapOrientation({ mapInstanceRef, mapLoaded: false }))
      expect(result.current.canEnable3D).toBe(false)
      expect(result.current.is3D).toBe(false)
    })
  })

  describe('Rotating the map', () => {
    it('rotates heading by the given delta', () => {
      const mapInstanceRef = { current: null }
      const { result } = renderHook(() => useMapOrientation({ mapInstanceRef, mapLoaded: false }))
      act(() => result.current.handleRotate(90))
      expect(result.current.heading).toBe(90)
    })

    it('wraps heading around 360', () => {
      const mapInstanceRef = { current: null }
      const { result } = renderHook(() => useMapOrientation({ mapInstanceRef, mapLoaded: false }))
      act(() => result.current.handleRotate(-45))
      expect(result.current.heading).toBe(315)
    })
  })

  describe('Toggling 3D perspective', () => {
    it('does nothing when zoom is below threshold', () => {
      const mapInstanceRef = { current: null }
      const { result } = renderHook(() => useMapOrientation({ mapInstanceRef, mapLoaded: false }))
      act(() => result.current.handleTiltToggle())
      expect(result.current.tilt).toBe(0)
    })

    it('toggles tilt between 0 and 45 when zoom >= 14', () => {
      const map = createMockMap()
      map.getZoom.mockReturnValue(20)
      const mapInstanceRef = { current: map as unknown as google.maps.Map }

      const { result } = renderHook(() => useMapOrientation({ mapInstanceRef, mapLoaded: true }))

      act(() => map._trigger('zoom_changed'))

      act(() => result.current.handleTiltToggle())
      expect(result.current.tilt).toBe(45)

      act(() => result.current.handleTiltToggle())
      expect(result.current.tilt).toBe(0)
    })
  })

  describe('Syncing with map interactions', () => {
    it('updates heading and tilt when map fires idle event', () => {
      const map = createMockMap()
      map.getHeading.mockReturnValue(180)
      map.getTilt.mockReturnValue(45)
      const mapInstanceRef = { current: map as unknown as google.maps.Map }

      const { result } = renderHook(() => useMapOrientation({ mapInstanceRef, mapLoaded: true }))

      act(() => map._trigger('idle'))

      expect(result.current.heading).toBe(180)
      expect(result.current.tilt).toBe(45)
    })

    it('resets tilt to 0 when zoom drops below threshold', () => {
      const map = createMockMap()
      map.getZoom.mockReturnValue(20)
      const mapInstanceRef = { current: map as unknown as google.maps.Map }

      const { result } = renderHook(() => useMapOrientation({ mapInstanceRef, mapLoaded: true }))

      act(() => map._trigger('zoom_changed'))
      act(() => result.current.handleTiltToggle())
      expect(result.current.tilt).toBe(45)

      map.getZoom.mockReturnValue(10)
      act(() => map._trigger('zoom_changed'))

      expect(result.current.tilt).toBe(0)
      expect(result.current.zoom).toBe(10)
    })

    it('pushes heading changes to the map', () => {
      const map = createMockMap()
      const mapInstanceRef = { current: map as unknown as google.maps.Map }

      renderHook(() => useMapOrientation({ mapInstanceRef, mapLoaded: true }))

      expect(map.setHeading).toHaveBeenCalledWith(0)
    })

    it('cleans up listeners on unmount', () => {
      const map = createMockMap()
      const mapInstanceRef = { current: map as unknown as google.maps.Map }

      const { unmount } = renderHook(() => useMapOrientation({ mapInstanceRef, mapLoaded: true }))

      unmount()
      expect(google.maps.event.removeListener).toHaveBeenCalled()
    })
  })
})
