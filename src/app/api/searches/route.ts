import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import getDb from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { address, area_m2, polygons } = await req.json()
  const sql = getDb()
  await sql`
    INSERT INTO searches (user_id, address, area_m2, polygons)
    VALUES (${userId}, ${address}, ${area_m2}, ${JSON.stringify(polygons)})
  `
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sql = getDb()
  const results = await sql`
    SELECT id, address, area_m2, polygons, created_at
    FROM searches
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 20
  `
  return NextResponse.json(results)
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  const sql = getDb()
  await sql`
    DELETE FROM searches
    WHERE id = ${id} AND user_id = ${userId}
  `

  return NextResponse.json({ ok: true })
}
