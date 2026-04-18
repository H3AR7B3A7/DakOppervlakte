export type PolygonData = {
  id: string
  label: string
  area: number
  path: { lat: number; lng: number }[]
  /** Heading (compass bearing, 0–360°) when the polygon was created */
  heading?: number
  /** Tilt (0 or 45) when the polygon was created */
  tilt?: number
}
