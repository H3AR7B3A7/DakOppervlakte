export type LatLng = { lat: number; lng: number }

export type BuildingLookupResult =
  | { kind: 'found'; path: LatLng[] }
  | { kind: 'not-found' }
  | { kind: 'error' }

/**
 * Fetches the building polygon at the given map coordinates from our
 * `/api/building-polygon` endpoint. The API returns a GeoJSON Feature when a
 * building is found, or an object without a `type: 'Feature'` shape when no
 * building is registered at those coordinates.
 *
 * Network errors and unexpected response shapes collapse into `{ kind: 'error' }`
 * and `{ kind: 'not-found' }` respectively, so callers only have to handle
 * three observable outcomes.
 */
export async function fetchBuildingPolygon(
  lat: number,
  lng: number,
): Promise<BuildingLookupResult> {
  try {
    const res = await fetch(`/api/building-polygon?lat=${lat}&lng=${lng}`)
    const data = await res.json()
    if (data?.type === 'Feature' && data.geometry?.coordinates) {
      const coords = data.geometry.coordinates[0] as [number, number][]
      const path = coords.map(([lon, la]) => ({ lat: la, lng: lon }))
      return { kind: 'found', path }
    }
    return { kind: 'not-found' }
  } catch {
    return { kind: 'error' }
  }
}
