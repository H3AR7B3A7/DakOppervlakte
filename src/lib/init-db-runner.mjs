// Loads .env.local then runs init-db.ts
import { loadEnvConfig } from '@next/env'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectDir = resolve(__dirname, '../..')

loadEnvConfig(projectDir)

// Now run the actual init
const { default: getDb } = await import('./db.ts')
const sql = getDb()

await sql`
  CREATE TABLE IF NOT EXISTS searches (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    address TEXT NOT NULL,
    area_m2 FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
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
process.exit(0)
