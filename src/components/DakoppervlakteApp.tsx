'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SignInButton, SignUpButton, UserButton, Show, useUser } from '@clerk/nextjs'

import { useTranslations, useFormatter } from 'next-intl'

import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { usePolygonDrawing } from '@/hooks/usePolygonDrawing'
import { useUsageCounter } from '@/hooks/useUsageCounter'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { normalizeHeading } from '@/lib/utils'
import type { Search } from '@/lib/types'

import { Button, Logo } from '@/components/ui'
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
  const format = useFormatter()
  const { user } = useUser()
  const isSignedIn = !!user

  // Infrastructure hooks
  const { mapRef, mapInstanceRef, geocoderRef, mapLoaded } = useGoogleMaps()
  const {
    mode,
    pointCount,
    polygons,
    startDrawing,
    finishPolygon,
    deletePolygon,
    renamePolygon,
    resetAll,
    restorePolygons,
    serializedPolygons,
  } = usePolygonDrawing({ mapInstanceRef })
  const { count: usageCount, increment } = useUsageCounter()
  const { history, saveEntry } = useSearchHistory(isSignedIn)

  // Local UI state
  const [address, setAddress] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [saved, setSaved] = useState(false)
  const [heading, setHeading] = useState(0)
  const [tilt, setTilt] = useState(0)
  const [zoom, setZoom] = useState(8)

  // Google Maps only supports tilt on raster satellite maps at zoom >= 14
  const TILT_MIN_ZOOM = 14
  const canEnable3D = zoom >= TILT_MIN_ZOOM
  const is3D = tilt === 45

  const totalArea = polygons.reduce((sum, p) => sum + p.area, 0)

  // Sync heading → map
  useEffect(() => {
    mapInstanceRef.current?.setHeading(heading)
  }, [heading, mapInstanceRef])

  // Sync tilt → map
  useEffect(() => {
    mapInstanceRef.current?.setTilt(tilt)
  }, [tilt, mapInstanceRef])

  // Keep heading/tilt/zoom state in sync when the user interacts with the map
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
      // If zoom drops below threshold while 3D is active, snap tilt back to 0
      if (z < TILT_MIN_ZOOM) {
        setTilt(0)
      }
    }

    const idleListener = map.addListener('idle', onIdle)
    const zoomListener = map.addListener('zoom_changed', onZoomChange)
    mapListenersRef.current.push(idleListener, zoomListener)

    return () => {
      mapListenersRef.current.forEach((l) => google.maps.event.removeListener(l))
      mapListenersRef.current = []
    }
  }, [mapLoaded, mapInstanceRef])

  // --- Handlers ---

  const geocodeAndNavigate = useCallback((addr: string, onFinish?: () => void) => {
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
        if (onFinish) {
          onFinish()
        } else {
          setTimeout(() => startDrawing(), 600)
        }
      }
    )
  }, [geocoderRef, mapInstanceRef, startDrawing, t])

  const handleSearch = useCallback(() => {
    geocodeAndNavigate(address)
  }, [address, geocodeAndNavigate])

  const handleRestore = useCallback((restored: Search) => {
    setAddress(restored.address)
    resetAll()
    setSaved(false)
    setSearchError('')
    geocodeAndNavigate(restored.address, () => {
      if (restored.polygons) {
        // Short delay to ensure map is ready/stable before adding polygons
        setTimeout(() => restorePolygons(restored.polygons!), 500)
      }
    })
  }, [geocodeAndNavigate, resetAll, restorePolygons])

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
  }, [resetAll])

  const handleRotate = useCallback((delta: number) => {
    setHeading((h) => normalizeHeading(h + delta))
  }, [])

  const handleTiltToggle = useCallback(() => {
    if (!canEnable3D) return
    setTilt((t) => (t === 0 ? 45 : 0))
  }, [canEnable3D])

  const handleStartDrawing = useCallback(() => {
    setSaved(false)
    startDrawing()
  }, [startDrawing])

  // --- Render ---

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Logo />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {usageCount !== null && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                {format.number(usageCount)}
              </span>{' '}
              {t('Sidebar.calculationsCount', { count: usageCount })}
            </span>
          )}

          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="outline">{t('Header.signIn')}</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="accent">{t('Common.register')}</Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <UserButton
              appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }}
            />
          </Show>
        </div>
      </header>

      {/* ── Body ── */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          height: 'calc(100vh - 60px)',
        }}
      >
        {/* ── Sidebar ── */}
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
          {/* Title */}
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

          {/* Address search */}
          <AddressSearch
            value={address}
            onChange={setAddress}
            onSearch={handleSearch}
            searching={searching}
            error={searchError}
          />

          {/* Rotation controls */}
          <RotationControls
            heading={heading}
            tilt={tilt}
            is3D={is3D}
            canEnable3D={canEnable3D}
            onHeadingChange={(h) => setHeading(normalizeHeading(h))}
            onRotate={handleRotate}
            onTiltToggle={handleTiltToggle}
          />

          {/* Scrollable main content */}
          <div
            style={{
              padding: '16px 24px',
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {/* Drawing controls */}
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

            {/* Polygon list */}
            <PolygonList
              polygons={polygons}
              onDelete={deletePolygon}
              onRename={renamePolygon}
            />

            {/* Total area */}
            <TotalAreaDisplay
              totalArea={totalArea}
              polygonCount={polygons.length}
            />

            {/* Save / reset */}
            {polygons.length > 0 && mode === 'idle' && (
              <SaveResetControls
                saved={saved}
                isSignedIn={isSignedIn}
                onSave={handleSave}
                onReset={handleReset}
              />
            )}

            {/* Empty state guide */}
            {polygons.length === 0 && mode === 'idle' && <StepGuide />}
          </div>

          {/* History (signed-in only) */}
          <Show when="signed-in">
            <SearchHistory history={history} onRestore={handleRestore} />
          </Show>
        </aside>

        {/* ── Map ── */}
        <MapView mapRef={mapRef} mapLoaded={mapLoaded}>
          <MapOverlayControls
            tilt={tilt}
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
