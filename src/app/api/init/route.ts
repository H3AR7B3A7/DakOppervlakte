import { NextResponse } from 'next/server'
import getDb from '@/lib/db'

export async function GET() {
  try {
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
    return NextResponse.json({ ok: true, message: 'Database initialized' })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
