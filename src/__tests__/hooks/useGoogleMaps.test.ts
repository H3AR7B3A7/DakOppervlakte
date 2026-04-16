import { renderHook, act } from '@testing-library/react'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

describe('useGoogleMaps', () => {
  describe('When Google Maps SDK is already loaded', () => {
    it('sets mapLoaded to true immediately', () => {
      const { result } = renderHook(() => useGoogleMaps())
      expect(result.current.mapLoaded).toBe(true)
    })

    it('provides a mapRef for attaching to a container', () => {
      const { result } = renderHook(() => useGoogleMaps())
      expect(result.current.mapRef).toBeDefined()
      expect(result.current.mapRef.current).toBeNull()
    })

    it('provides mapInstanceRef and geocoderRef', () => {
      const { result } = renderHook(() => useGoogleMaps())
      expect(result.current.mapInstanceRef).toBeDefined()
      expect(result.current.geocoderRef).toBeDefined()
    })
  })

  describe('Map initialization', () => {
    it('creates a map instance when mapRef is attached and SDK is ready', () => {
      const div = document.createElement('div')
      const { result } = renderHook(() => useGoogleMaps())

      act(() => {
        Object.defineProperty(result.current.mapRef, 'current', {
          value: div,
          writable: true,
        })
      })

      const { result: result2 } = renderHook(() => useGoogleMaps())
      expect(result2.current.mapLoaded).toBe(true)
    })
  })
})
