import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSearchHistory } from '@/hooks/useSearchHistory'

describe('useSearchHistory', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches history when signed in', async () => {
    const mockHistory = [{ id: 1, address: 'Teststraat 1', area_m2: 100 }]
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => mockHistory,
    } as Response)

    const { result } = renderHook(() => useSearchHistory(true))

    await waitFor(() => {
      expect(result.current.history).toEqual(mockHistory)
    })
  })

  it('clears history when signed out', async () => {
    const { result, rerender } = renderHook(({ signedIn }) => useSearchHistory(signedIn), {
      initialProps: { signedIn: true },
    })

    rerender({ signedIn: false })
    expect(result.current.history).toEqual([])
  })

  it('saves entry and refreshes history', async () => {
    // Initial fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => [],
    } as Response)
    // Post fetch (save)
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 200,
    } as Response)
    // Refetch history
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => [{ id: 1, address: 'Teststraat 1', area_m2: 100 }],
    } as Response)

    const { result } = renderHook(() => useSearchHistory(true))

    await act(async () => {
      await result.current.saveEntry('Teststraat 1', 100)
    })

    await waitFor(() => {
      expect(result.current.history).toHaveLength(1)
    })
  })
})
