import { NextResponse } from 'next/server'
import getDb from '@/lib/db'

export async function POST() {
  try {
    const sql = getDb()
    const result = await sql`
      UPDATE usage_counter SET count = count + 1 WHERE id = 1 RETURNING count
    `
    return NextResponse.json({ count: result[0].count })
  } catch {
    return NextResponse.json({ count: null }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sql = getDb()
    const result = await sql`SELECT count FROM usage_counter WHERE id = 1`
    return NextResponse.json({ count: result[0]?.count ?? 0 })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
