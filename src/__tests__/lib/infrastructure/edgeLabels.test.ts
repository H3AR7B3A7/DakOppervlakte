import { createEdgeLabels } from '@/lib/infrastructure/edgeLabels'
import { MockAdvancedMarkerElement } from '../../__mocks__/googleMaps'

type LatLngLike = google.maps.LatLng

const makeLatLng = (lat: number, lng: number): LatLngLike =>
  ({ lat: () => lat, lng: () => lng }) as unknown as LatLngLike

const makeMap = () => ({}) as unknown as google.maps.Map

describe('Distance labels on polygon edges', () => {
  beforeEach(() => {
    MockAdvancedMarkerElement.mockClear()
  })

  describe('For a finished polygon (closed shape)', () => {
    it('creates one label per edge, including the closing edge', () => {
      const labels = createEdgeLabels(makeMap(), 'nl-BE')

      labels.update([makeLatLng(51, 4), makeLatLng(51.1, 4.1), makeLatLng(51.0, 4.2)], true)

      expect(MockAdvancedMarkerElement).toHaveBeenCalledTimes(3)
    })

    it('each label displays a locale-formatted distance with a metre unit', () => {
      ;(
        google.maps.geometry.spherical.computeDistanceBetween as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue(12.3)
      const labels = createEdgeLabels(makeMap(), 'en-US')

      labels.update([makeLatLng(51, 4), makeLatLng(51.1, 4.1), makeLatLng(51.0, 4.2)], true)

      const marker = MockAdvancedMarkerElement.mock.results[0].value
      expect((marker.content as HTMLElement).textContent).toMatch(/12.*m/)
    })
  })

  describe('While drawing (open polyline)', () => {
    it('creates one label per segment, skipping the non-existent closing edge', () => {
      const labels = createEdgeLabels(makeMap(), 'nl-BE')

      labels.update([makeLatLng(51, 4), makeLatLng(51.1, 4.1), makeLatLng(51.0, 4.2)], false)

      expect(MockAdvancedMarkerElement).toHaveBeenCalledTimes(2)
    })

    it('shows no labels for fewer than two points', () => {
      const labels = createEdgeLabels(makeMap(), 'nl-BE')

      labels.update([makeLatLng(51, 4)], false)

      expect(MockAdvancedMarkerElement).not.toHaveBeenCalled()
    })
  })

  describe('Keeping labels in sync when the shape changes', () => {
    it('detaches the previous labels when a new path is supplied', () => {
      const labels = createEdgeLabels(makeMap(), 'nl-BE')

      labels.update([makeLatLng(51, 4), makeLatLng(51.1, 4.1), makeLatLng(51.0, 4.2)], true)
      const firstPass = [...MockAdvancedMarkerElement.mock.results]

      labels.update([makeLatLng(51, 4), makeLatLng(51.1, 4.1)], false)

      for (const result of firstPass) {
        expect(result.value.map).toBeNull()
      }
      const latest = MockAdvancedMarkerElement.mock.results.slice(firstPass.length)
      expect(latest).toHaveLength(1)
      expect(latest[0].value.map).not.toBeNull()
    })
  })

  describe('Hiding labels together with the polygon', () => {
    it('setMap(null) detaches every label from the map', () => {
      const labels = createEdgeLabels(makeMap(), 'nl-BE')
      labels.update([makeLatLng(51, 4), makeLatLng(51.1, 4.1), makeLatLng(51.0, 4.2)], true)

      labels.setMap(null)

      for (const result of MockAdvancedMarkerElement.mock.results) {
        expect(result.value.map).toBeNull()
      }
    })
  })

  describe('Degenerate edges between duplicate vertices', () => {
    it('skips labels for edges that would round to 0 m', () => {
      const distances = [12, 0, 8]
      let call = 0
      ;(
        google.maps.geometry.spherical.computeDistanceBetween as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(() => distances[call++] ?? 1)

      const labels = createEdgeLabels(makeMap(), 'nl-BE')
      labels.update([makeLatLng(51, 4), makeLatLng(51.1, 4.1), makeLatLng(51.0, 4.2)], true)

      expect(MockAdvancedMarkerElement).toHaveBeenCalledTimes(2)
    })
  })

  describe('Cleaning up when the polygon is removed', () => {
    it('clear() detaches all labels', () => {
      const labels = createEdgeLabels(makeMap(), 'nl-BE')
      labels.update([makeLatLng(51, 4), makeLatLng(51.1, 4.1), makeLatLng(51.0, 4.2)], true)

      labels.clear()

      for (const result of MockAdvancedMarkerElement.mock.results) {
        expect(result.value.map).toBeNull()
      }
    })
  })
})
