import { describe, it, expect, vi } from 'vitest'
import { GET, POST } from '@/app/api/searches/route'

// Mock Clerk and DB
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  default: vi.fn(),
}))

describe('searches API', () => {
  it('GET returns 401 if not signed in', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    
    const res = await GET()
    expect(res.status).toBe(401)
  })
})
