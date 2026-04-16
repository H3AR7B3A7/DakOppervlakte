# Auto-Generate Building Polygon from Belgian Registers

## Overview

Add a checkbox under the address search that, when enabled, automatically fetches the building footprint polygon from Belgian government WFS services and adds it to the map as a drawn polygon — saving the user from manual tracing.

## User Flow

1. User checks "Auto-generate roof selection" checkbox (below the address input)
2. User types an address and searches
3. Geocoding happens as normal (Google Geocoder, region: BE)
4. After geocoding succeeds, the app calls `/api/building-polygon?lat=...&lng=...`
5. The API returns a GeoJSON polygon of the building footprint
6. The polygon is added to the map as if the user drew it (same color, editable, area calculated)
7. User can still draw additional polygons manually, edit the auto-generated one, or delete it
8. If no building is found, show a brief non-blocking message and let the user draw manually

## API: `/api/building-polygon` (rewrite existing route)

### Data Sources

| Region | Service | Endpoint | Layer |
|--------|---------|----------|-------|
| Flanders | GRB WFS | `https://geo.api.vlaanderen.be/GRB/wfs` | `GRB:GBG` |
| Brussels | UrbIS WFS | `https://geoservices-urbis.irisnet.be/geoserver/UrbIS/wfs` | `UrbIS:Bu` |

Both are free, public OGC WFS services. No API key needed.

### Query Strategy

1. Build a bounding box around the geocoded point: +/- 0.0005 degrees (~55m)
2. Query GRB WFS with that bbox, requesting GeoJSON in EPSG:4326
3. If no features returned, query UrbIS WFS with the same bbox
4. From the returned FeatureCollection, pick the building whose polygon is closest to the geocoded point:
   - First, check if the point falls inside any polygon (exact match)
   - If no exact match, find the polygon whose centroid is nearest to the point (diamond/tolerance match)
5. Return the winning polygon as a GeoJSON Feature

### Example WFS Request

```
https://geo.api.vlaanderen.be/GRB/wfs
  ?service=WFS
  &version=2.0.0
  &request=GetFeature
  &typeName=GRB:GBG
  &outputFormat=application/json
  &srsName=EPSG:4326
  &bbox=51.049,3.719,51.051,3.721,EPSG:4326
```

### Response Format (unchanged from current)

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[lng, lat], ...]]
  }
}
```

If no building found:
```json
{
  "features": [],
  "debug": { "lat": "...", "lng": "...", "msg": "No building found" }
}
```

## Frontend Changes

### AddressSearch Component

Add a checkbox prop below the input:

```
[  Type an address...  ] [->]
[x] Auto-generate roof selection
```

- Checkbox state lives in `DakoppervlakteApp` (simple `useState<boolean>(false)`)
- Passed to `AddressSearch` as `autoGenerate` + `onAutoGenerateChange` props
- Persisted for the session only (no localStorage needed)

### DakoppervlakteApp Orchestration

Modify `handleSearch` flow:

```
geocodeAndNavigate(address, () => {
  if (autoGenerate) {
    fetchBuildingPolygon(lat, lng)
      .then(polygon => addAutoPolygon(polygon))
      .catch(() => showBriefError())
      .finally(() => {
        // Don't auto-start drawing if polygon was added
        // But if it failed, start drawing as fallback
      })
  } else {
    setTimeout(() => startDrawing(), 600)  // existing behavior
  }
})
```

### Adding the Auto-Generated Polygon

Reuse the existing polygon infrastructure from `usePolygonDrawing`:

1. Convert GeoJSON coordinates `[lng, lat]` to Google Maps `{lat, lng}` path
2. Create a `google.maps.Polygon` with the same styling as manually drawn polygons
3. Calculate area via `google.maps.geometry.spherical.computeArea()`
4. Add to the polygon list with label "Auto" (user can rename)
5. Make it editable (user can adjust vertices)

This requires exposing a new function from `usePolygonDrawing`: `addPolygonFromPath(path: {lat: number, lng: number}[])` — which does steps 2-5, same as `finishPolygon` but with an externally provided path instead of click-collected points.

### Error Handling

- Network error or no building found: show a brief message under the checkbox (e.g., "No building found — draw manually") that auto-clears after 5 seconds, and fall back to starting manual drawing mode
- Multiple buildings returned: pick the closest one (the API does this server-side)

## Building Detection: Handling Coordinate Mismatch

The geocoded point (from Google) may not fall exactly inside the building polygon (from GRB/UrbIS) due to:
- Different data sources with slightly different reference points
- The geocoded point landing on the street or property centroid rather than the building

### Matching Algorithm (server-side)

1. **Point-in-polygon**: For each returned feature, check if the geocoded point is inside the polygon. Use a ray-casting algorithm on the GeoJSON coordinates.
2. **If no match, nearest-centroid**: Calculate the centroid of each polygon, find the one nearest to the geocoded point. Accept if distance < 50m.
3. **If still no match**: Return empty (no building found).

This replaces the "diamond shape" idea from the roadmap with a more robust two-step approach that achieves the same tolerance goal.

## Translations

Add to `nl.json`, `en.json`, `fr.json`:

| Key | NL | EN | FR |
|-----|----|----|-----|
| `autoGenerate` | `Automatisch dakoppervlak genereren` | `Auto-generate roof selection` | `Générer automatiquement la sélection du toit` |
| `noBuildingFound` | `Geen gebouw gevonden — teken handmatig` | `No building found — draw manually` | `Aucun bâtiment trouvé — dessinez manuellement` |

## Files to Change

| File | Change |
|------|--------|
| `src/app/api/building-polygon/route.ts` | Rewrite: GRB + UrbIS WFS, point-in-polygon matching |
| `src/components/DakoppervlakteApp.tsx` | Add `autoGenerate` state, modify `handleSearch` flow |
| `src/components/sidebar/AddressSearch.tsx` | Add checkbox below input |
| `src/hooks/usePolygonDrawing.ts` | Add `addPolygonFromPath()` function |
| `src/lib/types.ts` | No changes needed (existing types suffice) |
| `messages/nl.json`, `en.json`, `fr.json` | Add translation keys |

## Testing

- **API route test**: Mock `fetch` to return WFS GeoJSON, verify correct polygon selection and point-in-polygon matching
- **Integration test**: Verify that checking the box + searching an address results in a polygon being added to the list
- **Edge cases**: No building found, multiple buildings returned, network error, checkbox unchecked (existing behavior preserved)

## Out of Scope

- Wallonia support (can be added later with the PICC WFS endpoint, same pattern)
- Caching WFS responses
- Showing multiple building options for the user to pick from
