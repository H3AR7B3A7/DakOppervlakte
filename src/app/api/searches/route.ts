import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import getDb from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { address, area_m2 } = await req.json()
  const sql = getDb()
  await sql`
    INSERT INTO searches (user_id, address, area_m2)
    VALUES (${userId}, ${address}, ${area_m2})
  `
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sql = getDb()
  const results = await sql`
    SELECT address, area_m2, created_at
    FROM searches
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 20
  `
  return NextResponse.json(results)
}
