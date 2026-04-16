'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'

interface UseGeocodingOptions {
  mapInstanceRef: React.RefObject<google.maps.Map | null>
  geocoderRef: React.RefObject<google.maps.Geocoder | null>
}

export function useGeocoding({ mapInstanceRef, geocoderRef }: UseGeocodingOptions) {
  const t = useTranslations()
  const [address, setAddress] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const geocodeAndNavigate = useCallback(
    (addr: string, onComplete?: () => void) => {
      const map = mapInstanceRef.current
      const geocoder = geocoderRef.current
      if (!addr.trim() || !geocoder || !map) return

      setSearching(true)
      setSearchError('')

      geocoder.geocode(
        { address: addr + ', Belgium', region: 'BE' },
        (results, status) => {
          setSearching(false)
          if (status !== 'OK' || !results?.[0]) {
            setSearchError(t('Errors.addressNotFound'))
            return
          }
          map.setCenter(results[0].geometry.location)
          map.setZoom(20)
          onComplete?.()
        }
      )
    },
    [geocoderRef, mapInstanceRef, t]
  )

  return {
    address,
    setAddress,
    searching,
    searchError,
    setSearchError,
    geocodeAndNavigate,
  }
}
