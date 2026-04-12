'use client'

import React from 'react'
import { Spinner } from '@/components/ui'

interface MapViewProps {
  mapRef: React.RefObject<HTMLDivElement | null>
  mapLoaded: boolean
  children?: React.ReactNode
}

export function MapView({ mapRef, mapLoaded, children }: MapViewProps) {
  return (
    <main
      style={{ flex: 1, position: 'relative' }}
      aria-label="Interactieve kaart"
    >
      {!mapLoaded && (
        <div
          role="status"
          aria-label="Kaart laden..."
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            zIndex: 10,
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <Spinner />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Kaart laden...</p>
        </div>
      )}

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Overlays rendered on top of the map */}
      {mapLoaded && children}
    </main>
  )
}
