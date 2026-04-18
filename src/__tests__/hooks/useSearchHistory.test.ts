import { act, renderHook, waitFor } from '@testing-library/react'
import { useSearchHistory } from '@/hooks/useSearchHistory'

describe('useSearchHistory', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches history when signed in', async () => {
    const mockHistory = [{ address: 'Teststraat 1', area_m2: 100, created_at: '2024-01-01' }]
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
      text: async () => JSON.stringify(mockHistory),
    } as unknown as Response)

    const { result } = renderHook(() => useSearchHistory(true))

    await waitFor(() => {
      expect(result.current.history).toEqual(mockHistory)
    })
  })

  it('clears history when signed out', async () => {
    const mockHistory = [{ id: 1, address: 'Teststraat 1', area_m2: 100, created_at: '2024-01-01' }]
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockHistory,
      text: async () => JSON.stringify(mockHistory),
    } as unknown as Response)

    const { result, rerender } = renderHook(({ signedIn }) => useSearchHistory(signedIn), {
      initialProps: { signedIn: true },
    })

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.history).toEqual(mockHistory)
    })

    act(() => {
      rerender({ signedIn: false })
    })
    expect(result.current.history).toEqual([])
  })

  it('saves entry and refreshes history', async () => {
    const mockHistory = [{ address: 'Teststraat 1', area_m2: 100, created_at: '2024-01-01' }]
    // Initial fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      text: async () => '[]',
    } as unknown as Response)
    // Post fetch (save)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => '{"ok":true}',
    } as unknown as Response)
    // Refetch history
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
      text: async () => JSON.stringify(mockHistory),
    } as unknown as Response)

    const { result } = renderHook(() => useSearchHistory(true))

    await act(async () => {
      await result.current.saveEntry('Teststraat 1', 100, [])
    })

    await waitFor(() => {
      expect(result.current.history).toHaveLength(1)
    })
  })

  it('deletes entry and refreshes history', async () => {
    const mockHistory = [{ id: 1, address: 'Teststraat 1', area_m2: 100, created_at: '2024-01-01' }]
    // Initial fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
      text: async () => JSON.stringify(mockHistory),
    } as unknown as Response)
    // Delete fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => '{"ok":true}',
    } as unknown as Response)
    // Refetch history
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      text: async () => '[]',
    } as unknown as Response)

    const { result } = renderHook(() => useSearchHistory(true))

    await act(async () => {
      await result.current.deleteEntry(1)
    })

    await waitFor(() => {
      expect(result.current.history).toHaveLength(0)
    })
  })

  it('handles fetch failure gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSearchHistory(true))

    await waitFor(() => {
      expect(result.current.history).toEqual([])
    })
  })

  it('handles save failure gracefully', async () => {
    // Initial fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      text: async () => '[]',
    } as unknown as Response)
    // Save fails
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as unknown as Response)

    const { result } = renderHook(() => useSearchHistory(true))

    await act(async () => {
      await result.current.saveEntry('Meir 1', 100, [])
    })

    expect(result.current.history).toEqual([])
  })

  it('skips save when address is empty', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      text: async () => '[]',
    } as unknown as Response)

    const { result } = renderHook(() => useSearchHistory(true))

    await act(async () => {
      await result.current.saveEntry('', 100, [])
    })

    // Only the initial fetch, no POST
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('skips save when area is 0', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      text: async () => '[]',
    } as unknown as Response)

    const { result } = renderHook(() => useSearchHistory(true))

    await act(async () => {
      await result.current.saveEntry('Meir 1', 0, [])
    })

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('handles delete failure gracefully', async () => {
    const mockHistory = [{ id: 1, address: 'Test', area_m2: 100, created_at: '2024-01-01' }]
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
      text: async () => JSON.stringify(mockHistory),
    } as unknown as Response)
    // Delete fails
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSearchHistory(true))

    await waitFor(() => {
      expect(result.current.history).toHaveLength(1)
    })

    await act(async () => {
      await result.current.deleteEntry(1)
    })

    // Original history intact after failed delete
    expect(result.current.history).toHaveLength(1)
  })
})
