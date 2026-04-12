import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })

  const headers = { 'User-Agent': 'DakOppervlakte/1.0', 'Accept': 'application/json' }
  const debug: any[] = []

  // 1. Flanders Basisregisters v2 - Gebouwen
  try {
    const res = await fetch(`https://api.basisregisters.vlaanderen.be/v2/gebouwen?latlon=${lat},${lng}`, { headers })
    const data = await res.json()
    debug.push({ source: 'gebouwen', found: data.gebouwen?.length || 0 })
    
    if (data.gebouwen?.length > 0) {
      // Probeer de eerste, maar als er geen geometrie is, probeer de tweede
      for (const b of data.gebouwen) {
        const detail = await fetch(`https://api.basisregisters.vlaanderen.be/v2/gebouwen/${b.identificator.objectidentificator}`, { headers }).then(r => r.json())
        if (detail.geometriePolygoon) {
          return NextResponse.json({ type: 'Feature', geometry: detail.geometriePolygoon.polygoon })
        }
      }
    }
  } catch (e: any) { debug.push({ source: 'gebouwen', error: e.message }) }

  return NextResponse.json({ features: [], debug: { lat, lng, msg: "No building found", steps: debug } })
}
