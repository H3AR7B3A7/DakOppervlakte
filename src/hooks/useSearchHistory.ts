'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Search, PolygonData } from '@/lib/types'

export function useSearchHistory(isSignedIn: boolean) {
  const [history, setHistory] = useState<Search[]>([])

  // If signed out, ensure history is cleared (avoids cascading render in useEffect)
  if (!isSignedIn && history.length > 0) {
    setHistory([])
  }

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/searches')
      if (!res.ok) {
        console.error('[SearchHistory] fetch failed:', res.status, await res.text())
        return null
      }
      return await res.json()
    } catch (err) {
      console.error('[SearchHistory] fetch error:', err)
      return null
    }
  }, [])

  useEffect(() => {
    if (!isSignedIn) return
    let active = true
    fetchHistory().then((data) => {
      if (active && Array.isArray(data)) setHistory(data)
    })
    return () => {
      active = false
    }
  }, [isSignedIn, fetchHistory])

  const saveEntry = useCallback(
    async (address: string, area_m2: number, polygons: PolygonData[]) => {
      if (!isSignedIn || !address || area_m2 <= 0) {
        console.warn('[SearchHistory] saveEntry skipped — isSignedIn:', isSignedIn, 'address:', address, 'area_m2:', area_m2)
        return
      }
      try {
        const res = await fetch('/api/searches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            area_m2: Math.round(area_m2 * 10) / 10,
            polygons,
          }),
        })
        if (!res.ok) {
          console.error('[SearchHistory] save failed:', res.status, await res.text())
          return
        }
        const data = await fetchHistory()
        if (Array.isArray(data)) setHistory(data)
      } catch (err) {
        console.error('[SearchHistory] save error:', err)
      }
    },
    [isSignedIn, fetchHistory]
  )

  const deleteEntry = useCallback(
    async (id: number) => {
      if (!isSignedIn) return
      try {
        const res = await fetch(`/api/searches?id=${id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          console.error('[SearchHistory] delete failed:', res.status, await res.text())
          return
        }
        const data = await fetchHistory()
        if (Array.isArray(data)) setHistory(data)
      } catch (err) {
        console.error('[SearchHistory] delete error:', err)
      }
    },
    [isSignedIn, fetchHistory]
  )

  return { history, saveEntry, deleteEntry }
}
