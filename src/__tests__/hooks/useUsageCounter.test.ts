import { act, renderHook, waitFor } from '@testing-library/react'
import { useUsageCounter } from '@/hooks/useUsageCounter'

describe('useUsageCounter', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the global count on mount', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ count: 42 }),
    } as Response)

    const { result } = renderHook(() => useUsageCounter())

    await waitFor(() => {
      expect(result.current.count).toBe(42)
    })
  })

  it('increments global count for a new address', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ count: 10 }),
    } as Response)
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ count: 11 }),
    } as Response)

    const { result } = renderHook(() => useUsageCounter())

    await waitFor(() => {
      expect(result.current.count).toBe(10)
    })

    await act(async () => {
      await result.current.increment('Meir 1, Antwerpen')
    })

    await waitFor(() => {
      expect(result.current.count).toBe(11)
    })
  })

  it('does not increment for a duplicate address', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ count: 10 }),
    } as Response)

    const { result } = renderHook(() => useUsageCounter())

    await waitFor(() => {
      expect(result.current.count).toBe(10)
    })

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ count: 11 }),
    } as Response)

    await act(async () => {
      await result.current.increment('Meir 1, Antwerpen')
    })

    await act(async () => {
      await result.current.increment('meir 1, antwerpen')
    })

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('skips empty addresses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ count: 5 }),
    } as Response)

    const { result } = renderHook(() => useUsageCounter())

    await waitFor(() => {
      expect(result.current.count).toBe(5)
    })

    await act(async () => {
      await result.current.increment('')
      await result.current.increment('   ')
    })

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('remembers searched addresses across re-mounts', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ count: 10 }),
    } as Response)

    const { result, unmount } = renderHook(() => useUsageCounter())
    await waitFor(() => expect(result.current.count).toBe(10))

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ count: 11 }),
    } as Response)

    await act(async () => {
      await result.current.increment('Meir 1, Antwerpen')
    })

    unmount()
    vi.mocked(fetch).mockReset()
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ count: 11 }),
    } as Response)

    const { result: result2 } = renderHook(() => useUsageCounter())
    await waitFor(() => expect(result2.current.count).toBe(11))

    await act(async () => {
      await result2.current.increment('Meir 1, Antwerpen')
    })

    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
