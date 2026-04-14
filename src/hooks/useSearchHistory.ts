'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Search } from '@/lib/types'

export function useSearchHistory(isSignedIn: boolean) {
  const [history, setHistory] = useState<Search[]>([])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/searches')
      if (!res.ok) {
        console.error('[SearchHistory] fetch failed:', res.status, await res.text())
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) setHistory(data)
    } catch (err) {
      console.error('[SearchHistory] fetch error:', err)
    }
  }, [])

  useEffect(() => {
    if (isSignedIn) fetchHistory()
    else setHistory([])
  }, [isSignedIn, fetchHistory])

  const saveEntry = useCallback(
    async (address: string, area_m2: number) => {
      if (!isSignedIn || !address || area_m2 <= 0) {
        console.warn('[SearchHistory] saveEntry skipped — isSignedIn:', isSignedIn, 'address:', address, 'area_m2:', area_m2)
        return
      }
      try {
        const res = await fetch('/api/searches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, area_m2: Math.round(area_m2 * 10) / 10 }),
        })
        if (!res.ok) {
          console.error('[SearchHistory] save failed:', res.status, await res.text())
          return
        }
        await fetchHistory()
      } catch (err) {
        console.error('[SearchHistory] save error:', err)
      }
    },
    [isSignedIn, fetchHistory]
  )

  return { history, saveEntry }
}
