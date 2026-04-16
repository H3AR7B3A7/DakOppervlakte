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
