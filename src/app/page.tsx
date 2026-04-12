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
type PolygonEntry = {
  id: string
  label: string
  area: number
  polygon: google.maps.Polygon
}

export default function Home() {
  const { user } = useUser()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const dblClickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const tempMarkersRef = useRef<google.maps.Marker[]>([])
  const tempPathRef = useRef<google.maps.LatLng[]>([])
  const previewPolyRef = useRef<google.maps.Polyline | null>(null)
  const polygonsRef = useRef<PolygonEntry[]>([])

  const [address, setAddress] = useState('')
  const [usageCount, setUsageCount] = useState<number | null>(null)
  const [history, setHistory] = useState<Search[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searching, setSearching] = useState(false)
  const [mode, setMode] = useState<'idle' | 'drawing'>('idle')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pointCount, setPointCount] = useState(0)
  const [polygons, setPolygons] = useState<PolygonEntry[]>([])
  const [heading, setHeading] = useState(0)
  const [tilt, setTilt] = useState(0)
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [pendingLabel, setPendingLabel] = useState('')

  const totalArea = polygons.reduce((sum, p) => sum + p.area, 0)

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.google?.maps) { setMapLoaded(true); return }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry&loading=async&callback=initMap`
    script.async = true
    script.defer = true
    window.initMap = () => setMapLoaded(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 51.1, lng: 4.4 },
      zoom: 8,
      mapTypeId: 'satellite',
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      tilt: 0,
      heading: 0,
    })
    mapInstanceRef.current = map
    geocoderRef.current = new google.maps.Geocoder()
  }, [mapLoaded])

  // Listen to map heading/tilt changes (drag-rotate etc) and sync to React state
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    const hListener = map.addListener('heading_changed', () => {
      setHeading(Math.round(map.getHeading() ?? 0))
    })
    const tListener = map.addListener('tilt_changed', () => {
      setTilt(map.getTilt() ?? 0)
    })
    return () => { hListener.remove(); tListener.remove() }
  }, [mapLoaded])

  const clearDrawingState = useCallback(() => {
    tempMarkersRef.current.forEach(m => m.setMap(null))
    tempMarkersRef.current = []
    tempPathRef.current = []
    if (previewPolyRef.current) { previewPolyRef.current.setMap(null); previewPolyRef.current = null }
    if (clickListenerRef.current) { clickListenerRef.current.remove(); clickListenerRef.current = null }
    if (dblClickListenerRef.current) { dblClickListenerRef.current.remove(); dblClickListenerRef.current = null }
    if (mapInstanceRef.current) mapInstanceRef.current.setOptions({ draggableCursor: '' })
    setPointCount(0)
  }, [])

  const finishPolygon = useCallback(() => {
    const path = tempPathRef.current
    if (path.length < 3) return
    clearDrawingState()

    const color = `hsl(${Math.floor(Math.random() * 280 + 40)}, 70%, 60%)`
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
    setPolygons([...polygonsRef.current])
    setMode('idle')

    const update = () => {
      const pts: google.maps.LatLng[] = []
      polygon.getPath().forEach(p => pts.push(p))
      const newArea = Math.round(google.maps.geometry.spherical.computeArea(pts) * 10) / 10
      polygonsRef.current = polygonsRef.current.map(e => e.id === id ? { ...e, area: newArea } : e)
      setPolygons([...polygonsRef.current])
    }
    polygon.getPath().addListener('set_at', update)
    polygon.getPath().addListener('insert_at', update)
  }, [clearDrawingState])

  const startDrawingMode = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return
    clearDrawingState()
    setMode('drawing')
    setSaved(false)
    setPointCount(0)
    map.setOptions({ draggableCursor: 'crosshair' })

    const previewLine = new google.maps.Polyline({
      strokeColor: '#6ee7b7', strokeWeight: 1.5, strokeOpacity: 0.6, map,
    })
    previewPolyRef.current = previewLine

    clickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      const pt = e.latLng
      tempPathRef.current.push(pt)
      setPointCount(tempPathRef.current.length)

      const marker = new google.maps.Marker({
        position: pt, map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5, fillColor: '#6ee7b7', fillOpacity: 1,
          strokeColor: '#fff', strokeWeight: 1.5,
        },
        clickable: true,
      })

      if (tempPathRef.current.length === 1) {
        marker.addListener('click', () => {
          if (tempPathRef.current.length >= 3) finishPolygon()
        })
      }
      tempMarkersRef.current.push(marker)
      previewLine.setPath(tempPathRef.current)
    })

    dblClickListenerRef.current = map.addListener('dblclick', (e: google.maps.MapMouseEvent) => {
      e.stop?.()
      if (tempPathRef.current.length >= 3) finishPolygon()
    })
  }, [clearDrawingState, finishPolygon])

  const deletePolygon = useCallback((id: string) => {
    const entry = polygonsRef.current.find(e => e.id === id)
    if (entry) entry.polygon.setMap(null)
    polygonsRef.current = polygonsRef.current.filter(e => e.id !== id)
    setPolygons([...polygonsRef.current])
  }, [])

  const fetchBuildingPolygon = async (lat: number, lng: number) => {
    // 1. Try Flanders (GRB)
    try {
      const flandersUrl = `https://geoservices.informatievlaanderen.be/overdrachter/grb/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=grb:GBG&outputFormat=application/json&srsName=EPSG:4326&cql_filter=INTERSECTS(SHAPE,POINT(${lng} ${lat}))`
      const res = await fetch(flandersUrl)
      const data = await res.json()
      if (data.features && data.features.length > 0) {
        return data.features[0].geometry.coordinates[0][0].map((c: number[]) => ({ lat: c[1], lng: c[0] }))
      }
    } catch (e) { console.error('Flanders API error', e) }

    // 2. Try Brussels (UrbIS)
    try {
      const brusselsUrl = `https://geoserver.gis.irisnet.be/irisnet/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=urbis:BU&outputFormat=application/json&srsName=EPSG:4326&cql_filter=INTERSECTS(SHAPE,POINT(${lng} ${lat}))`
      const res = await fetch(brusselsUrl)
      const data = await res.json()
      if (data.features && data.features.length > 0) {
        return data.features[0].geometry.coordinates[0][0].map((c: number[]) => ({ lat: c[1], lng: c[0] }))
      }
    } catch (e) { console.error('Brussels API error', e) }

    return null
  }

  const handleSearch = async () => {
    if (!address.trim() || !geocoderRef.current || !mapInstanceRef.current) return
    setSearching(true)
    setError('')

    fetch('/api/counter', { method: 'POST' })
      .then(r => r.json())
      .then(d => setUsageCount(d.count))
      .catch(() => {})

    geocoderRef.current.geocode(
      { address: address + ', Belgium', region: 'BE' },
      async (results, status) => {
        if (status !== 'OK' || !results?.[0]) {
          setSearching(false)
          setError('Adres niet gevonden. Probeer een vollediger adres.')
          return
        }
        
        const loc = results[0].geometry.location
        mapInstanceRef.current!.setCenter(loc)
        mapInstanceRef.current!.setZoom(20)

        // Try to auto-fetch building polygon
        const buildingPath = await fetchBuildingPolygon(loc.lat(), loc.lng())
        setSearching(false)

        if (buildingPath) {
          // Add automatically
          const color = `hsl(${Math.floor(Math.random() * 280 + 40)}, 70%, 60%)`
          const polygon = new google.maps.Polygon({
            paths: buildingPath,
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
          const label = `Gebouw ${polygonsRef.current.length + 1}`

          const entry: PolygonEntry = { id, label, area, polygon }
          polygonsRef.current = [...polygonsRef.current, entry]
          setPolygons([...polygonsRef.current])
          setMode('idle')

          const update = () => {
            const pts: google.maps.LatLng[] = []
            polygon.getPath().forEach(p => pts.push(p))
            const newArea = Math.round(google.maps.geometry.spherical.computeArea(pts) * 10) / 10
            polygonsRef.current = polygonsRef.current.map(e => e.id === id ? { ...e, area: newArea } : e)
            setPolygons([...polygonsRef.current])
          }
          polygon.getPath().addListener('set_at', update)
          polygon.getPath().addListener('insert_at', update)
        } else {
          // Fallback to manual drawing
          setTimeout(() => startDrawingMode(), 600)
        }
      }
    )
  }

  const handleSave = async () => {
    setSaved(true)
    if (user && address && totalArea > 0) {
      await fetch('/api/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, area_m2: Math.round(totalArea * 10) / 10 }),
      })
      const hist = await fetch('/api/searches').then(r => r.json())
      if (Array.isArray(hist)) setHistory(hist)
    }
  }

  const handleReset = () => {
    clearDrawingState()
    polygonsRef.current.forEach(e => e.polygon.setMap(null))
    polygonsRef.current = []
    setPolygons([])
    setMode('idle')
    setAddress('')
    setError('')
    setSaved(false)
  }

  const applyHeading = (next: number) => {
    const map = mapInstanceRef.current
    if (!map) return
    map.setHeading(next)
    setHeading(Math.round(next))
    // Force overlay repaint so polygons stay aligned after rotation
    setTimeout(() => google.maps.event.trigger(map, 'resize'), 50)
  }

  const rotate = (delta: number) => {
    const map = mapInstanceRef.current
    if (!map) return
    const current = map.getHeading() ?? 0
    applyHeading((current + delta + 360) % 360)
  }

  const toggleTilt = () => {
    const map = mapInstanceRef.current
    if (!map) return
    const next = (map.getTilt() ?? 0) === 0 ? 45 : 0
    map.setTilt(next)
    setTilt(next)
    setTimeout(() => google.maps.event.trigger(map, 'resize'), 50)
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' },
    header: {
      borderBottom: '1px solid var(--border)', padding: '0 24px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100,
    },
    logoText: { fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text)' },
    headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
    btnOutline: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer' },
    btnAccent: { background: 'var(--accent)', border: 'none', color: '#000', padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
    body: { display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 60px)' },
    sidebar: { width: 360, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 },
    sidebarTop: { padding: '24px 24px 16px', borderBottom: '1px solid var(--border)' },
    h1: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 6, color: 'var(--text)' },
    label: { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' as const, display: 'block', marginBottom: 8, fontFamily: 'Syne, sans-serif' },
    input: { flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '10px 14px', fontSize: 14, outline: 'none' },
    searchBtn: { background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#000', padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: 'Syne, sans-serif' },
    content: { padding: '16px 24px', flex: 1, overflowY: 'auto' as const },
    map: { flex: 1, position: 'relative' as const },
    mapLoader: { position: 'absolute' as const, inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', zIndex: 10, flexDirection: 'column' as const, gap: 16 },
    spinner: { width: 40, height: 40, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,10 26,24 2,24 2,10" fill="none" stroke="#6ee7b7" strokeWidth="1.5"/>
            <polygon points="14,6 22,12 22,22 6,22 6,12" fill="#6ee7b7" fillOpacity="0.15" stroke="#6ee7b7" strokeWidth="1"/>
          </svg>
          <span style={s.logoText}>dak<span style={{ color: 'var(--accent)' }}>oppervlakte</span></span>
        </div>
        <div style={s.headerRight}>
          {usageCount !== null && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{usageCount.toLocaleString('nl-BE')}</span> berekeningen
            </span>
          )}
          <Show when="signed-out">
            <SignInButton mode="modal"><button style={s.btnOutline}>Aanmelden</button></SignInButton>
            <SignUpButton mode="modal"><button style={s.btnAccent}>Registreren</button></SignUpButton>
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
            <h1 style={s.h1}>Bereken uw<br /><span style={{ color: 'var(--accent)' }}>dakoppervlakte</span></h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Typ een adres en teken de dakcontouren.</p>
          </div>

          {/* Search */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <label style={s.label}>Adres</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Meir 1, Antwerpen..." style={s.input} />
              <button onClick={handleSearch} disabled={searching || !address.trim()}
                style={{ ...s.searchBtn, opacity: (!address.trim() || searching) ? 0.5 : 1 }}>
                {searching ? '…' : '→'}
              </button>
            </div>
            {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{error}</p>}
          </div>

          {/* Rotation controls */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <label style={s.label}>Kaarthoek & perspectief</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <button onClick={() => rotate(-15)} title="Roteer links" style={{
                background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7,
                color: 'var(--text)', width: 36, height: 36, fontSize: 16, cursor: 'pointer', flexShrink: 0,
              }}>↺</button>
              <div style={{ flex: 1 }}>
                <input type="range" min="0" max="360" value={heading}
                  onChange={e => applyHeading(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  <span>N</span><span>{heading}°</span><span>N</span>
                </div>
              </div>
              <button onClick={() => rotate(15)} title="Roteer rechts" style={{
                background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7,
                color: 'var(--text)', width: 36, height: 36, fontSize: 16, cursor: 'pointer', flexShrink: 0,
              }}>↻</button>
            </div>
            <button onClick={toggleTilt} style={{
              width: '100%', background: tilt === 45 ? 'rgba(110,231,183,0.15)' : 'var(--surface2)',
              border: `1px solid ${tilt === 45 ? 'rgba(110,231,183,0.5)' : 'var(--border)'}`,
              borderRadius: 7, color: tilt === 45 ? 'var(--accent)' : 'var(--text-muted)',
              padding: '8px', fontSize: 12, cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 600,
            }}>
              {tilt === 45 ? '🏔 Perspectief aan (45°)' : '🗺 Perspectief uit (bovenaanzicht)'}
            </button>
          </div>

          {/* Main content area */}
          <div style={s.content}>

            {/* Draw button */}
            {mode === 'idle' && (
              <button onClick={startDrawingMode} style={{
                width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 8,
                color: '#000', padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Syne, sans-serif', marginBottom: 16,
              }}>
                ✏️ {polygons.length === 0 ? 'Begin met tekenen' : 'Nog een vlak toevoegen'}
              </button>
            )}

            {/* Drawing hint */}
            {mode === 'drawing' && (
              <div style={{ background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.3)', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'center' as const }}>
                <p style={{ color: 'var(--accent)', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  ✏️ Tekenmode actief
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, marginBottom: pointCount >= 3 ? 10 : 0 }}>
                  {pointCount === 0 && 'Klik hoekpunten op de kaart.'}
                  {pointCount === 1 && '1 punt — ga verder...'}
                  {pointCount === 2 && '2 punten — nog 1 meer.'}
                  {pointCount >= 3 && `${pointCount} punten — dubbelklik of klik hieronder.`}
                </p>
                {pointCount >= 3 && (
                  <button onClick={finishPolygon} style={{
                    background: 'var(--accent)', border: 'none', borderRadius: 7, color: '#000',
                    padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                  }}>✓ Vorm sluiten</button>
                )}
              </div>
            )}

            {/* Polygon list */}
            {polygons.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Vlakken</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {polygons.map((p) => (
                    <div key={p.id} style={{
                      background: 'var(--surface2)', borderRadius: 9, padding: '10px 12px',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Color dot */}
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          background: (p.polygon.get('fillColor') as string) || 'var(--accent)',
                        }} />

                        {/* Label — editable */}
                        {editingLabelId === p.id ? (
                          <input
                            autoFocus
                            value={pendingLabel}
                            onChange={e => setPendingLabel(e.target.value)}
                            onBlur={() => {
                              if (pendingLabel.trim()) {
                                polygonsRef.current = polygonsRef.current.map(e => e.id === p.id ? { ...e, label: pendingLabel.trim() } : e)
                                setPolygons([...polygonsRef.current])
                              }
                              setEditingLabelId(null)
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                            style={{
                              flex: 1, background: 'var(--bg)', border: '1px solid var(--accent)',
                              borderRadius: 5, color: 'var(--text)', padding: '2px 8px', fontSize: 13, outline: 'none',
                            }}
                          />
                        ) : (
                          <span
                            onClick={() => { setEditingLabelId(p.id); setPendingLabel(p.label) }}
                            title="Klik om naam te wijzigen"
                            style={{ flex: 1, fontSize: 13, color: 'var(--text)', cursor: 'text' }}
                          >
                            {p.label}
                          </span>
                        )}

                        <span style={{ fontSize: 13, color: 'var(--accent)', fontFamily: 'Syne, sans-serif', fontWeight: 600, flexShrink: 0 }}>
                          {p.area.toLocaleString('nl-BE')} m²
                        </span>
                        <button onClick={() => deletePolygon(p.id)} title="Verwijderen" style={{
                          background: 'none', border: 'none', color: 'var(--text-muted)',
                          cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px', flexShrink: 0,
                        }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            {polygons.length > 0 && (
              <div style={{ background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 16, textAlign: 'center' as const }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>
                  {polygons.length > 1 ? `Totaal (${polygons.length} vlakken)` : 'Totale oppervlakte'}
                </p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 44, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {Math.round(totalArea * 10) / 10 < 1000
                    ? (Math.round(totalArea * 10) / 10).toLocaleString('nl-BE')
                    : Math.round(totalArea).toLocaleString('nl-BE')}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>m²</p>
              </div>
            )}

            {/* Save / reset */}
            {polygons.length > 0 && mode === 'idle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {user ? (
                  !saved ? (
                    <button onClick={handleSave} style={{
                      background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#000',
                      padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif', width: '100%',
                    }}>
                      💾 Opslaan in geschiedenis
                    </button>
                  ) : (
                    <div style={{ background: 'var(--surface2)', border: '1px solid var(--accent)', borderRadius: 8, color: 'var(--accent)', padding: 11, fontSize: 13, textAlign: 'center' as const, fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
                      ✓ Opgeslagen in geschiedenis
                    </div>
                  )
                ) : null}
                <button onClick={handleReset} style={{
                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                  padding: 8, fontSize: 12, cursor: 'pointer', width: '100%',
                }}>Alles wissen</button>
              </div>
            )}

            {/* Sign up upsell */}
            {polygons.length > 0 && (
              <Show when="signed-out">
                <div style={{ marginTop: 12, padding: 14, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                    📋 Maak een gratis account aan om uw zoekgeschiedenis bij te houden.
                  </p>
                  <SignUpButton mode="modal">
                    <button style={{ width: '100%', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 7, padding: '8px', fontSize: 12, cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
                      Gratis registreren
                    </button>
                  </SignUpButton>
                </div>
              </Show>
            )}

            {/* Idle empty state */}
            {polygons.length === 0 && mode === 'idle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                {[
                  ['1', 'Typ een adres en klik →'],
                  ['2', 'Roteer de kaart voor een beter zicht'],
                  ['3', 'Klik "Begin met tekenen" en klik hoekpunten'],
                  ['4', 'Voeg meerdere vlakken toe voor een totaal'],
                ].map(([n, t]) => (
                  <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0, fontFamily: 'Syne, sans-serif' }}>{n}</span>
                    <span style={{ paddingTop: 2 }}>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <Show when="signed-in">
            {history.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '14px 24px', maxHeight: 200, overflowY: 'auto' as const }}>
                <p style={{ ...s.label, marginBottom: 8 }}>Geschiedenis</p>
                {history.map((h, i) => (
                  <div key={i} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', border: '1px solid transparent', marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                    <span style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>{h.address}</span>
                    <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'Syne, sans-serif', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{h.area_m2.toLocaleString('nl-BE')} m²</span>
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
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* Map overlay controls */}
          {mapLoaded && (
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => rotate(-45)} title="Roteer links" style={{
                background: 'rgba(17,17,24,0.9)', backdropFilter: 'blur(8px)',
                border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)',
                width: 40, height: 40, fontSize: 18, cursor: 'pointer',
              }}>↺</button>
              <button onClick={() => applyHeading(0)} title="Reset rotatie" style={{
                background: 'rgba(17,17,24,0.9)', backdropFilter: 'blur(8px)',
                border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)',
                width: 40, height: 40, fontSize: 11, cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700,
              }}>N</button>
              <button onClick={() => rotate(45)} title="Roteer rechts" style={{
                background: 'rgba(17,17,24,0.9)', backdropFilter: 'blur(8px)',
                border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)',
                width: 40, height: 40, fontSize: 18, cursor: 'pointer',
              }}>↻</button>
              <button onClick={toggleTilt} title="Toggle perspectief" style={{
                background: tilt === 45 ? 'rgba(110,231,183,0.2)' : 'rgba(17,17,24,0.9)',
                backdropFilter: 'blur(8px)', border: `1px solid ${tilt === 45 ? 'rgba(110,231,183,0.5)' : 'var(--border)'}`,
                borderRadius: 8, color: tilt === 45 ? 'var(--accent)' : 'var(--text-muted)',
                width: 40, height: 40, fontSize: 14, cursor: 'pointer',
              }}>3D</button>
            </div>
          )}

          {/* Drawing hint overlay */}
          {mode === 'drawing' && (
            <div style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
              borderRadius: 10, padding: '10px 20px', border: '1px solid rgba(110,231,183,0.3)',
              color: 'var(--accent)', fontSize: 13, fontFamily: 'Syne, sans-serif', fontWeight: 600,
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              {pointCount < 3 ? `✏️ Klik hoekpunten aan (${pointCount} geplaatst)` : `✏️ ${pointCount} punten — dubbelklik om te sluiten`}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="text"]::placeholder { color: var(--text-muted); }
        input[type="text"]:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 2px rgba(110,231,183,0.15); }
        input[type="range"] { cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>
    </div>
  )
}
