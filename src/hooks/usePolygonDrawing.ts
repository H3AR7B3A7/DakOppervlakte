'use client'

import { useCallback, useRef, useState } from 'react'
import type { PolygonEntry, DrawingMode } from '@/lib/types'
import { generatePolygonColor } from '@/lib/utils'

interface UsePolygonDrawingOptions {
  mapInstanceRef: React.RefObject<google.maps.Map | null>
}

export function usePolygonDrawing({ mapInstanceRef }: UsePolygonDrawingOptions) {
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const dblClickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const tempMarkersRef = useRef<google.maps.Marker[]>([])
  const tempPathRef = useRef<google.maps.LatLng[]>([])
  const previewPolyRef = useRef<google.maps.Polyline | null>(null)
  const polygonsRef = useRef<PolygonEntry[]>([])

  const [mode, setMode] = useState<DrawingMode>('idle')
  const [pointCount, setPointCount] = useState(0)
  const [polygons, setPolygons] = useState<PolygonEntry[]>([])

  const clearDrawingState = useCallback(() => {
    tempMarkersRef.current.forEach((m) => m.setMap(null))
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

    const entry: PolygonEntry = { id, label, area, polygon }
    polygonsRef.current = [...polygonsRef.current, entry]
    syncPolygons()
    setMode('idle')

    // Keep area in sync when user edits vertices
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
  }, [clearDrawingState, mapInstanceRef])

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

      const marker = new google.maps.Marker({
        position: pt,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: '#6ee7b7',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 1.5,
        },
        clickable: true,
      })

      // Clicking the first marker closes the polygon
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

  const resetAll = useCallback(() => {
    clearDrawingState()
    polygonsRef.current.forEach((e) => e.polygon.setMap(null))
    polygonsRef.current = []
    syncPolygons()
    setMode('idle')
  }, [clearDrawingState])

  return {
    mode,
    pointCount,
    polygons,
    startDrawing,
    finishPolygon,
    deletePolygon,
    renamePolygon,
    resetAll,
  }
}
