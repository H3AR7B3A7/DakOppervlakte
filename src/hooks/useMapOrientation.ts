'use client'

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { normalizeHeading } from '@/domain/orientation/heading'

interface UseMapOrientationOptions {
  mapInstanceRef: RefObject<google.maps.Map | null>
  mapLoaded: boolean
}

const TILT_MIN_ZOOM = 14

export function useMapOrientation({ mapInstanceRef, mapLoaded }: UseMapOrientationOptions) {
  const [heading, setHeading] = useState(0)
  const [tilt, setTilt] = useState(0)
  const [zoom, setZoom] = useState(8)

  const canEnable3D = zoom >= TILT_MIN_ZOOM
  const is3D = tilt === 45

  useEffect(() => {
    mapInstanceRef.current?.setHeading(heading)
  }, [heading, mapInstanceRef])

  useEffect(() => {
    mapInstanceRef.current?.setTilt(tilt)
  }, [tilt, mapInstanceRef])

  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([])
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return
    const map = mapInstanceRef.current

    const onIdle = () => {
      const h = map.getHeading() ?? 0
      const t = map.getTilt() ?? 0
      setHeading((prev) => (prev !== h ? h : prev))
      setTilt((prev) => (prev !== t ? t : prev))
    }
    const onZoomChange = () => {
      const z = map.getZoom() ?? 8
      setZoom(z)
      if (z < TILT_MIN_ZOOM) {
        setTilt(0)
      }
    }

    const idleListener = map.addListener('idle', onIdle)
    const zoomListener = map.addListener('zoom_changed', onZoomChange)
    mapListenersRef.current.push(idleListener, zoomListener)

    return () => {
      mapListenersRef.current.forEach((l) => {
        google.maps.event.removeListener(l)
      })
      mapListenersRef.current = []
    }
  }, [mapLoaded, mapInstanceRef])

  const handleRotate = useCallback((delta: number) => {
    setHeading((h) => normalizeHeading(h + delta))
  }, [])

  const handleTiltToggle = useCallback(() => {
    if (!canEnable3D) return
    setTilt((t) => (t === 0 ? 45 : 0))
  }, [canEnable3D])

  return {
    heading,
    setHeading,
    tilt,
    zoom,
    canEnable3D,
    is3D,
    handleRotate,
    handleTiltToggle,
  }
}
