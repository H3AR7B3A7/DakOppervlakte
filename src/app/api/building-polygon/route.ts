import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })

  // Nominatim (OpenStreetMap) API - zeer robuust voor gebouw-geometrie
  // We gebruiken reverse geocoding met polygon_geojson=1
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&polygon_geojson=1&zoom=18`
    const res = await fetch(url, { headers: { 'User-Agent': 'DakOppervlakte/1.0' } })
    const data = await res.json()

    if (data.geojson) {
      let geometry = data.geojson
      
      // If it's a Point, generate a 10x10m square around it
      if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates
        const offset = 0.00005 // Approx 5-6 meters
        geometry = {
          type: 'Polygon',
          coordinates: [[
            [lng - offset, lat - offset],
            [lng + offset, lat - offset],
            [lng + offset, lat + offset],
            [lng - offset, lat + offset],
            [lng - offset, lat - offset]
          ]]
        }
      }

      return NextResponse.json({ 
        type: 'Feature', 
        geometry: geometry 
      })
    }
  } catch (e: any) {
    console.error('Nominatim error', e)
  }

  return NextResponse.json({ features: [], debug: { lat, lng, msg: "No building found via Nominatim" } })
}
