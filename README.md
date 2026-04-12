# DakOppervlakte

DakOppervlakte is een efficiënte tool voor het berekenen van dakoppervlakken voor zonnepanelen of renovatieprojecten, met automatische detectie van gebouwgeometrieën in België.

## Features

- 🏢 **Automatische Gebouwdetectie**: Gebruik van officiële data van Digitaal Vlaanderen (Basisregisters) en UrbIS (Brussel).
- 🗺 **Kaartintegratie**: Interactieve satellietkaarten met rotatie en tilt-ondersteuning.
- 📐 **Nauwkeurige Oppervlaktemeting**: Directe berekening van de 2D-voetafdruk.
- 💾 **Geschiedenis**: Sla uw berekeningen op met integratie via Clerk.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Maps**: Google Maps JavaScript API
- **Data**: Basisregisters Vlaanderen & UrbIS
- **Database**: Neon Postgres
- **Auth**: Clerk

## Setup

1. Clone de repository.
2. Kopieer `.env.example` naar `.env` en vul de benodigde API-keys in:
   - `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
   - `DATABASE_URL` (Neon Postgres)
   - `CLERK_SECRET_KEY` & `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Installeer dependencies: `npm install`
4. Start de ontwikkelserver: `npm run dev`

## Deployment

De applicatie is geoptimaliseerd voor Vercel. Zorg dat alle omgevingsvariabelen in het Vercel Dashboard zijn ingesteld.
