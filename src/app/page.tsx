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

  // Sync heading/tilt to map
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.setHeading(heading)
  }, [heading])

  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.setTilt(tilt)
  }, [tilt])

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

  const fetchBuildingPolygon = async (lat: number, lng: number) => {
    console.log('fetchBuildingPolygon called with:', lat, lng); // Log that the function is entered
    try {
      const res = await fetch(`/api/building-polygon?lat=${lat}&lng=${lng}`);
      console.log('fetchBuildingPolygon: fetch response status:', res.status); // Log fetch response status
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const feature = await res.json();
      console.log('fetchBuildingPolygon: received feature:', feature); // Log the fetched feature
      
      if (feature && feature.geometry) {
        const geometry = feature.geometry;
        let coords: any[] = [];
        
        if (geometry.type === 'MultiPolygon') {
          coords = geometry.coordinates[0][0];
        } else if (geometry.type === 'Polygon') {
          coords = geometry.coordinates[0];
        } else if (Array.isArray(geometry.coordinates)) {
          // Basisregisters return coordinates as an array
          coords = geometry.coordinates[0];
        }
        
        // Final robustness check: make sure we have an array of arrays [lng, lat]
        if (coords && Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
          return coords.map((c: number[]) => ({ lat: c[1], lng: c[0] }));
        }
        
        // If it's already an array of {lat, lng} (unlikely but just in case)
        if (coords && coords[0] && typeof coords[0].lat === 'number') {
          return coords;
        }
      }
      console.log('fetchBuildingPolygon: No valid coordinates found in feature.');
    } catch (e) { console.error('Proxy API error', e); return null; }
    console.log('fetchBuildingPolygon: Returning null.');
    return null;
  };

  const handleSearch = async () => {
    if (!address.trim() || !geocoderRef.current || !mapInstanceRef.current) return;
    setSearching(true);
    setError('');

    fetch('/api/counter', { method: 'POST' })
      .then(r => r.json())
      .then(d => setUsageCount(d.count))
      .catch(() => {});

    geocoderRef.current.geocode(
      { address: address + ', Belgium', region: 'BE' },
      async (results, status) => {
        if (status !== 'OK' || !results?.[0]) {
          setSearching(false);
          setError('Adres niet gevonden. Probeer een vollediger adres.');
          return;
        }
        
        const loc = results[0].geometry.location;
        mapInstanceRef.current!.setCenter(loc);
        mapInstanceRef.current!.setZoom(20);

        // Try to auto-fetch building polygon
        const buildingPath = await fetchBuildingPolygon(loc.lat(), loc.lng());
        console.log('handleSearch: buildingPath after fetch:', buildingPath); // Log the result
        setSearching(false);

        if (buildingPath) {
          // Add automatically
          const color = `hsl(${Math.floor(Math.random() * 280 + 40)}, 70%, 60%)`;
          const polygon = new google.maps.Polygon({
            paths: buildingPath,
            fillColor: color,
            fillOpacity: 0.25,
            strokeColor: color,
            strokeWeight: 2,
            editable: true,
            draggable: false,
            map: mapInstanceRef.current,
          });

          const areaSqM = google.maps.geometry.spherical.computeArea(polygon.getPath());
          const area = Math.round(areaSqM * 10) / 10;
          const id = crypto.randomUUID();
          const label = `Gebouw ${polygonsRef.current.length + 1}`;

          const entry: PolygonEntry = { id, label, area, polygon };
          polygonsRef.current = [...polygonsRef.current, entry];
          setPolygons([...polygonsRef.current]);
          setMode('idle');

          const update = () => {
            const pts: google.maps.LatLng[] = [];
            polygon.getPath().forEach(p => pts.push(p));
            const newArea = Math.round(google.maps.geometry.spherical.computeArea(pts) * 10) / 10;
            polygonsRef.current = polygonsRef.current.map(e => e.id === id ? { ...e, area: newArea } : e);
            setPolygons([...polygonsRef.current]);
          };
          polygon.getPath().addListener('set_at', update);
          polygon.getPath().addListener('insert_at', update);
        } else {
          // Fallback to manual drawing
          setTimeout(() => startDrawingMode(), 600);
        }
      }
    );
  };
