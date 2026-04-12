'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { SignInButton, SignUpButton, UserButton, Show, useUser } from '@clerk/nextjs'

declare global {
  interface Window {
    google: typeof google
    initMap: () => void
  }
}

type Search = { address: string; area_m2: number; created_at: string }

export default function Home() {
  const { user } = useUser()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const polygonRef = useRef<google.maps.Polygon | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const tempMarkersRef = useRef<google.maps.Marker[]>([])
  const tempPathRef = useRef<google.maps.LatLng[]>([])
  const previewPolyRef = useRef<google.maps.Polyline | null>(null)

  const [address, setAddress] = useState('')
  const [area, setArea] = useState<number | null>(null)
  const [usageCount, setUsageCount] = useState<number | null>(null)
  const [history, setHistory] = useState<Search[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searching, setSearching] = useState(false)
  const [mode, setMode] = useState<'idle' | 'drawing' | 'done'>('idle')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pointCount, setPointCount] = useState(0)

  useEffect(() => {
    fetch('/api/counter').then(r => r.json()).then(d => setUsageCount(d.count))
  }, [])

  useEffect(() => {
    if (user) {
      fetch('/api/searches').then(r => r.json()).then(d => {
        if (Array.isArray(d)) setHistory(d)
      })
    }
  }, [user])

  // Load Maps with new async pattern (no deprecated drawing library)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as Window & typeof globalThis).google?.maps) { setMapLoaded(true); return }

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry&loading=async&callback=initMap`
    script.async = true
    script.defer = true
    ;(window as Window & typeof globalThis).initMap = () => setMapLoaded(true)
    document.head.appendChild(script)
  }, [])

  const calculateArea = useCallback((path: google.maps.LatLng[]) => {
    const areaSqM = google.maps.geometry.spherical.computeArea(path)
    setArea(Math.round(areaSqM * 10) / 10)
    setMode('done')
    setSaved(false)
  }, [])

  const clearDrawing = useCallback(() => {
    // Remove temp markers
    tempMarkersRef.current.forEach(m => m.setMap(null))
    tempMarkersRef.current = []
    tempPathRef.current = []
    if (previewPolyRef.current) { previewPolyRef.current.setMap(null); previewPolyRef.current = null }
    if (clickListenerRef.current) { clickListenerRef.current.remove(); clickListenerRef.current = null }
    if (mapInstanceRef.current) mapInstanceRef.current.setOptions({ draggableCursor: '' })
    setPointCount(0)
  }, [])

  const finishPolygon = useCallback(() => {
    const path = tempPathRef.current
    if (path.length < 3) return

    clearDrawing()

    if (polygonRef.current) polygonRef.current.setMap(null)

    const polygon = new google.maps.Polygon({
      paths: path,
      fillColor: '#6ee7b7',
      fillOpacity: 0.25,
      strokeColor: '#6ee7b7',
      strokeWeight: 2,
      editable: true,
      draggable: false,
      map: mapInstanceRef.current,
    })
    polygonRef.current = polygon
    calculateArea(path)

    // Recalculate on edit
    const update = () => {
      const pts: google.maps.LatLng[] = []
      polygon.getPath().forEach(p => pts.push(p))
      calculateArea(pts)
    }
    polygon.getPath().addListener('set_at', update)
    polygon.getPath().addListener('insert_at', update)
  }, [clearDrawing, calculateArea])

  const startDrawingMode = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return

    clearDrawing()
    if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null }
    setArea(null)
    setMode('drawing')
    setSaved(false)
    setPointCount(0)

    map.setOptions({ draggableCursor: 'crosshair' })

    // Preview polyline (shows line from last point to cursor — optional enhancement)
    const previewLine = new google.maps.Polyline({
      strokeColor: '#6ee7b7',
      strokeWeight: 1.5,
      strokeOpacity: 0.5,
      map,
    })
    previewPolyRef.current = previewLine

    clickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      const pt = e.latLng
      tempPathRef.current.push(pt)
      setPointCount(tempPathRef.current.length)

      // Small dot marker for each point
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

      // Click first marker to close polygon
      if (tempPathRef.current.length === 1) {
        marker.addListener('click', () => {
          if (tempPathRef.current.length >= 3) finishPolygon()
        })
      }

      tempMarkersRef.current.push(marker)

      // Update preview polyline
      previewLine.setPath(tempPathRef.current)

      // Auto-close after enough points if user clicks first marker
      // Also allow double-click to finish
    })

    // Double-click to finish
    map.addListener('dblclick', () => {
      if (tempPathRef.current.length >= 3) finishPolygon()
    })
  }, [clearDrawing, finishPolygon])

  // Init map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 51.1, lng: 4.4 },
      zoom: 8,
      mapTypeId: 'satellite',
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
    })

    mapInstanceRef.current = map
    geocoderRef.current = new google.maps.Geocoder()
  }, [mapLoaded])

  const handleSearch = async () => {
    if (!address.trim() || !geocoderRef.current || !mapInstanceRef.current) return
    setSearching(true)
    setError('')

    geocoderRef.current.geocode(
      { address: address + ', Belgium', region: 'BE' },
      (results, status) => {
        setSearching(false)
        if (status !== 'OK' || !results || !results[0]) {
          setError('Adres niet gevonden. Probeer een vollediger adres.')
          return
        }
        const loc = results[0].geometry.location
        mapInstanceRef.current!.setCenter(loc)
        mapInstanceRef.current!.setZoom(20)

        setTimeout(() => startDrawingMode(), 600)
      }
    )
  }

  const handleSave = async () => {
    const counterRes = await fetch('/api/counter', { method: 'POST' })
    const counterData = await counterRes.json()
    setUsageCount(counterData.count)
    setSaved(true)

    if (user && address && area) {
      await fetch('/api/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, area_m2: area }),
      })
      const hist = await fetch('/api/searches').then(r => r.json())
      if (Array.isArray(hist)) setHistory(hist)
    }
  }

  const handleReset = () => {
    clearDrawing()
    if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null }
    setArea(null)
    setMode('idle')
    setAddress('')
    setError('')
    setSaved(false)
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' },
    header: {
      borderBottom: '1px solid var(--border)', padding: '0 24px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100,
    },
    logo: { display: 'flex', alignItems: 'center', gap: 10 },
    logoText: { fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text)' },
    headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
    counter: { fontSize: 12, color: 'var(--text-muted)' },
    btnOutline: {
      background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
      padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
    },
    btnAccent: {
      background: 'var(--accent)', border: 'none', color: '#000',
      padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    },
    body: { display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 60px)' },
    sidebar: {
      width: 360, background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
    },
    sidebarTop: { padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' },
    h1: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8, color: 'var(--text)' },
    subtitle: { color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 },
    searchSection: { padding: '20px 24px', borderBottom: '1px solid var(--border)' },
    label: { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' as const, display: 'block', marginBottom: 8, fontFamily: 'Syne, sans-serif' },
    inputRow: { display: 'flex', gap: 8 },
    input: {
      flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 8, color: 'var(--text)', padding: '10px 14px', fontSize: 14, outline: 'none',
    },
    searchBtn: {
      background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#000',
      padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
      fontFamily: 'Syne, sans-serif',
    },
    content: { padding: '20px 24px', flex: 1, overflowY: 'auto' as const },
    stepItem: { display: 'flex', gap: 12, alignItems: 'flex-start' },
    stepNum: {
      width: 22, height: 22, borderRadius: '50%', background: 'var(--surface2)',
      border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)',
      flexShrink: 0, fontFamily: 'Syne, sans-serif',
    },
    drawingHint: {
      background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.3)',
      borderRadius: 10, padding: 16, textAlign: 'center' as const,
    },
    resultBox: {
      background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.3)',
      borderRadius: 12, padding: 20, marginBottom: 16, textAlign: 'center' as const,
    },
    areaNum: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 48, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 },
    btnPrimary: {
      background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#000',
      padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'Syne, sans-serif', width: '100%',
    },
    btnSecondary: {
      background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
      color: 'var(--text)', padding: 11, fontSize: 13, cursor: 'pointer', width: '100%',
    },
    btnGhost: {
      background: 'transparent', border: 'none', color: 'var(--text-muted)',
      padding: 8, fontSize: 12, cursor: 'pointer', width: '100%',
    },
    upsellBox: {
      marginTop: 16, padding: 14, background: 'var(--surface2)',
      borderRadius: 10, border: '1px solid var(--border)',
    },
    historySection: { borderTop: '1px solid var(--border)', padding: '16px 24px', maxHeight: 220, overflowY: 'auto' as const },
    histItem: {
      background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px',
      cursor: 'pointer', border: '1px solid transparent', marginBottom: 6,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    map: { flex: 1, position: 'relative' as const },
    mapEl: { width: '100%', height: '100%' },
    mapLoader: {
      position: 'absolute' as const, inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', zIndex: 10, flexDirection: 'column' as const, gap: 16,
    },
    spinner: {
      width: 40, height: 40, border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    mapHint: {
      position: 'absolute' as const, bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      borderRadius: 10, padding: '10px 20px', border: '1px solid rgba(110,231,183,0.3)',
      color: 'var(--accent)', fontSize: 13, fontFamily: 'Syne, sans-serif', fontWeight: 600,
      pointerEvents: 'none' as const, whiteSpace: 'nowrap' as const,
    },
    finishBtn: {
      position: 'absolute' as const, bottom: 24, right: 24,
      background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#000',
      padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
      fontFamily: 'Syne, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    },
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.logo}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,10 26,24 2,24 2,10" fill="none" stroke="#6ee7b7" strokeWidth="1.5"/>
            <polygon points="14,6 22,12 22,22 6,22 6,12" fill="#6ee7b7" fillOpacity="0.15" stroke="#6ee7b7" strokeWidth="1"/>
          </svg>
          <span style={s.logoText}>
            dak<span style={{ color: 'var(--accent)' }}>oppervlakte</span>
          </span>
        </div>
        <div style={s.headerRight}>
          {usageCount !== null && (
            <span style={s.counter}>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                {usageCount.toLocaleString('nl-BE')}
              </span>{' '}berekeningen
            </span>
          )}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button style={s.btnOutline}>Aanmelden</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button style={s.btnAccent}>Registreren</button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />
          </Show>
        </div>
      </header>

      <div style={s.body}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <div style={s.sidebarTop}>
            <h1 style={s.h1}>
              Bereken uw<br />
              <span style={{ color: 'var(--accent)' }}>dakoppervlakte</span>
            </h1>
            <p style={s.subtitle}>
              Typ een adres, zoom in op het satellietbeeld en teken de dakcontouren.
            </p>
          </div>

          <div style={s.searchSection}>
            <label style={s.label}>Adres</label>
            <div style={s.inputRow}>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Meir 1, Antwerpen..."
                style={s.input}
              />
              <button
                onClick={handleSearch}
                disabled={searching || !address.trim()}
                style={{ ...s.searchBtn, opacity: (!address.trim() || searching) ? 0.5 : 1 }}
              >
                {searching ? '…' : '→'}
              </button>
            </div>
            {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{error}</p>}
          </div>

          <div style={s.content}>
            {mode === 'idle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                {[
                  ['1', 'Typ een Belgisch adres hierboven'],
                  ['2', 'Zoom in op het satellietbeeld'],
                  ['3', 'Klik de hoekpunten van het dak aan'],
                  ['4', 'Dubbelklik of klik op het eerste punt om te sluiten'],
                ].map(([n, t]) => (
                  <div key={n} style={s.stepItem}>
                    <span style={s.stepNum}>{n}</span>
                    <span style={{ paddingTop: 2 }}>{t}</span>
                  </div>
                ))}
              </div>
            )}

            {mode === 'drawing' && (
              <div style={s.drawingHint}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✏️</div>
                <p style={{ color: 'var(--accent)', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Tekenmode actief
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
                  {pointCount === 0 && 'Klik op de hoekpunten van het dak.'}
                  {pointCount === 1 && '1 punt geplaatst — ga verder...'}
                  {pointCount === 2 && '2 punten — nog minimaal 1 meer.'}
                  {pointCount >= 3 && `${pointCount} punten — dubbelklik of klik ✓ om te sluiten.`}
                </p>
                {pointCount >= 3 && (
                  <button
                    onClick={finishPolygon}
                    style={{
                      marginTop: 12, background: 'var(--accent)', border: 'none',
                      borderRadius: 7, color: '#000', padding: '8px 16px',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    ✓ Vorm sluiten
                  </button>
                )}
              </div>
            )}

            {mode === 'done' && area !== null && (
              <div>
                <div style={s.resultBox}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>
                    Dakoppervlakte
                  </p>
                  <p style={s.areaNum}>{area.toLocaleString('nl-BE')}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>m²</p>
                  {address && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>{address}</p>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {!saved ? (
                    <button onClick={handleSave} style={s.btnPrimary}>
                      {user ? '💾 Opslaan in geschiedenis' : '📊 Teller bijwerken'}
                    </button>
                  ) : (
                    <div style={{ ...s.btnPrimary, background: 'var(--surface2)', color: 'var(--accent)', border: '1px solid var(--accent)', textAlign: 'center' as const }}>
                      ✓ Opgeslagen
                    </div>
                  )}
                  <button onClick={() => startDrawingMode()} style={s.btnSecondary}>Opnieuw tekenen</button>
                  <button onClick={handleReset} style={s.btnGhost}>Nieuw adres</button>
                </div>

                <Show when="signed-out">
                  <div style={s.upsellBox}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                      📋 Maak een gratis account aan om uw zoekgeschiedenis bij te houden.
                    </p>
                    <SignUpButton mode="modal">
                      <button style={{
                        width: '100%', background: 'transparent',
                        border: '1px solid var(--accent)', color: 'var(--accent)',
                        borderRadius: 7, padding: '8px', fontSize: 12, cursor: 'pointer',
                        fontFamily: 'Syne, sans-serif', fontWeight: 600,
                      }}>Gratis registreren</button>
                    </SignUpButton>
                  </div>
                </Show>
              </div>
            )}
          </div>

          <Show when="signed-in">
            {history.length > 0 && (
              <div style={s.historySection}>
                <p style={{ ...s.label, marginBottom: 10 }}>Geschiedenis</p>
                {history.map((h, i) => (
                  <div
                    key={i}
                    style={s.histItem}
                    onClick={() => { setAddress(h.address); setArea(h.area_m2); setMode('done') }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                  >
                    <span style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>
                      {h.address}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'Syne, sans-serif', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                      {h.area_m2.toLocaleString('nl-BE')} m²
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Show>
        </aside>

        {/* Map */}
        <main style={s.map}>
          {!mapLoaded && (
            <div style={s.mapLoader}>
              <div style={s.spinner} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Kaart laden...</p>
            </div>
          )}
          <div ref={mapRef} style={s.mapEl} />

          {mode === 'drawing' && (
            <div style={s.mapHint}>
              {pointCount < 3
                ? `✏️ Klik hoekpunten aan (${pointCount} geplaatst)`
                : `✏️ ${pointCount} punten — dubbelklik om te sluiten`}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: var(--text-muted); }
        input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 2px rgba(110,231,183,0.15); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>
    </div>
  )
}
