import { renderHook, waitFor, act } from '@testing-library/react'
import { useUsageCounter } from '@/hooks/useUsageCounter'

describe('useUsageCounter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches initial count', async () => {
    const mockResponse = { count: 5 }
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => mockResponse,
    } as Response)

    const { result } = renderHook(() => useUsageCounter())

    await waitFor(() => {
      expect(result.current.count).toBe(5)
    })
  })

  it('increments count', async () => {
    // Initial fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ count: 5 }),
    } as Response)
    // Post fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ count: 6 }),
    } as Response)

    const { result } = renderHook(() => useUsageCounter())

    await waitFor(() => {
      expect(result.current.count).toBe(5)
    })

    await act(async () => {
      await result.current.increment()
    })

    await waitFor(() => {
      expect(result.current.count).toBe(6)
    })
  })
})
