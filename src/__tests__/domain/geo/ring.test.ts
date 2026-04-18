import { centroid, haversineDistance, pointInPolygon } from '@/domain/geo/ring'

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
