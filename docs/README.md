# Dakoppervlakte Documentation

Interactive web application for calculating roof surface areas using Google Maps. Users search an address, draw polygons on the satellite view, and get area calculations in square meters.

## Architecture

- [Architecture Overview](architecture.md) -- component layers, data flow, external integrations

## Flow Diagrams

| Flow | Diagram | Description |
|------|---------|-------------|
| Address Search | [address-search.mermaid](address-search.mermaid) | User searches address, map navigates to location |
| Polygon Drawing | [polygon-drawing.mermaid](polygon-drawing.mermaid) | User draws polygon on map, area is calculated |
| Save Calculation | [save-calculation.mermaid](save-calculation.mermaid) | Authenticated user saves calculation to history |
| Restore Search | [restore-search.mermaid](restore-search.mermaid) | User restores a previously saved search |
| Building Detection | [building-detection.mermaid](building-detection.mermaid) | API detects building geometry from coordinates |

## State Diagrams

| Entity | Diagram | Description |
|--------|---------|-------------|
| Drawing Mode | [drawing-mode-states.mermaid](drawing-mode-states.mermaid) | FSM for the polygon drawing lifecycle |

## Example Payloads

| Payload | File | Description |
|---------|------|-------------|
| Search POST | [search-upsert.example.json](search-upsert.example.json) | Request body for saving a calculation |
| Search GET | [search-response.example.json](search-response.example.json) | Response from fetching user search history |
| Building Polygon | [building-polygon-response.example.json](building-polygon-response.example.json) | Response from building detection API |
| Error Responses | [error-responses.example.json](error-responses.example.json) | Error response shapes for all API endpoints |

## API Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/counter` | Public | Get global calculation count |
| POST | `/api/counter` | Public | Increment global calculation count |
| GET | `/api/searches` | Protected (Clerk) | Fetch user's saved searches |
| POST | `/api/searches` | Protected (Clerk) | Save or update a calculation |
| DELETE | `/api/searches?id=<id>` | Protected (Clerk) | Delete a saved search |
| GET | `/api/building-polygon?lat=&lng=` | Public | Detect building geometry at coordinates |
| GET | `/api/init` | Public | Initialize database tables |

## Environment Variables

| Variable | Required | Description | Where to obtain | Example value |
|----------|----------|-------------|-----------------|---------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key, used client-side for authentication UI components | [Clerk Dashboard](https://dashboard.clerk.com) | `pk_live_...` |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key, used server-side by Clerk middleware and `auth()` calls | [Clerk Dashboard](https://dashboard.clerk.com) | `sk_live_...` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Yes | Google Maps JavaScript API key, used client-side to load the Maps SDK | [Google Cloud Console](https://console.cloud.google.com) | `AIza...` |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string, used server-side by API routes via `@neondatabase/serverless` | Auto-injected by Vercel Neon integration, or from [Neon Console](https://console.neon.tech) | `postgresql://...` |

## API Response Examples

### GET `/api/counter`

Returns the current global calculation count. Falls back to `0` if the table does not exist yet.

```json
{ "count": 42 }
```

### POST `/api/counter`

Increments the global calculation count by one and returns the new value.

```json
{ "count": 43 }
```

### DELETE `/api/searches?id=42`

Deletes a saved search by ID. Requires Clerk authentication.

```json
{ "ok": true }
```

### GET `/api/init`

Initializes the database tables (`searches`, `usage_counter`) and seeds the counter row.

```json
{ "status": "\u2705 Database tables created and seeded" }
```

## External Integrations

| Service | Purpose | Key |
|---------|---------|-----|
| Google Maps JavaScript API | Map display, geocoding, polygon drawing, area calculation | `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Clerk | Authentication, user management | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| Neon PostgreSQL | Serverless database for searches and usage counter | `DATABASE_URL` |
| OpenStreetMap Nominatim | Reverse geocoding for building geometry detection | (no key required) |
