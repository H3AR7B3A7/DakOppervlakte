import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { DELETE, GET, POST } from '@/app/api/searches/route'
import { getDb } from '@/lib/db'

// Mock Clerk and DB
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

describe('searches API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns 401 if not signed in', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('POST returns 401 if not signed in', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)

    const req = new NextRequest('http://localhost/api/searches', {
      method: 'POST',
      body: JSON.stringify({ address: 'test', area_m2: 10, polygons: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('POST performs UPSERT', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any)
    const mockSql = vi.fn().mockResolvedValue([])
    vi.mocked(getDb).mockReturnValue(mockSql as unknown as ReturnType<typeof getDb>)

    const payload = { address: 'Main St 1', area_m2: 100, polygons: [{ id: '1' }] }
    const req = new NextRequest('http://localhost/api/searches', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    // Check if SQL query contains ON CONFLICT
    const lastCall = mockSql.mock.calls[0]
    const queryParts = lastCall[0] as TemplateStringsArray
    const query = queryParts.join('')
    expect(query).toContain('ON CONFLICT (user_id, address)')
    expect(query).toContain('DO UPDATE SET')
    expect(query).toContain('area_m2 = EXCLUDED.area_m2')
    expect(query).toContain('polygons = EXCLUDED.polygons')
    expect(query).toContain('created_at = NOW()')
  })

  it('DELETE requires an ID', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any)

    const req = new NextRequest('http://localhost/api/searches')
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })
})
