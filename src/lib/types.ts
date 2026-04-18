import type { PolygonData } from '@/domain/polygon/types'
import type { EdgeLabelsController } from './edgeLabels'

export type Search = {
  id: number
  address: string
  area_m2: number
  created_at: string
  polygons?: PolygonData[]
}

export type PolygonEntry = {
  id: string
  label: string
  area: number
  /** The actual Google Maps Polygon object – only present in browser context */
  polygon: google.maps.Polygon
  /** Heading (cardinal direction, 0–360) when the polygon was created */
  heading: number
  /** Tilt (0 or 45) when the polygon was created */
  tilt: number
  /** Whether this polygon is excluded from the total area calculation */
  excluded: boolean
  /** Controls the distance labels rendered on each edge of this polygon */
  edgeLabels: EdgeLabelsController
}

export type DrawingMode = 'idle' | 'drawing'
