import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })

  const headers = { 'User-Agent': 'DakOppervlakte/1.0', 'Accept': 'application/json' }
  const debug: any[] = []

  // 1. Flanders WFS (Most reliable for complex shapes)
  try {
    const d = 0.0002
    const bbox = `${parseFloat(lng)-d},${parseFloat(lat)-d},${parseFloat(lng)+d},${parseFloat(lat)+d}`
    const wfsUrl = `https://geoserver.vlaanderen.be/grb/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=grb:GBG&outputFormat=application/json&srsName=EPSG:4326&bbox=${bbox},EPSG:4326`
    
    const res = await fetch(wfsUrl, { headers })
    if (res.ok) {
      const data = await res.json()
      debug.push({ source: 'wfs', found: data.features?.length || 0 })
      if (data.features?.length > 0) {
        // Return first valid feature
        return NextResponse.json({ type: 'Feature', geometry: data.features[0].geometry })
      }
    }
  } catch (e: any) { debug.push({ source: 'wfs', error: e.message }) }

  return NextResponse.json({ features: [], debug: { lat, lng, msg: "No building found", steps: debug } })
}
