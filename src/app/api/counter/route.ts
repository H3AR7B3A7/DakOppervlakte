import { NextResponse } from 'next/server'
import getDb from '@/lib/db'

export const dynamic = 'force-dynamic'

async function initDb(sql: any) {
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
}

export async function POST() {
  try {
    const sql = getDb()
    let result = await sql`
      UPDATE usage_counter SET count = count + 1 WHERE id = 1 RETURNING count
    `
    
    if (result.length === 0) {
      // Counter doesn't exist? Try to init and retry once
      await initDb(sql)
      result = await sql`
        UPDATE usage_counter SET count = count + 1 WHERE id = 1 RETURNING count
      `
    }
    
    return NextResponse.json({ count: result[0].count })
  } catch (e: any) {
    console.error('Counter POST error:', e)
    // If it's a table-not-found error, try to init and retry
    if (e.message?.includes('does not exist')) {
      try {
        const sql = getDb()
        await initDb(sql)
        const result = await sql`
          UPDATE usage_counter SET count = count + 1 WHERE id = 1 RETURNING count
        `
        return NextResponse.json({ count: result[0].count })
      } catch (e2) {
        return NextResponse.json({ count: null, error: 'Database init failed' }, { status: 500 })
      }
    }
    return NextResponse.json({ count: null, error: e.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sql = getDb()
    const result = await sql`SELECT count FROM usage_counter WHERE id = 1`
    return NextResponse.json({ count: result[0]?.count ?? 0 })
  } catch (e: any) {
    if (e.message?.includes('does not exist')) return NextResponse.json({ count: 0 })
    return NextResponse.json({ count: 0, error: e.message })
  }
}
