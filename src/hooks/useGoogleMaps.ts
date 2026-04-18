'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Loads the Google Maps JS SDK once, creates and returns a stable map instance
 * and geocoder. The mapRef should be attached to the container <div>.
 */
export function useGoogleMaps() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Load script
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.google?.maps) {
      setMapLoaded(true)
      return
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ''
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry,marker&loading=async&callback=initMap`
    script.async = true
    script.defer = true
    ;(window as unknown as { initMap: () => void }).initMap = () => setMapLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Initialise map instance once SDK is ready
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: { lat: 51.1, lng: 4.4 },
      zoom: 8,
      mapTypeId: 'satellite',
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      tilt: 0,
      heading: 0,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID',
    })

    geocoderRef.current = new google.maps.Geocoder()
  }, [mapLoaded])

  return { mapRef, mapInstanceRef, geocoderRef, mapLoaded }
}
