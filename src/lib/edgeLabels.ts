import { formatDistance } from './utils'

export interface EdgeLabelsController {
  /**
   * Recomputes labels for the given path. Pass `closed: true` for a polygon
   * (adds the edge from the last vertex back to the first), or `false` for
   * an open polyline such as the drawing preview.
   */
  update(path: google.maps.LatLng[], closed: boolean): void
  /** Show/hide the labels by attaching/detaching them from a map. */
  setMap(map: google.maps.Map | null): void
  /** Remove all labels from the map and drop them. */
  clear(): void
}

const LABEL_STYLE =
  'background:rgba(17,17,17,0.82);color:#fff;padding:2px 6px;border-radius:9999px;' +
  'font:600 11px/1 system-ui,-apple-system,sans-serif;white-space:nowrap;' +
  'pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,0.25)'

function makeLabelElement(text: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = LABEL_STYLE
  el.textContent = text
  return el
}

export function createEdgeLabels(map: google.maps.Map, locale: string): EdgeLabelsController {
  let markers: google.maps.marker.AdvancedMarkerElement[] = []
  let attached: google.maps.Map | null = map

  const detachAll = () => {
    for (const marker of markers) marker.map = null
  }

  const update: EdgeLabelsController['update'] = (path, closed) => {
    detachAll()
    markers = []
    if (path.length < 2) return

    const edgeCount = closed ? path.length : path.length - 1
    for (let i = 0; i < edgeCount; i++) {
      const a = path[i]
      const b = path[(i + 1) % path.length]
      const distance = google.maps.geometry.spherical.computeDistanceBetween(a, b)
      // Skip degenerate edges (duplicate vertices). Anything below 0.05 m would
      // format to "0 m" and clutter the map with a meaningless label.
      if (distance < 0.05) continue
      const position = {
        lat: (a.lat() + b.lat()) / 2,
        lng: (a.lng() + b.lng()) / 2,
      }
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: attached,
        position,
        content: makeLabelElement(formatDistance(distance, locale)),
      })
      markers.push(marker)
    }
  }

  const setMap: EdgeLabelsController['setMap'] = (next) => {
    attached = next
    for (const marker of markers) marker.map = next
  }

  const clear: EdgeLabelsController['clear'] = () => {
    detachAll()
    markers = []
  }

  return { update, setMap, clear }
}
