'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PolygonEntry, DrawingMode, PolygonData } from '@/lib/types'
import { generatePolygonColor, normalizeHeading } from '@/lib/utils'

interface UsePolygonDrawingOptions {
  mapInstanceRef: React.RefObject<google.maps.Map | null>
  currentHeading: number
  currentTilt: number
}

export function usePolygonDrawing({ mapInstanceRef, currentHeading, currentTilt }: UsePolygonDrawingOptions) {
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const dblClickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const tempMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const tempPathRef = useRef<google.maps.LatLng[]>([])
  const previewPolyRef = useRef<google.maps.Polyline | null>(null)
  const polygonsRef = useRef<PolygonEntry[]>([])

  const [mode, setMode] = useState<DrawingMode>('idle')
  const [pointCount, setPointCount] = useState(0)
  const [polygons, setPolygons] = useState<PolygonEntry[]>([])

  // Auto-sync visibility based on orientation
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    polygonsRef.current.forEach((p) => {
      const headingMatch = normalizeHeading(p.heading) === normalizeHeading(currentHeading)
      const tiltMatch = p.tilt === currentTilt
      const shouldBeOnMap = headingMatch && tiltMatch
      
      if (shouldBeOnMap && p.polygon.getMap() !== map) {
        p.polygon.setMap(map)
      } else if (!shouldBeOnMap && p.polygon.getMap() === map) {
        p.polygon.setMap(null)
      }
    })
  }, [currentHeading, currentTilt, mapInstanceRef, polygons])

  const serializedPolygons: PolygonData[] = polygons.map((p) => {
    const pts: { lat: number; lng: number }[] = []
    p.polygon.getPath().forEach((pt) => pts.push({ lat: pt.lat(), lng: pt.lng() }))
    return { id: p.id, label: p.label, area: p.area, path: pts, heading: p.heading, tilt: p.tilt }
  })

  const clearDrawingState = useCallback(() => {
    tempMarkersRef.current.forEach((m) => { m.map = null })
    tempMarkersRef.current = []
    tempPathRef.current = []
    if (previewPolyRef.current) {
      previewPolyRef.current.setMap(null)
      previewPolyRef.current = null
    }
    clickListenerRef.current?.remove()
    clickListenerRef.current = null
    dblClickListenerRef.current?.remove()
    dblClickListenerRef.current = null
    mapInstanceRef.current?.setOptions({ draggableCursor: '' })
    setPointCount(0)
  }, [mapInstanceRef])

  const syncPolygons = () => {
    setPolygons([...polygonsRef.current])
  }

  const resetAll = useCallback(() => {
    clearDrawingState()
    polygonsRef.current.forEach((e) => e.polygon.setMap(null))
    polygonsRef.current = []
    syncPolygons()
    setMode('idle')
  }, [clearDrawingState])


  const restorePolygons = useCallback(
    (data: PolygonData[]) => {
      const map = mapInstanceRef.current
      if (!map) return
      resetAll()

      const restored: PolygonEntry[] = data.map((d) => {
        const polygon = new google.maps.Polygon({
          paths: d.path,
          fillColor: generatePolygonColor(),
          fillOpacity: 0.25,
          strokeColor: generatePolygonColor(),
          strokeWeight: 2,
          editable: true,
          draggable: false,
          map,
        })

        const updateArea = () => {
          const pts: google.maps.LatLng[] = []
          polygon.getPath().forEach((p) => pts.push(p))
          const newArea = Math.round(google.maps.geometry.spherical.computeArea(pts) * 10) / 10
          polygonsRef.current = polygonsRef.current.map((e) =>
            e.id === d.id ? { ...e, area: newArea } : e
          )
          syncPolygons()
        }
        polygon.getPath().addListener('set_at', updateArea)
        polygon.getPath().addListener('insert_at', updateArea)

        return {
          id: d.id,
          label: d.label,
          area: d.area,
          polygon,
          heading: d.heading ?? 0,
          tilt: d.tilt ?? 0,
          excluded: false,
        }
      })

      polygonsRef.current = restored
      syncPolygons()
    },
    [mapInstanceRef, resetAll]
  )

  const finishPolygon = useCallback(() => {
    const path = tempPathRef.current
    if (path.length < 3) return
    clearDrawingState()

    const color = generatePolygonColor()
    const polygon = new google.maps.Polygon({
      paths: path,
      fillColor: color,
      fillOpacity: 0.25,
      strokeColor: color,
      strokeWeight: 2,
      editable: true,
      draggable: false,
      map: mapInstanceRef.current,
    })

    const areaSqM = google.maps.geometry.spherical.computeArea(polygon.getPath())
    const area = Math.round(areaSqM * 10) / 10
    const id = crypto.randomUUID()
    const label = `Vlak ${polygonsRef.current.length + 1}`

    const entry: PolygonEntry = {
      id,
      label,
      area,
      polygon,
      heading: currentHeading,
      tilt: currentTilt,
      excluded: false,
    }
    polygonsRef.current = [...polygonsRef.current, entry]
    syncPolygons()
    setMode('idle')

    const updateArea = () => {
      const pts: google.maps.LatLng[] = []
      polygon.getPath().forEach((p) => pts.push(p))
      const newArea = Math.round(google.maps.geometry.spherical.computeArea(pts) * 10) / 10
      polygonsRef.current = polygonsRef.current.map((e) =>
        e.id === id ? { ...e, area: newArea } : e
      )
      syncPolygons()
    }
    polygon.getPath().addListener('set_at', updateArea)
    polygon.getPath().addListener('insert_at', updateArea)
  }, [clearDrawingState, mapInstanceRef, currentHeading, currentTilt])

  const startDrawing = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return
    clearDrawingState()
    setMode('drawing')
    setPointCount(0)
    map.setOptions({ draggableCursor: 'crosshair' })

    const previewLine = new google.maps.Polyline({
      strokeColor: '#6ee7b7',
      strokeWeight: 1.5,
      strokeOpacity: 0.6,
      map,
    })
    previewPolyRef.current = previewLine

    clickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      const pt = e.latLng
      tempPathRef.current.push(pt)
      setPointCount(tempPathRef.current.length)

      const dot = document.createElement('div')
      dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#6ee7b7;border:1.5px solid #fff;box-sizing:border-box'

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: pt,
        map,
        content: dot,
        gmpClickable: true,
      })

      if (tempPathRef.current.length === 1) {
        marker.addListener('click', () => {
          if (tempPathRef.current.length >= 3) finishPolygon()
        })
      }

      tempMarkersRef.current.push(marker)
      previewLine.setPath(tempPathRef.current)
    })

    dblClickListenerRef.current = map.addListener(
      'dblclick',
      (e: google.maps.MapMouseEvent) => {
        e.stop?.()
        if (tempPathRef.current.length >= 3) finishPolygon()
      }
    )
  }, [clearDrawingState, finishPolygon, mapInstanceRef])

  const deletePolygon = useCallback((id: string) => {
    const entry = polygonsRef.current.find((e) => e.id === id)
    entry?.polygon.setMap(null)
    polygonsRef.current = polygonsRef.current.filter((e) => e.id !== id)
    syncPolygons()
  }, [])

  const renamePolygon = useCallback((id: string, label: string) => {
    polygonsRef.current = polygonsRef.current.map((e) =>
      e.id === id ? { ...e, label } : e
    )
    syncPolygons()
  }, [])

  const togglePolygonExcluded = useCallback((id: string) => {
    polygonsRef.current = polygonsRef.current.map((e) => {
      if (e.id !== id) return e
      return { ...e, excluded: !e.excluded }
    })
    syncPolygons()
  }, [])

  return {
    mode,
    pointCount,
    polygons,
    startDrawing,
    finishPolygon,
    deletePolygon,
    renamePolygon,
    togglePolygonExcluded,
    resetAll,
    restorePolygons,
    serializedPolygons,
  }
}
