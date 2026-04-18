import type { PolygonData } from '@/domain/polygon/types'

type PolygonDataFields = {
  id: string
  label: string
  area: number
  path: { lat: number; lng: number }[]
  heading: number
  tilt: number
}

/**
 * Builds a PolygonData from already-extracted polygon fields.
 * The domain layer never touches google.maps.Polygon directly, so the
 * caller is responsible for reading the path out of a live Polygon via
 * getPath() before handing it in.
 */
export function toPolygonData(fields: PolygonDataFields): PolygonData {
  return {
    id: fields.id,
    label: fields.label,
    area: fields.area,
    path: fields.path.map((pt) => ({ lat: pt.lat, lng: pt.lng })),
    heading: fields.heading,
    tilt: fields.tilt,
  }
}

/**
 * Normalises an inbound PolygonData by filling heading/tilt defaults.
 * Used when restoring a polygon from persisted data.
 */
export function fromPolygonData(data: PolygonData): PolygonDataFields {
  return {
    id: data.id,
    label: data.label,
    area: data.area,
    path: data.path,
    heading: data.heading ?? 0,
    tilt: data.tilt ?? 0,
  }
}
