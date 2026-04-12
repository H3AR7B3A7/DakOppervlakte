import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json'
  }

  // 1. Try Flanders via Geopunt Location Service (Most robust)
  try {
    const geopuntUrl = `https://loc.geopunt.be/v4/Location?latlon=${lat},${lng}`
    const res = await fetch(geopuntUrl, { headers })
    
    if (res.ok) {
      const data = await res.json()
      // Geopunt returns LocationResult with a building ID (if found)
      if (data.LocationResult?.[0]?.BoundingBox) {
        // We can use the center of the bounding box to find the building in Basisregisters
        const bb = data.LocationResult[0].BoundingBox
        const midLat = (bb.LowerLeft.Lat_WGS84 + bb.UpperRight.Lat_WGS84) / 2
        const midLng = (bb.LowerLeft.Lon_WGS84 + bb.UpperRight.Lon_WGS84) / 2

        // Now fetch from Basisregisters with the normalized coordinate
        const searchUrl = `https://api.basisregisters.vlaanderen.be/v2/gebouwen?latlon=${midLat},${midLng}`
        const searchRes = await fetch(searchUrl, { headers })
        const searchData = await searchRes.json()

        if (searchData.gebouwen?.length > 0) {
          const buildingId = searchData.gebouwen[0].identificator.objectidentificator
          const detailRes = await fetch(`https://api.basisregisters.vlaanderen.be/v2/gebouwen/${buildingId}`, { headers })
          const detailData = await detailRes.json()
          
          if (detailData.geometriePolygoon) {
            return NextResponse.json({
              type: 'Feature',
              geometry: detailData.geometriePolygoon.polygoon
            })
          }
        }
      }
    }
  } catch (e) {
    console.error('Geopunt/Basisregisters error:', e)
  }

  // 2. Fallback to WFS with a slightly larger BBOX
  try {
    const d = 0.0002
    const bbox = `${parseFloat(lng)-d},${parseFloat(lat)-d},${parseFloat(lng)+d},${parseFloat(lat)+d}`
    const wfsUrl = `https://geoservices.informatievlaanderen.be/overdrachter/grb/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=grb:GBG&outputFormat=application/json&srsName=EPSG:4326&bbox=${bbox}`
    const res = await fetch(wfsUrl, { headers })
    if (res.ok) {
      const data = await res.json()
      if (data.features?.length > 0) return NextResponse.json(data.features[0])
    }
  } catch (e) {}

  return NextResponse.json({ features: [], debug: { lat, lng, msg: 'No building found in Flanders or Brussels' } })
}
