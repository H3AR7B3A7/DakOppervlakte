import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  // 1. Try Flanders (Basisregisters Vlaanderen)
  try {
    // Increase search reliability by fetching nearby buildings if exact location fails
    // Using a 20m buffer by slightly varying coordinates if needed, 
    // but the API also supports searching with a point.
    const searchUrl = `https://api.basisregisters.vlaanderen.be/v2/gebouwen?latlon=${lat},${lng}`
    const searchRes = await fetch(searchUrl)
    
    if (searchRes.ok) {
      const searchData = await searchRes.json()
      
      // If no building at exact point, try a small offset search (North, South, East, West)
      let buildingId = searchData.gebouwen?.[0]?.identificator?.objectidentificator
      
      if (!buildingId) {
        const offsets = [0.0001, -0.0001]
        for (const dx of offsets) {
          for (const dy of offsets) {
            const offUrl = `https://api.basisregisters.vlaanderen.be/v2/gebouwen?latlon=${parseFloat(lat)+dy},${parseFloat(lng)+dx}`
            const offRes = await fetch(offUrl)
            const offData = await offRes.json()
            if (offData.gebouwen?.length > 0) {
              buildingId = offData.gebouwen[0].identificator.objectidentificator
              break
            }
          }
          if (buildingId) break
        }
      }

      if (buildingId) {
        const detailRes = await fetch(`https://api.basisregisters.vlaanderen.be/v2/gebouwen/${buildingId}`)
        if (detailRes.ok) {
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
    console.error('Flanders Basisregisters error', e)
  }

  // 2. Brussels Fallback
  try {
    const brusselsUrl = `https://geoserver.gis.irisnet.be/irisnet/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=urbis:BU&outputFormat=application/json&srsName=EPSG:4326&bbox=${parseFloat(lng)-0.0002},${parseFloat(lat)-0.0002},${parseFloat(lng)+0.0002},${parseFloat(lat)+0.0002}`
    const res = await fetch(brusselsUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.features && data.features.length > 0) return NextResponse.json(data.features[0])
    }
  } catch (e) {}

  return NextResponse.json({ features: [] })
}
