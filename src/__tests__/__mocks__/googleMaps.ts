/**
 * Minimal Google Maps API stub for Vitest / jsdom.
 * Installed once globally via vitest.setup.ts — never mocked per-test.
 * Only stubs the surface area the app actually uses.
 */

const makeEventTarget = () => {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {}
  return {
    addListener: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      listeners[event] ??= []
      listeners[event].push(cb)
      return { remove: vi.fn() }
    }),
    _trigger: (event: string, ...args: unknown[]) => {
      ;(listeners[event] ?? []).forEach((cb) => cb(...args))
    },
  }
}

const makePath = () => {
  const points: google.maps.LatLng[] = []
  const et = makeEventTarget()
  return {
    ...et,
    push: (p: google.maps.LatLng) => points.push(p),
    forEach: (cb: (p: google.maps.LatLng, i: number) => void) => points.forEach(cb),
    getLength: () => points.length,
    getAt: (i: number) => points[i],
  }
}

export const MockPolygon = vi.fn().mockImplementation(function ({ fillColor }: { fillColor?: string } = {}) {
  const path = makePath()
  const stored: Record<string, unknown> = { fillColor }
  let currentMap: unknown = null
  return {
    setMap: vi.fn((m: unknown) => { currentMap = m }),
    getMap: vi.fn(() => currentMap),
    getPath: () => path,
    get: (key: string) => stored[key],
    set: (key: string, val: unknown) => {
      stored[key] = val
    },
  }
})

export const MockPolyline = vi.fn().mockImplementation(function () {
  return {
    setMap: vi.fn(),
    setPath: vi.fn(),
  }
})

export const MockMarker = vi.fn().mockImplementation(function () {
  const et = makeEventTarget()
  return { setMap: vi.fn(), addListener: et.addListener }
})

export const MockAdvancedMarkerElement = vi.fn().mockImplementation(function () {
  const et = makeEventTarget()
  return { map: null, addListener: et.addListener }
})

export const MockGeocoder = vi.fn().mockImplementation(function () {
  return {
    geocode: vi.fn(),
  }
})

export const MockMap = vi.fn().mockImplementation(function () {
  const et = makeEventTarget()
  return {
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    setOptions: vi.fn(),
    setHeading: vi.fn(),
    setTilt: vi.fn(),
    getHeading: vi.fn(() => 0),
    getTilt: vi.fn(() => 0),
    getZoom: vi.fn(() => 8),
    addListener: et.addListener,
    _trigger: et._trigger,
  }
})

;(globalThis as unknown as { google: unknown }).google = {
  maps: {
    Map: MockMap,
    Polygon: MockPolygon,
    Polyline: MockPolyline,
    Marker: MockMarker,
    marker: {
      AdvancedMarkerElement: MockAdvancedMarkerElement,
    },
    Geocoder: MockGeocoder,
    SymbolPath: { CIRCLE: 0 },
    event: {
      removeListener: vi.fn(),
    },
    geometry: {
      spherical: {
        computeArea: vi.fn(() => 100),
      },
    },
  },
}
