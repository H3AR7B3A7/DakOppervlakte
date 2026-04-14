import { renderHook, waitFor, act } from '@testing-library/react'
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
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
      text: async () => '[]',
    } as unknown as Response)

    const { result, rerender } = renderHook(({ signedIn }) => useSearchHistory(signedIn), {
      initialProps: { signedIn: true },
    })

    rerender({ signedIn: false })
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
})
