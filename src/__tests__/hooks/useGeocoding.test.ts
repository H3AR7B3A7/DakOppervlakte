import { act } from '@testing-library/react'
import { useGeocoding } from '@/hooks/useGeocoding'
import { renderHookWithIntl } from '../test-utils'

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

function createMockGeocoder() {
  return {
    geocode: vi.fn(),
  }
}

function setup() {
  const map = createMockMap()
  const geocoder = createMockGeocoder()
  const mapInstanceRef = { current: map as unknown as google.maps.Map }
  const geocoderRef = { current: geocoder as unknown as google.maps.Geocoder }
  return { map, geocoder, mapInstanceRef, geocoderRef }
}

describe('useGeocoding', () => {
  describe('Searching for an address', () => {
    it('starts with empty state', () => {
      const { mapInstanceRef, geocoderRef } = setup()
      const { result } = renderHookWithIntl(() =>
        useGeocoding({ mapInstanceRef, geocoderRef })
      )
      expect(result.current.address).toBe('')
      expect(result.current.searching).toBe(false)
      expect(result.current.searchError).toBe('')
    })

    it('sets searching to true during geocode and false after', async () => {
      const { mapInstanceRef, geocoderRef, geocoder } = setup()
      geocoder.geocode.mockImplementation((_req: unknown, cb: (...args: unknown[]) => void) => {
        cb([{ geometry: { location: { lat: () => 51, lng: () => 4 } } }], 'OK')
      })

      const { result } = renderHookWithIntl(() =>
        useGeocoding({ mapInstanceRef, geocoderRef })
      )

      act(() => result.current.geocodeAndNavigate('Meir 1'))

      expect(result.current.searching).toBe(false)
    })

    it('centers and zooms the map on a successful result', () => {
      const { map, mapInstanceRef, geocoderRef, geocoder } = setup()
      const location = { lat: () => 51.2, lng: () => 4.4 }
      geocoder.geocode.mockImplementation((_req: unknown, cb: (...args: unknown[]) => void) => {
        cb([{ geometry: { location } }], 'OK')
      })

      const { result } = renderHookWithIntl(() =>
        useGeocoding({ mapInstanceRef, geocoderRef })
      )

      act(() => result.current.geocodeAndNavigate('Meir 1'))

      expect(map.setCenter).toHaveBeenCalledWith(location)
      expect(map.setZoom).toHaveBeenCalledWith(20)
    })

    it('sets an error when the address is not found', () => {
      const { mapInstanceRef, geocoderRef, geocoder } = setup()
      geocoder.geocode.mockImplementation((_req: unknown, cb: (...args: unknown[]) => void) => {
        cb(null, 'ZERO_RESULTS')
      })

      const { result } = renderHookWithIntl(() =>
        useGeocoding({ mapInstanceRef, geocoderRef })
      )

      act(() => result.current.geocodeAndNavigate('Nonexistent street'))

      expect(result.current.searchError).toBe('Adres niet gevonden. Probeer een vollediger adres.')
    })

    it('ignores empty or whitespace-only addresses', () => {
      const { mapInstanceRef, geocoderRef, geocoder } = setup()
      const { result } = renderHookWithIntl(() =>
        useGeocoding({ mapInstanceRef, geocoderRef })
      )

      act(() => result.current.geocodeAndNavigate('   '))

      expect(geocoder.geocode).not.toHaveBeenCalled()
      expect(result.current.searching).toBe(false)
    })

    it('calls onComplete callback after successful navigation', () => {
      const { mapInstanceRef, geocoderRef, geocoder } = setup()
      geocoder.geocode.mockImplementation((_req: unknown, cb: (...args: unknown[]) => void) => {
        cb([{ geometry: { location: { lat: () => 51, lng: () => 4 } } }], 'OK')
      })
      const onComplete = vi.fn()

      const { result } = renderHookWithIntl(() =>
        useGeocoding({ mapInstanceRef, geocoderRef })
      )

      act(() => result.current.geocodeAndNavigate('Meir 1', onComplete))

      expect(onComplete).toHaveBeenCalledOnce()
    })

    it('does not call onComplete when geocode fails', () => {
      const { mapInstanceRef, geocoderRef, geocoder } = setup()
      geocoder.geocode.mockImplementation((_req: unknown, cb: (...args: unknown[]) => void) => {
        cb(null, 'ZERO_RESULTS')
      })
      const onComplete = vi.fn()

      const { result } = renderHookWithIntl(() =>
        useGeocoding({ mapInstanceRef, geocoderRef })
      )

      act(() => result.current.geocodeAndNavigate('Nope', onComplete))

      expect(onComplete).not.toHaveBeenCalled()
    })

    it('does nothing when geocoder or map is not available', () => {
      const mapInstanceRef = { current: null }
      const geocoderRef = { current: null }

      const { result } = renderHookWithIntl(() =>
        useGeocoding({ mapInstanceRef, geocoderRef })
      )

      act(() => result.current.geocodeAndNavigate('Meir 1'))

      expect(result.current.searching).toBe(false)
    })

    it('appends Belgium suffix to geocode request', () => {
      const { mapInstanceRef, geocoderRef, geocoder } = setup()
      geocoder.geocode.mockImplementation((_req: unknown, cb: (...args: unknown[]) => void) => {
        cb([{ geometry: { location: { lat: () => 51, lng: () => 4 } } }], 'OK')
      })

      const { result } = renderHookWithIntl(() =>
        useGeocoding({ mapInstanceRef, geocoderRef })
      )

      act(() => result.current.geocodeAndNavigate('Meir 1'))

      expect(geocoder.geocode).toHaveBeenCalledWith(
        { address: 'Meir 1, Belgium', region: 'BE' },
        expect.any(Function)
      )
    })
  })
})
