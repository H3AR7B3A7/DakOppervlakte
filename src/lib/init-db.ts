import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
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
}

main().catch(console.error)
