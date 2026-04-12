import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper to calculate distance between two points in meters
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })

  const headers = { 'User-Agent': 'DakOppervlakte/1.0', 'Accept': 'application/json' }

  // 1. Flanders Basisregisters v2 - Gebouwen (Zoek op afstand)
  try {
    const res = await fetch(`https://api.basisregisters.vlaanderen.be/v2/gebouwen?latlon=${lat},${lng}`, { headers })
    if (res.ok) {
      const data = await res.json()
      if (data.gebouwen?.length > 0) {
        // Sort by distance to the click point to find the closest building
        const closest = data.gebouwen.sort((a: any, b: any) => {
          const d1 = getDistance(lat, lng, a.geometriePolygoon.punt.coordinates[1], a.geometriePolygoon.punt.coordinates[0])
          const d2 = getDistance(lat, lng, b.geometriePolygoon.punt.coordinates[1], b.geometriePolygoon.punt.coordinates[0])
          return d1 - d2
        })[0]

        const detail = await fetch(`https://api.basisregisters.vlaanderen.be/v2/gebouwen/${closest.identificator.objectidentificator}`, { headers }).then(r => r.json())
        if (detail.geometriePolygoon) {
          return NextResponse.json({ type: 'Feature', geometry: detail.geometriePolygoon.polygoon })
        }
      }
    }
  } catch (e: any) { console.error('Flanders Gebouwen error', e) }

  // 2. Flanders Basisregisters v2 - Gebouweenheden (Fallback)
  try {
    const res = await fetch(`https://api.basisregisters.vlaanderen.be/v2/gebouweenheden?latlon=${lat},${lng}`, { headers })
    if (res.ok) {
      const data = await res.json()
      if (data.gebouweenheden?.length > 0) {
        const buildingUrl = data.gebouweenheden[0].gebouw?.detail
        if (buildingUrl) {
          const detail = await fetch(buildingUrl, { headers }).then(r => r.json())
          if (detail.geometriePolygoon) {
            return NextResponse.json({ type: 'Feature', geometry: detail.geometriePolygoon.polygoon })
          }
        }
      }
    }
  } catch (e: any) { console.error('Flanders Eenheden error', e) }

  return NextResponse.json({ features: [], debug: { lat, lng, msg: "No building found" } })
}
