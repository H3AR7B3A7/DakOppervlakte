import { NextResponse } from 'next/server'
import { pointInPolygon, centroid, haversineDistance } from '@/lib/geo'

export const dynamic = 'force-dynamic'

const WFS_SOURCES = [
  {
    name: 'GRB',
    url: 'https://geo.api.vlaanderen.be/GRB/wfs',
    typeName: 'GRB:GBG',
  },
  {
    name: 'UrbIS',
    url: 'https://geoservices-urbis.irisnet.be/geoserver/UrbIS/wfs',
    typeName: 'UrbIS:Bu',
  },
]

const BBOX_OFFSET = 0.0005
const MAX_DISTANCE_M = 50

type GeoJsonPolygon = {
  type: 'Polygon'
  coordinates: [number, number][][]
}

type GeoJsonFeature = {
  type: 'Feature'
  geometry: GeoJsonPolygon
  properties?: Record<string, unknown>
}

async function queryWfs(
  baseUrl: string,
  typeName: string,
  lat: number,
  lng: number
): Promise<GeoJsonFeature[]> {
  const bbox = `${lng - BBOX_OFFSET},${lat - BBOX_OFFSET},${lng + BBOX_OFFSET},${lat + BBOX_OFFSET},EPSG:4326`
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    bbox,
  })
  const res = await fetch(`${baseUrl}?${params}`, {
    headers: { 'User-Agent': 'DakOppervlakte/1.0' },
  })
  const data = await res.json()
  return (data.features ?? []) as GeoJsonFeature[]
}

function pickClosestBuilding(
  features: GeoJsonFeature[],
  lat: number,
  lng: number
): GeoJsonFeature | null {
  if (features.length === 0) return null

  for (const f of features) {
    const ring = f.geometry.coordinates[0]
    if (pointInPolygon(lat, lng, ring)) return f
  }

  let best: GeoJsonFeature | null = null
  let bestDist = Infinity
  for (const f of features) {
    const [cLng, cLat] = centroid(f.geometry.coordinates[0])
    const dist = haversineDistance(lat, lng, cLat, cLng)
    if (dist < bestDist) {
      bestDist = dist
      best = f
    }
  }

  return bestDist <= MAX_DISTANCE_M ? best : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)

  try {
    for (const source of WFS_SOURCES) {
      const allFeatures = await queryWfs(source.url, source.typeName, latNum, lngNum)
      const features = allFeatures.filter((f) => {
        const type = f.properties?.TYPE ?? f.properties?.type
        return type === undefined || type === 1
      })
      const match = pickClosestBuilding(features.length > 0 ? features : allFeatures, latNum, lngNum)
      if (match) {
        return NextResponse.json({
          type: 'Feature',
          geometry: match.geometry,
        })
      }
    }
  } catch (e) {
    console.error('WFS query error', e)
  }

  return NextResponse.json({
    features: [],
    debug: { lat, lng, msg: 'No building found' },
  })
}
