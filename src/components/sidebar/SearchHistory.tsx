import React from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import type { Search } from '@/lib/types'

interface SearchHistoryProps {
  history: Search[]
  onRestore: (search: Search) => void
  onDelete: (id: number) => void
}

export function SearchHistory({ history, onRestore, onDelete }: SearchHistoryProps) {
  const t = useTranslations('Sidebar')
  const format = useFormatter()

  if (history.length === 0) return null

  return (
    <nav
      aria-label={t('historyAriaLabel')}
      className="thin-scrollbar"
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
            key={h.id || i}
            style={{
              display: 'flex',
              gap: 4,
              marginBottom: 5,
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => onRestore(h)}
              title={t('historyRestoreTitle')}
              style={{
                flex: 1,
                background: 'var(--surface2)',
                borderRadius: 8,
                padding: '8px 12px',
                border: '1px solid transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s',
                minWidth: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '70%',
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
            </button>
            <button
              onClick={() => onDelete(h.id)}
              aria-label={t('deleteHistoryAriaLabel')}
              title={t('deleteHistoryAriaLabel')}
              style={{
                background: 'var(--surface2)',
                border: '1px solid transparent',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f87171'
                e.currentTarget.style.color = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
