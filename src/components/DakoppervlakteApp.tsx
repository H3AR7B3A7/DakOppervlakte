'use client'

import { Show, useUser } from '@clerk/nextjs'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { Header } from '@/components/Header'
import { SidebarDrawer } from '@/components/layout'
import { DrawingOverlay, MapOverlayControls, MapView, PolygonChipBar } from '@/components/map'
import {
  AddressSearch,
  DrawerFooter,
  DrawerTitleBlock,
  DrawingHint,
  PolygonList,
  RotationControls,
  SaveResetControls,
  SearchHistory,
  StepGuide,
  TotalAreaDisplay,
} from '@/components/sidebar'
import { Button } from '@/components/ui'
import { normalizeHeading } from '@/domain/orientation/heading'
import type { Search } from '@/domain/search/types'
import { useGeocoding } from '@/hooks/useGeocoding'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { useMapOrientation } from '@/hooks/useMapOrientation'
import { usePolygonDrawing } from '@/hooks/usePolygonDrawing'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { useUsageCounter } from '@/hooks/useUsageCounter'
import { fetchBuildingPolygon } from '@/lib/infrastructure/buildingLookup'

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
  } = usePolygonDrawing({
    mapInstanceRef,
    currentHeading: heading,
    currentTilt: tilt,
    locale,
    t,
  })
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
    geocodeAndNavigate(address, async () => {
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
      const result = await fetchBuildingPolygon(center.lat(), center.lng())
      if (result.kind === 'found') {
        addPolygonFromPath(result.path)
        incrementAutogenCount(address)
        return
      }
      setAutoGenerateError(t('Sidebar.noBuildingFound'))
      setTimeout(() => setAutoGenerateError(''), 5000)
      setTimeout(() => startDrawing(), 600)
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
        const restoredPolygons = restored.polygons
        if (restoredPolygons) {
          setTimeout(() => restorePolygons(restoredPolygons), 500)
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
          closeLabel={t('Sidebar.closeMenu')}
        >
          <DrawerTitleBlock titleId={DRAWER_TITLE_ID} />

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

          <DrawerFooter usageCount={usageCount} autogenCount={autogenCount} />
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
