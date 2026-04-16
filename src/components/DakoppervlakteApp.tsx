'use client'

import React, { useCallback, useState } from 'react'
import { Show, useUser } from '@clerk/nextjs'

import { useTranslations } from 'next-intl'

import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { useMapOrientation } from '@/hooks/useMapOrientation'
import { useGeocoding } from '@/hooks/useGeocoding'
import { usePolygonDrawing } from '@/hooks/usePolygonDrawing'
import { useUsageCounter } from '@/hooks/useUsageCounter'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { normalizeHeading } from '@/lib/utils'
import type { Search } from '@/lib/types'

import { Button } from '@/components/ui'
import { Header } from '@/components/Header'
import { MapView, MapOverlayControls, DrawingOverlay } from '@/components/map'
import {
  AddressSearch,
  RotationControls,
  PolygonList,
  TotalAreaDisplay,
  DrawingHint,
  StepGuide,
  SearchHistory,
  SaveResetControls,
} from '@/components/sidebar'

export function DakoppervlakteApp() {
  const t = useTranslations()
  const { user } = useUser()
  const isSignedIn = !!user

  const { mapRef, mapInstanceRef, geocoderRef, mapLoaded } = useGoogleMaps()
  const {
    heading, setHeading, tilt, canEnable3D, is3D,
    handleRotate, handleTiltToggle,
  } = useMapOrientation({ mapInstanceRef, mapLoaded })
  const {
    address, setAddress, searching, searchError, setSearchError,
    geocodeAndNavigate,
  } = useGeocoding({ mapInstanceRef, geocoderRef })
  const {
    mode, pointCount, polygons, startDrawing, finishPolygon,
    addPolygonFromPath,
    deletePolygon, renamePolygon, togglePolygonExcluded,
    resetAll, restorePolygons, serializedPolygons,
  } = usePolygonDrawing({ mapInstanceRef, currentHeading: heading, currentTilt: tilt })
  const { count: usageCount, increment } = useUsageCounter()
  const { history, saveEntry, deleteEntry } = useSearchHistory(isSignedIn)

  const [saved, setSaved] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(false)
  const [autoGenerateError, setAutoGenerateError] = useState('')

  const totalArea = polygons.reduce((sum, p) => (p.excluded ? sum : sum + p.area), 0)

  const handleSearch = useCallback(() => {
    setAutoGenerateError('')
    setSaved(false)
    if (autoGenerate) resetAll()
    geocodeAndNavigate(address, () => {
      if (!autoGenerate) {
        setTimeout(() => startDrawing(), 600)
        return
      }
      const map = mapInstanceRef.current
      if (!map) return
      const center = map.getCenter()
      if (!center) return
      const lat = center.lat()
      const lng = center.lng()
      fetch(`/api/building-polygon?lat=${lat}&lng=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.type === 'Feature' && data.geometry?.coordinates) {
            const coords = data.geometry.coordinates[0] as [number, number][]
            const path = coords.map(([lng, lat]) => ({ lat, lng }))
            addPolygonFromPath(path)
          } else {
            setAutoGenerateError(t('Sidebar.noBuildingFound'))
            setTimeout(() => setAutoGenerateError(''), 5000)
            setTimeout(() => startDrawing(), 600)
          }
        })
        .catch(() => {
          setAutoGenerateError(t('Sidebar.noBuildingFound'))
          setTimeout(() => setAutoGenerateError(''), 5000)
          setTimeout(() => startDrawing(), 600)
        })
    })
  }, [address, autoGenerate, geocodeAndNavigate, startDrawing, addPolygonFromPath, mapInstanceRef, resetAll, t])

  const handleRestore = useCallback((restored: Search) => {
    setAddress(restored.address)
    resetAll()
    setSaved(false)
    setSearchError('')
    geocodeAndNavigate(restored.address, () => {
      if (restored.polygons) {
        setTimeout(() => restorePolygons(restored.polygons!), 500)
      }
    })
  }, [geocodeAndNavigate, resetAll, restorePolygons, setAddress, setSearchError])

  const handleSave = useCallback(async () => {
    await increment()
    await saveEntry(address, totalArea, serializedPolygons)
    setSaved(true)
  }, [address, increment, saveEntry, totalArea, serializedPolygons])

  const handleReset = useCallback(() => {
    resetAll()
    setAddress('')
    setSearchError('')
    setSaved(false)
  }, [resetAll, setAddress, setSearchError])

  const handleStartDrawing = useCallback(() => {
    setSaved(false)
    startDrawing()
  }, [startDrawing])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header usageCount={usageCount} />

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          height: 'calc(100vh - 60px)',
        }}
      >
        <aside
          style={{
            width: 360,
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '24px 24px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h1
              style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginBottom: 6,
                color: 'var(--text)',
              }}
            >
              {t('App.title')}
              <br />
              <span style={{ color: 'var(--accent)' }}>{t('App.titleAccent')}</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              {t('App.subtitle')}
            </p>
          </div>

          <AddressSearch
            value={address}
            onChange={setAddress}
            onSearch={handleSearch}
            searching={searching}
            error={searchError || autoGenerateError}
            autoGenerate={autoGenerate}
            onAutoGenerateChange={setAutoGenerate}
          />

          <RotationControls
            heading={heading}
            tilt={tilt}
            is3D={is3D}
            canEnable3D={canEnable3D}
            onHeadingChange={(h) => setHeading(normalizeHeading(h))}
            onRotate={handleRotate}
            onTiltToggle={handleTiltToggle}
          />

          <div
            style={{
              padding: '16px 24px',
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {mode === 'idle' && (
              <Button
                variant="accent"
                fullWidth
                onClick={handleStartDrawing}
                style={{ marginBottom: 16, padding: 11, fontWeight: 700 }}
              >
                ✏️{' '}
                {polygons.length === 0
                  ? t('Sidebar.startDrawing')
                  : t('Sidebar.addPlane')}
              </Button>
            )}

            {mode === 'drawing' && (
              <DrawingHint pointCount={pointCount} onFinish={finishPolygon} />
            )}

            <PolygonList
              polygons={polygons}
              currentHeading={heading}
              currentTilt={tilt}
              onDelete={deletePolygon}
              onRename={renamePolygon}
              onToggleExcluded={togglePolygonExcluded}
            />

            <TotalAreaDisplay
              totalArea={totalArea}
              polygonCount={polygons.length}
            />

            {polygons.length > 0 && mode === 'idle' && (
              <SaveResetControls
                saved={saved}
                isSignedIn={isSignedIn}
                onSave={handleSave}
                onReset={handleReset}
              />
            )}

            {polygons.length === 0 && mode === 'idle' && <StepGuide />}
          </div>

          <Show when="signed-in">
            <SearchHistory
              history={history}
              onRestore={handleRestore}
              onDelete={deleteEntry}
            />
          </Show>
        </aside>

        <MapView mapRef={mapRef} mapLoaded={mapLoaded}>
          <MapOverlayControls
            is3D={is3D}
            canEnable3D={canEnable3D}
            onRotateLeft={() => handleRotate(-90)}
            onRotateRight={() => handleRotate(90)}
            onResetHeading={() => setHeading(0)}
            onTiltToggle={handleTiltToggle}
          />

          {mode === 'drawing' && <DrawingOverlay pointCount={pointCount} />}
        </MapView>
      </div>
    </div>
  )
}
