# Dakoppervlakte 🏠

Bereken gratis de oppervlakte van elk dak in België op adres.

## Stack
- **Next.js 15** (App Router)
- **Clerk** (auth — Google, Facebook, email)
- **Neon Postgres** (search history + usage counter)
- **Google Maps JS API** (satellite + drawing tools)
- Hosted on **Vercel**

## Setup

### 1. Clone & install
```bash
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in:

- **Clerk keys**: [dashboard.clerk.com](https://dashboard.clerk.com)
  - Enable Google OAuth: Clerk Dashboard → Social Connections → Google
  - Enable Facebook OAuth: Clerk Dashboard → Social Connections → Facebook
- **Google Maps key**: [console.cloud.google.com](https://console.cloud.google.com)
  - Enable: Maps JavaScript API, Geocoding API
- **DATABASE_URL**: auto-injected by Vercel Neon integration

### 3. Initialize DB (once after deploy)
Visit: `https://your-domain.vercel.app/api/init`

### 4. Run locally
```bash
npm run dev
```

## Deploy
Push to GitHub → Vercel auto-deploys.
Add Neon integration via Vercel Marketplace → DATABASE_URL is injected automatically.
