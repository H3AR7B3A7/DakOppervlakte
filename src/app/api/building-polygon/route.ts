import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  // Use a small bounding box instead of a point to be more robust
  const delta = 0.0001 
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`

  // 1. Try Flanders (GRB)
  // Using WFS 1.0.0 as it's more consistent with Longitude/Latitude order for EPSG:4326
  try {
    const flandersUrl = `https://geoservices.informatievlaanderen.be/overdrachter/grb/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=grb:GBG&outputFormat=application/json&srsName=EPSG:4326&bbox=${bbox}`
    console.log('Fetching Flanders:', flandersUrl)
    const res = await fetch(flandersUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.features && data.features.length > 0) {
        // Return the first feature found in the bbox
        return NextResponse.json(data.features[0])
      }
    }
  } catch (e) {
    console.error('Flanders proxy error', e)
  }

  // 2. Try Brussels (UrbIS)
  try {
    const brusselsUrl = `https://geoserver.gis.irisnet.be/irisnet/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=urbis:BU&outputFormat=application/json&srsName=EPSG:4326&bbox=${bbox}`
    console.log('Fetching Brussels:', brusselsUrl)
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
