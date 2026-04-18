import { neon } from '@neondatabase/serverless'
import { loadEnvConfig } from '@next/env'
import { resolve } from 'node:path'

// Load .env.local the same way Next.js does
loadEnvConfig(resolve(process.cwd()))

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set in .env.local')
}
const sql = neon(databaseUrl)

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS searches (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      address TEXT NOT NULL,
      area_m2 FLOAT NOT NULL,
      polygons JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, address)
    )
  `

  // Ensure polygons column exists for existing tables
  await sql`
    ALTER TABLE searches ADD COLUMN IF NOT EXISTS polygons JSONB
  `

  // Cleanup duplicates before adding constraint
  await sql`
    DELETE FROM searches a USING searches b
    WHERE a.id < b.id AND a.user_id = b.user_id AND a.address = b.address
  `

  // Add UNIQUE constraint if it doesn't exist
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'searches_user_id_address_key') THEN
        ALTER TABLE searches ADD CONSTRAINT searches_user_id_address_key UNIQUE (user_id, address);
      END IF;
    END;
    $$;
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
