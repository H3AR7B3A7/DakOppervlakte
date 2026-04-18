import { NextResponse } from 'next/server'
import getDb from '@/lib/db'

export const dynamic = 'force-dynamic'

async function initDb(sql: ReturnType<typeof getDb>) {
  await sql`
    CREATE TABLE IF NOT EXISTS autogen_counter (
      id INT PRIMARY KEY DEFAULT 1,
      count BIGINT DEFAULT 0
    )
  `
  await sql`
    INSERT INTO autogen_counter (id, count)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `
}

export async function POST() {
  try {
    const sql = getDb()
    let result = await sql`
      UPDATE autogen_counter SET count = count + 1 WHERE id = 1 RETURNING count
    `

    if (result.length === 0) {
      await initDb(sql)
      result = await sql`
        UPDATE autogen_counter SET count = count + 1 WHERE id = 1 RETURNING count
      `
    }

    return NextResponse.json({ count: result[0].count })
  } catch (e) {
    console.error('Autogen counter POST error:', e)
    if (e instanceof Error && e.message?.includes('does not exist')) {
      try {
        const sql = getDb()
        await initDb(sql)
        const result = await sql`
          UPDATE autogen_counter SET count = count + 1 WHERE id = 1 RETURNING count
        `
        return NextResponse.json({ count: result[0].count })
      } catch {
        return NextResponse.json({ count: null, debug: 'init-retry-failed' }, { status: 500 })
      }
    }
    return NextResponse.json(
      { count: null, debug: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const sql = getDb()
    const result = await sql`SELECT count FROM autogen_counter WHERE id = 1`
    return NextResponse.json({ count: result[0]?.count ?? 0 })
  } catch (e) {
    if (e instanceof Error && e.message?.includes('does not exist'))
      return NextResponse.json({ count: 0 })
    return NextResponse.json({ count: 0, debug: e instanceof Error ? e.message : String(e) })
  }
}
