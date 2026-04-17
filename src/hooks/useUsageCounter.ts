'use client'

import { useCallback, useEffect, useState } from 'react'

export interface UsageCounterOptions {
  endpoint?: string
  storageKey?: string
}

const DEFAULTS = {
  endpoint: '/api/counter',
  storageKey: 'dakoppervlakte_searched_addresses',
}

function getStoredAddresses(storageKey: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]')
  } catch {
    return []
  }
}

function hasSeen(storageKey: string, address: string): boolean {
  return getStoredAddresses(storageKey).includes(address.trim().toLowerCase())
}

function markSeen(storageKey: string, address: string) {
  const addresses = getStoredAddresses(storageKey)
  const normalized = address.trim().toLowerCase()
  if (!addresses.includes(normalized)) {
    addresses.push(normalized)
    localStorage.setItem(storageKey, JSON.stringify(addresses))
  }
}

export function useUsageCounter(options: UsageCounterOptions = {}) {
  const endpoint = options.endpoint ?? DEFAULTS.endpoint
  const storageKey = options.storageKey ?? DEFAULTS.storageKey

  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? null))
      .catch(() => {})
  }, [endpoint])

  const increment = useCallback(async (address: string) => {
    if (!address.trim() || hasSeen(storageKey, address)) return
    markSeen(storageKey, address)
    try {
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      setCount(data.count ?? null)
    } catch {
      // non-critical
    }
  }, [endpoint, storageKey])

  return { count, increment }
}
