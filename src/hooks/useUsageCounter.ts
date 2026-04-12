'use client'

import { useCallback, useEffect, useState } from 'react'

export function useUsageCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/counter')
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? null))
      .catch(() => {})
  }, [])

  const increment = useCallback(async () => {
    try {
      const res = await fetch('/api/counter', { method: 'POST' })
      const data = await res.json()
      setCount(data.count ?? null)
    } catch {
      // Non-critical — don't throw
    }
  }, [])

  return { count, increment }
}
