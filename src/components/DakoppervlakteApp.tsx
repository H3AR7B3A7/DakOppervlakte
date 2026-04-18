'use client'

import { Show, SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import { useLocale, useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'
import { Header } from '@/components/Header'
import { SidebarDrawer } from '@/components/layout'
import { DrawingOverlay, MapOverlayControls, MapView, PolygonChipBar } from '@/components/map'
import {
  AddressSearch,
  DrawingHint,
  PolygonList,
  RotationControls,
  SaveResetControls,
  SearchHistory,
  StepGuide,
  TotalAreaDisplay,
} from '@/components/sidebar'
import { Button } from '@/components/ui'
import { useGeocoding } from '@/hooks/useGeocoding'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { useMapOrientation } from '@/hooks/useMapOrientation'
import { usePolygonDrawing } from '@/hooks/usePolygonDrawing'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { useUsageCounter } from '@/hooks/useUsageCounter'
import type { Search } from '@/lib/types'
import { normalizeHeading } from '@/lib/utils'

const DRAWER_TITLE_ID = 'sidebar-drawer-title'

export function DakoppervlakteApp() {
  const t = useTranslations()
  const locale = useLocale()
  const { user } = useUser()
  const isSignedIn = !!user

  const { mapRef, mapInstanceRef, geocoderRef, mapLoaded } = useGoogleMaps()
  const { heading, setHeading, tilt, canEnable3D, is3D, handleRotate, handleTiltToggle } =
    useMapOrientation({ mapInstanceRef, mapLoaded })
  const { address, setAddress, searching, searchError, setSearchError, geocodeAndNavigate } =
    useGeocoding({ mapInstanceRef, geocoderRef })
  const {
    mode,
    pointCount,
    polygons,
    startDrawing,
    finishPolygon,
    undoLastPoint,
    addPolygonFromPath,
    deletePolygon,
    renamePolygon,
    togglePolygonExcluded,
    resetAll,
    restorePolygons,
    serializedPolygons,
  } = usePolygonDrawing({ mapInstanceRef, currentHeading: heading, currentTilt: tilt, locale })
  const { history, saveEntry, deleteEntry } = useSearchHistory(isSignedIn)
  const { count: usageCount, increment: incrementSearchCount } = useUsageCounter()
  const { count: autogenCount, increment: incrementAutogenCount } = useUsageCounter({
    endpoint: '/api/autogen-counter',
    storageKey: 'dakoppervlakte_autogen_addresses',
  })

  const [saved, setSaved] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [autoGenerateError, setAutoGenerateError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchFormCollapsed, setSearchFormCollapsed] = useState(false)

  const totalArea = polygons.reduce((sum, p) => (p.excluded ? sum : sum + p.area), 0)

  const handleSearch = useCallback(() => {
    setAutoGenerateError('')
    setSaved(false)
    if (autoGenerate) resetAll()
    geocodeAndNavigate(address, () => {
      incrementSearchCount(address)
      setSearchFormCollapsed(true)
      setDrawerOpen(false)
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
            incrementAutogenCount(address)
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
  }, [
    address,
    autoGenerate,
    geocodeAndNavigate,
    incrementSearchCount,
    incrementAutogenCount,
    startDrawing,
    addPolygonFromPath,
    mapInstanceRef,
    resetAll,
    t,
  ])

  const handleRestore = useCallback(
    (restored: Search) => {
      setAddress(restored.address)
      resetAll()
      setSaved(false)
      setSearchError('')
      setSearchFormCollapsed(true)
      setDrawerOpen(false)
      geocodeAndNavigate(restored.address, () => {
        if (restored.polygons) {
          setTimeout(() => restorePolygons(restored.polygons!), 500)
        }
      })
    },
    [geocodeAndNavigate, resetAll, restorePolygons, setAddress, setSearchError],
  )

  const handleSave = useCallback(async () => {
    await saveEntry(address, totalArea, serializedPolygons)
    setSaved(true)
    setDrawerOpen(false)
  }, [address, saveEntry, totalArea, serializedPolygons])

  const handleReset = useCallback(() => {
    resetAll()
    setAddress('')
    setSearchError('')
    setSaved(false)
    setSearchFormCollapsed(false)
    setDrawerOpen(false)
  }, [resetAll, setAddress, setSearchError])

  const handleStartDrawing = useCallback(() => {
    setSaved(false)
    setDrawerOpen(false)
    startDrawing()
  }, [startDrawing])

  const handleExpandSearch = useCallback(() => {
    setSearchFormCollapsed(false)
  }, [])

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header
        usageCount={usageCount}
        autogenCount={autogenCount}
        onMenuClick={() => setDrawerOpen((o) => !o)}
        drawerOpen={drawerOpen}
        drawerId={DRAWER_TITLE_ID}
      />

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          height: 'calc(100vh - 60px)',
          position: 'relative',
        }}
      >
        <SidebarDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          titleId={DRAWER_TITLE_ID}
        >
          <div
            style={{
              padding: '24px 24px 16px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <h1
              id={DRAWER_TITLE_ID}
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

          <div style={{ flexShrink: 0 }}>
            <AddressSearch
              value={address}
              onChange={setAddress}
              onSearch={handleSearch}
              searching={searching}
              error={searchError || autoGenerateError}
              autoGenerate={autoGenerate}
              onAutoGenerateChange={setAutoGenerate}
              collapsed={searchFormCollapsed}
              onExpand={handleExpandSearch}
            />
          </div>

          <div className="hidden md:block" style={{ flexShrink: 0 }}>
            <RotationControls
              heading={heading}
              tilt={tilt}
              is3D={is3D}
              canEnable3D={canEnable3D}
              onHeadingChange={(h) => setHeading(normalizeHeading(h))}
              onRotate={handleRotate}
              onTiltToggle={handleTiltToggle}
            />
          </div>

          <div
            className="thin-scrollbar"
            style={{
              padding: '16px 24px',
              flex: 1,
              minHeight: 0,
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
                ✏️ {polygons.length === 0 ? t('Sidebar.startDrawing') : t('Sidebar.addPlane')}
              </Button>
            )}

            {mode === 'drawing' && <DrawingHint pointCount={pointCount} onFinish={finishPolygon} />}

            <PolygonList
              polygons={polygons}
              currentHeading={heading}
              currentTilt={tilt}
              onDelete={deletePolygon}
              onRename={renamePolygon}
              onToggleExcluded={togglePolygonExcluded}
            />

            <TotalAreaDisplay totalArea={totalArea} polygonCount={polygons.length} />

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
            <div style={{ flexShrink: 0 }}>
              <SearchHistory history={history} onRestore={handleRestore} onDelete={deleteEntry} />
            </div>
          </Show>

          <div
            className="flex md:hidden"
            style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--border)',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 10,
              flexShrink: 0,
            }}
          >
            {usageCount !== null && usageCount > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                {t('Sidebar.statsBoast', { search: usageCount, autogen: autogenCount ?? 0 })}
              </span>
            )}
            <Show when="signed-out">
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <SignInButton mode="modal">
                  <Button variant="outline">{t('Header.signIn')}</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="accent">{t('Common.register')}</Button>
                </SignUpButton>
              </div>
            </Show>
          </div>
        </SidebarDrawer>

        <MapView mapRef={mapRef} mapLoaded={mapLoaded}>
          <MapOverlayControls
            is3D={is3D}
            canEnable3D={canEnable3D}
            onRotateLeft={() => handleRotate(-90)}
            onRotateRight={() => handleRotate(90)}
            onResetHeading={() => setHeading(0)}
            onTiltToggle={handleTiltToggle}
          />

          {mode === 'drawing' && <DrawingOverlay pointCount={pointCount} onUndo={undoLastPoint} />}

          {mode !== 'drawing' && (
            <PolygonChipBar
              polygons={polygons}
              onDelete={deletePolygon}
              onRename={renamePolygon}
              onToggleExcluded={togglePolygonExcluded}
            />
          )}
        </MapView>
      </div>
    </div>
  )
}
