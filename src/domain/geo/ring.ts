// Ring coordinates follow GeoJSON convention: [lng, lat] pairs
export function pointInPolygon(lat: number, lng: number, ring: [number, number][]): boolean {
  if (ring.length < 4) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const iAboveLat = yi > lat
    const jAboveLat = yj > lat
    if (iAboveLat !== jAboveLat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function centroid(ring: [number, number][]): [number, number] {
  if (ring.length < 2) return [0, 0]
  let cx = 0
  let cy = 0
  const n = ring.length - 1
  for (let i = 0; i < n; i++) {
    cx += ring[i][0]
    cy += ring[i][1]
  }
  return [cx / n, cy / n]
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
