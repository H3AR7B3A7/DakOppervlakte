import { fromPolygonData, toPolygonData } from '@/domain/polygon/serialize'

describe('toPolygonData', () => {
  it('returns a PolygonData object with all fields passed through', () => {
    const result = toPolygonData({
      id: 'abc',
      label: 'Vlak 1',
      area: 120.5,
      path: [
        { lat: 51.1, lng: 4.4 },
        { lat: 51.2, lng: 4.5 },
        { lat: 51.15, lng: 4.6 },
      ],
      heading: 90,
      tilt: 45,
    })

    expect(result).toEqual({
      id: 'abc',
      label: 'Vlak 1',
      area: 120.5,
      path: [
        { lat: 51.1, lng: 4.4 },
        { lat: 51.2, lng: 4.5 },
        { lat: 51.15, lng: 4.6 },
      ],
      heading: 90,
      tilt: 45,
    })
  })

  it('produces a new array for path so callers cannot mutate the input', () => {
    const path = [
      { lat: 51.1, lng: 4.4 },
      { lat: 51.2, lng: 4.5 },
      { lat: 51.15, lng: 4.6 },
    ]
    const result = toPolygonData({
      id: 'abc',
      label: 'Vlak 1',
      area: 120.5,
      path,
      heading: 0,
      tilt: 0,
    })

    expect(result.path).not.toBe(path)
    expect(result.path).toEqual(path)
  })
})

describe('fromPolygonData', () => {
  it('returns the same field values when heading and tilt are present', () => {
    const data = {
      id: 'abc',
      label: 'Vlak 1',
      area: 120.5,
      path: [
        { lat: 51.1, lng: 4.4 },
        { lat: 51.2, lng: 4.5 },
        { lat: 51.15, lng: 4.6 },
      ],
      heading: 90,
      tilt: 45,
    }

    expect(fromPolygonData(data)).toEqual({
      id: 'abc',
      label: 'Vlak 1',
      area: 120.5,
      path: data.path,
      heading: 90,
      tilt: 45,
    })
  })

  it('defaults heading to 0 when undefined', () => {
    const result = fromPolygonData({
      id: 'abc',
      label: 'Vlak 1',
      area: 120.5,
      path: [
        { lat: 51.1, lng: 4.4 },
        { lat: 51.2, lng: 4.5 },
        { lat: 51.15, lng: 4.6 },
      ],
    })
    expect(result.heading).toBe(0)
    expect(result.tilt).toBe(0)
  })

  it('defaults only the missing field', () => {
    const result = fromPolygonData({
      id: 'abc',
      label: 'Vlak 1',
      area: 120.5,
      path: [
        { lat: 51.1, lng: 4.4 },
        { lat: 51.2, lng: 4.5 },
        { lat: 51.15, lng: 4.6 },
      ],
      heading: 180,
    })
    expect(result.heading).toBe(180)
    expect(result.tilt).toBe(0)
  })
})
