'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Search } from '@/lib/types'

export function useSearchHistory(isSignedIn: boolean) {
  const [history, setHistory] = useState<Search[]>([])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/searches')
      const data = await res.json()
      if (Array.isArray(data)) setHistory(data)
    } catch {
      // Silently fail — history is non-critical
    }
  }, [])

  useEffect(() => {
    if (isSignedIn) fetchHistory()
    else setHistory([])
  }, [isSignedIn, fetchHistory])

  const saveEntry = useCallback(
    async (address: string, area_m2: number) => {
      if (!isSignedIn || !address || area_m2 <= 0) return
      try {
        await fetch('/api/searches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, area_m2: Math.round(area_m2 * 10) / 10 }),
        })
        await fetchHistory()
      } catch {
        // Non-critical
      }
    },
    [isSignedIn, fetchHistory]
  )

  return { history, saveEntry }
}
