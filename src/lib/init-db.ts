import { loadEnvConfig } from '@next/env'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'

// Load .env.local the same way Next.js does
loadEnvConfig(resolve(process.cwd()))

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS searches (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      address TEXT NOT NULL,
      area_m2 FLOAT NOT NULL,
      polygons JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  // Ensure polygons column exists for existing tables
  await sql`
    ALTER TABLE searches ADD COLUMN IF NOT EXISTS polygons JSONB
  `

  await sql`
    CREATE TABLE IF NOT EXISTS usage_counter (
      id INT PRIMARY KEY DEFAULT 1,
      count BIGINT DEFAULT 0
    )
  `

  await sql`
    INSERT INTO usage_counter (id, count)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `

  console.log('✅ Database initialized')
}

main().catch(console.error)
