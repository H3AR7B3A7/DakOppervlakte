import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  // 1. Try Flanders (GRB)
  try {
    const flandersUrl = `https://geoservices.informatievlaanderen.be/overdrachter/grb/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=grb:GBG&outputFormat=application/json&srsName=EPSG:4326&cql_filter=INTERSECTS(SHAPE,POINT(${lng} ${lat}))`
    const res = await fetch(flandersUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.features && data.features.length > 0) {
        return NextResponse.json(data.features[0])
      }
    }
  } catch (e) {
    console.error('Flanders proxy error', e)
  }

  // 2. Try Brussels (UrbIS)
  try {
    const brusselsUrl = `https://geoserver.gis.irisnet.be/irisnet/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=urbis:BU&outputFormat=application/json&srsName=EPSG:4326&cql_filter=INTERSECTS(SHAPE,POINT(${lng} ${lat}))`
    const res = await fetch(brusselsUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.features && data.features.length > 0) {
        return NextResponse.json(data.features[0])
      }
    }
  } catch (e) {
    console.error('Brussels proxy error', e)
  }

  return NextResponse.json({ features: [] })
}
