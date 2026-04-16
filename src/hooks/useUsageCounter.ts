'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'dakoppervlakte_searched_addresses'

function getStoredAddresses(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function hasSearched(address: string): boolean {
  return getStoredAddresses().includes(address.trim().toLowerCase())
}

function markSearched(address: string) {
  const addresses = getStoredAddresses()
  const normalized = address.trim().toLowerCase()
  if (!addresses.includes(normalized)) {
    addresses.push(normalized)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses))
  }
}

export function useUsageCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/counter')
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? null))
      .catch(() => {})
  }, [])

  const increment = useCallback(async (address: string) => {
    if (!address.trim() || hasSearched(address)) return
    markSearched(address)
    try {
      const res = await fetch('/api/counter', { method: 'POST' })
      const data = await res.json()
      setCount(data.count ?? null)
    } catch {
      // non-critical
    }
  }, [])

  return { count, increment }
}
