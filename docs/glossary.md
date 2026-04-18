# Glossary

Project-specific terms used across the Dakoppervlakte codebase and documentation.

## Belgian geodata

- **GRB** — *Grootschalig Referentiebestand.* The Flemish (Belgium) large-scale cadastral reference dataset maintained by Informatie Vlaanderen. It includes building footprints as polygons. Dakoppervlakte queries GRB first when auto-generating a polygon at a given lat/lng. Upstream endpoint: `https://geo.api.vlaanderen.be/GRB/wfs`, typeName `GRB:GBG`. See `src/app/api/building-polygon/route.ts`.
- **UrbIS** — Brussels' urban geographic information system, maintained by the Centre d'Informatique pour la Région Bruxelloise (CIRB). It covers the Brussels-Capital region where GRB does not. Used as the fallback building-polygon source when GRB returns no features. Upstream endpoint: `https://geoservices-urbis.irisnet.be/geoserver/UrbIS/wfs`, typeName `UrbIS:Bu`. See `src/app/api/building-polygon/route.ts`.
- **WFS** — *Web Feature Service.* An OGC (Open Geospatial Consortium) standard for serving GIS vector features over HTTP. Both GRB and UrbIS expose a WFS 2.0 endpoint that answers `GetFeature` requests with GeoJSON when `outputFormat=application/json` is passed. Dakoppervlakte issues bbox-filtered `GetFeature` calls from the server.

## Drawing and geometry

- **FSM** — *Finite State Machine.* Used in two places in the codebase:
  - Drawing mode: `idle` ↔ `drawing`. See `DrawingMode` in `src/lib/types.ts` and [drawing-mode-states.mermaid](drawing-mode-states.mermaid).
  - Per-polygon visibility: `Visible` ↔ `Hidden` driven by map orientation. See [polygon-visibility.mermaid](polygon-visibility.mermaid).
- **PolygonData** — The serialisable, persisted shape of a polygon: `{ id, label, area, path[], heading?, tilt? }`. Stored inside the `searches.polygons` JSONB column and passed over the wire to `/api/searches`. Defined in `src/domain/polygon/types.ts`.
- **PolygonEntry** — The runtime, in-memory enriched counterpart of `PolygonData`. Wraps it with a live `google.maps.Polygon`, an `EdgeLabelsController`, and the `excluded` flag that controls whether the polygon contributes to the total area. Defined in `src/lib/types.ts`. Never persisted directly.
- **headingsMatch** — Pure predicate in `src/domain/orientation/heading.ts`. Returns `true` when two headings point in the same compass direction after both are normalised into `[0, 360)`. Used by the visibility effect in `usePolygonDrawing` to decide whether a polygon's captured heading matches the current map heading. Paired with an exact `polygon.tilt === currentTilt` check; together they determine whether the polygon is attached to the map.
- **normalizeHeading** — Wraps a heading value into `[0, 360)` via `((degrees % 360) + 360) % 360`. Used anywhere a heading comes in from user input or from Google Maps (which can return fractional or negative values).
- **Edge labels** — The distance labels rendered on each edge of a polygon (e.g. "8.4 m"). Managed by an `EdgeLabelsController` (`src/lib/infrastructure/edgeLabels.ts`) whose `update(path, closed)` method takes a `closed` flag distinguishing a complete polygon from an open drawing-preview polyline.

## API conventions

- **`debug` field** — All API JSON error responses include an optional `debug` string (or object) field so the failure point is visible without reading server logs. Examples in [error-responses.example.json](error-responses.example.json). The convention is strongly encouraged for every new error path — see CLAUDE.md's "API rules".
- **Public vs protected routes** — `/api/counter`, `/api/autogen-counter`, `/api/building-polygon`, and `/api/init` are **public**. `/api/searches` (all methods) is **Clerk-protected**. See [ADR-0004](adr/0004-public-vs-protected-api-routes.md).
- **upsert-by-(userId, address)** — The `searches` table has a `UNIQUE(user_id, address)` constraint, and `POST /api/searches` runs `INSERT ... ON CONFLICT (user_id, address) DO UPDATE`. Saving the same address twice updates the existing row rather than creating a duplicate. See [ADR-0002](adr/0002-upsert-by-user-and-address.md).

## Infrastructure

- **Neon** — Managed serverless PostgreSQL. Accessed via `@neondatabase/serverless`. Every API invocation opens a fresh HTTPS connection; there is no pooling. Connection string lives in `DATABASE_URL`. See `src/lib/db.ts`.
- **Clerk** — The authentication provider. Handles sign-in / sign-up UI, session cookies, and exposes `auth()` server-side for route handlers. Middleware wrapper lives in `src/proxy.ts`. See [auth-flow.mermaid](auth-flow.mermaid).
- **proxy.ts** — The middleware file at `src/proxy.ts` (so named instead of the conventional `middleware.ts`) that composes Clerk auth with `next-intl` locale routing. API requests bypass locale routing.
