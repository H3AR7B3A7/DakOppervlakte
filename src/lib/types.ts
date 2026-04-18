import type { EdgeLabelsController } from './infrastructure/edgeLabels'

export type PolygonEntry = {
  id: string
  label: string
  area: number
  /** The actual Google Maps Polygon object – only present in browser context */
  polygon: google.maps.Polygon
  /** Heading (compass bearing, 0–360°) when the polygon was created */
  heading: number
  /** Tilt (0 or 45) when the polygon was created */
  tilt: number
  /** Whether this polygon is excluded from the total area calculation */
  excluded: boolean
  /** Controls the distance labels rendered on each edge of this polygon */
  edgeLabels: EdgeLabelsController
}

export type DrawingMode = 'idle' | 'drawing'
