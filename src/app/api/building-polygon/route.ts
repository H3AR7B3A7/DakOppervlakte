import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  const results: any = {
    flanders_v2_gebouwen: null,
    flanders_v2_eenheden: null,
    flanders_wfs: null,
    brussels_wfs: null
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (DakOppervlakte/1.0)',
    'Accept': 'application/json'
  }

  // 1. Flanders Basisregisters v2 - Gebouwen
  try {
    const res = await fetch(`https://api.basisregisters.vlaanderen.be/v2/gebouwen?latlon=${lat},${lng}`, { headers })
    if (res.ok) {
      const data = await res.json()
      results.flanders_v2_gebouwen = data.gebouwen?.length || 0
      if (data.gebouwen?.length > 0) {
        const id = data.gebouwen[0].identificator.objectidentificator
        const detail = await fetch(`https://api.basisregisters.vlaanderen.be/v2/gebouwen/${id}`, { headers }).then(r => r.json())
        if (detail.geometriePolygoon) {
          return NextResponse.json({ type: 'Feature', geometry: detail.geometriePolygoon.polygoon })
        }
      }
    }
  } catch (e: any) { results.flanders_v2_gebouwen = 'Error: ' + e.message }

  // 2. Flanders Basisregisters v2 - Gebouweenheden (Units)
  try {
    const res = await fetch(`https://api.basisregisters.vlaanderen.be/v2/gebouweenheden?latlon=${lat},${lng}`, { headers })
    if (res.ok) {
      const data = await res.json()
      results.flanders_v2_eenheden = data.gebouweenheden?.length || 0
      if (data.gebouweenheden?.length > 0) {
        const buildingUrl = data.gebouweenheden[0].gebouw.detail
        const detail = await fetch(buildingUrl, { headers }).then(r => r.json())
        if (detail.geometriePolygoon) {
          return NextResponse.json({ type: 'Feature', geometry: detail.geometriePolygoon.polygoon })
        }
      }
    }
  } catch (e: any) { results.flanders_v2_eenheden = 'Error: ' + e.message }

  // 3. Flanders WFS (New Endpoint)
  try {
    const d = 0.0001
    const bbox = `${parseFloat(lng)-d},${parseFloat(lat)-d},${parseFloat(lng)+d},${parseFloat(lat)+d}`
    // Using the newer geoserver endpoint
    const wfsUrl = `https://geoserver.vlaanderen.be/grb/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=grb:GBG&outputFormat=application/json&srsName=EPSG:4326&bbox=${bbox},EPSG:4326`
    const res = await fetch(wfsUrl, { headers })
    if (res.ok) {
      const data = await res.json()
      results.flanders_wfs = data.features?.length || 0
      if (data.features?.length > 0) return NextResponse.json(data.features[0])
    }
  } catch (e: any) { results.flanders_wfs = 'Error: ' + e.message }

  // 4. Brussels WFS (UrbIS)
  try {
    const brusselsUrl = `https://geoserver.gis.irisnet.be/irisnet/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=urbis:BU&outputFormat=application/json&srsName=EPSG:4326&cql_filter=INTERSECTS(SHAPE,POINT(${lng} ${lat}))`
    const res = await fetch(brusselsUrl, { headers })
    if (res.ok) {
      const data = await res.json()
      results.brussels_wfs = data.features?.length || 0
      if (data.features?.length > 0) return NextResponse.json(data.features[0])
    }
  } catch (e: any) { results.brussels_wfs = 'Error: ' + e.message }

  return NextResponse.json({ 
    features: [], 
    debug: { 
      coords: `${lat},${lng}`,
      results,
      msg: "No building polygon found in any of the 4 Belgian data sources."
    } 
  })
}
