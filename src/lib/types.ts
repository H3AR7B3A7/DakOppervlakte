export type Search = {
  address: string
  area_m2: number
  created_at: string
}

export type PolygonEntry = {
  id: string
  label: string
  area: number
  /** The actual Google Maps Polygon object – only present in browser context */
  polygon: google.maps.Polygon
}

export type DrawingMode = 'idle' | 'drawing'
