<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# Dakoppervlakte

Deze file bevat richtlijnen voor Gemini om efficiënt in dit project te werken.

## Architecturale richtlijnen
- **API-First**: Gebruik altijd de proxy routes in `src/app/api/` voor externe data om CORS-fouten te voorkomen.
- **Database**: Gebruik `src/lib/db.ts` voor database interactie via Neon. Nieuwe tabellen of data-operaties moeten `dynamic = 'force-dynamic'` gebruiken en robuust zijn tegen 'table not found' fouten.
- **Geometrie**: Bij het verwerken van gebouwgeometrie, check altijd of de data van `Basisregisters Vlaanderen` komt of `WFS` (met BBOX). De data-structuur kan verschillen (Feature vs FeatureCollection).

## Belangrijke bestanden
- `src/app/page.tsx`: De main applicatie logica en kaart-interactie.
- `src/app/api/building-polygon/route.ts`: Proxy voor externe geografische data.
- `src/app/api/counter/route.ts`: Teller logica voor berekeningen.

## Workflows
- **Wijzigingen aan routes**: Vergeet niet om Clerk authenticatie te overwegen. Publieke routes (zoals `/api/counter` en `/api/building-polygon`) moeten geen `auth().protect()` bevatten.
- **Debugging**: Als een functie niet werkt, voeg altijd een `debug` veld toe aan de JSON-response, zodat we kunnen zien welke stap in de keten faalt.
