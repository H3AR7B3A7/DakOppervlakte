import React from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import type { Search } from '@/lib/types'

interface SearchHistoryProps {
  history: Search[]
}

export function SearchHistory({ history }: SearchHistoryProps) {
  const t = useTranslations('Sidebar')
  const format = useFormatter()

  if (history.length === 0) return null

  return (
    <nav
      aria-label={t('historyAriaLabel')}
      style={{
        borderTop: '1px solid var(--border)',
        padding: '14px 24px',
        maxHeight: 200,
        overflowY: 'auto',
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          fontFamily: 'Syne, sans-serif',
          marginBottom: 8,
        }}
      >
        {t('historyTitle')}
      </p>
      <ul style={{ listStyle: 'none' }}>
        {history.map((h, i) => (
          <li
            key={i}
            style={{
              background: 'var(--surface2)',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid transparent',
              marginBottom: 5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 190,
              }}
            >
              {h.address}
            </span>
            <span
              style={{
                fontSize: 12,
                color: 'var(--accent)',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              {format.number(h.area_m2, { maximumFractionDigits: 1 })} {t('unit')}
            </span>
          </li>
        ))}
      </ul>
      <style>{`::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }`}</style>
    </nav>
  )
}
