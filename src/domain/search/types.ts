import type { PolygonData } from '@/domain/polygon/types'

export type Search = {
  id: number
  address: string
  area_m2: number
  created_at: string
  polygons?: PolygonData[]
}
