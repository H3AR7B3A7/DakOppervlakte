import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.DATABASE_URL
  if (!url) return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 })

  try {
    const sql = neon(url)
    
    // Create tables
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

    // Seed counter
    await sql`
      INSERT INTO usage_counter (id, count)
      VALUES (1, 0)
      ON CONFLICT (id) DO NOTHING
    `

    return NextResponse.json({ status: '✅ Database tables created and seeded' })
  } catch (e: any) {
    console.error('Init error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
