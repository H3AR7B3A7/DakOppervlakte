import { fetchBuildingPolygon } from '@/lib/infrastructure/buildingLookup'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

beforeEach(() => {
  fetchMock.mockReset()
})

describe('fetchBuildingPolygon', () => {
  it('returns { kind: "found", path } when the API returns a valid Feature polygon', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
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
      }),
    })

    const result = await fetchBuildingPolygon(51.1, 4.4)

    expect(result.kind).toBe('found')
    if (result.kind === 'found') {
      expect(result.path).toEqual([
        { lat: 51.1, lng: 4.4 },
        { lat: 51.1, lng: 4.41 },
        { lat: 51.11, lng: 4.41 },
        { lat: 51.1, lng: 4.4 },
      ])
    }
    expect(fetchMock).toHaveBeenCalledWith('/api/building-polygon?lat=51.1&lng=4.4')
  })

  it('returns { kind: "not-found" } when the API does not return a Feature', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'not found' }),
    })

    const result = await fetchBuildingPolygon(51.1, 4.4)

    expect(result).toEqual({ kind: 'not-found' })
  })

  it('returns { kind: "not-found" } when the Feature has no coordinates', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: 'Feature', geometry: { type: 'Polygon' } }),
    })

    const result = await fetchBuildingPolygon(51.1, 4.4)

    expect(result).toEqual({ kind: 'not-found' })
  })

  it('returns { kind: "error" } when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))

    const result = await fetchBuildingPolygon(51.1, 4.4)

    expect(result).toEqual({ kind: 'error' })
  })

  it('returns { kind: "error" } when the JSON parse rejects', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError('bad JSON')
      },
    })

    const result = await fetchBuildingPolygon(51.1, 4.4)

    expect(result).toEqual({ kind: 'error' })
  })
})
