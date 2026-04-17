'use client'

import React, { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslations, useFormatter } from 'next-intl'
import type { PolygonEntry } from '@/lib/types'

interface PolygonChipBarProps {
  polygons: PolygonEntry[]
  onDelete: (id: string) => void
  onRename: (id: string, label: string) => void
  onToggleExcluded: (id: string) => void
}

const LONG_PRESS_MS = 500

export function PolygonChipBar({ polygons, onDelete, onRename, onToggleExcluded }: PolygonChipBarProps) {
  const t = useTranslations('ChipBar')
  const tSide = useTranslations('Sidebar')
  const format = useFormatter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingLabel, setPendingLabel] = useState('')
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClickRef = useRef(false)

  if (polygons.length === 0) return null

  const total = polygons.reduce((s, p) => (p.excluded ? s : s + p.area), 0)

  const startLongPress = (id: string, label: string) => {
    suppressClickRef.current = false
    longPressTimer.current = setTimeout(() => {
      suppressClickRef.current = true
      // flushSync so that synchronous code dispatching a pointerup (e.g. in
      // tests, or rapid touch release) immediately sees the rename input.
      flushSync(() => {
        setEditingId(id)
        setPendingLabel(label)
      })
    }, LONG_PRESS_MS)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const commitEdit = (id: string) => {
    const trimmed = pendingLabel.trim()
    if (trimmed) onRename(id, trimmed)
    setEditingId(null)
  }

  return (
    <div
      className="md:hidden"
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        zIndex: 5,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          flex: 1,
          paddingBottom: 4,
        }}
      >
        {polygons.map((p) => {
          const color = (p.polygon.get('fillColor') as string) || 'var(--accent)'
          const isEditing = editingId === p.id
          return (
            <div
              key={p.id}
              data-testid={`chip-${p.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: '6px 10px',
                flexShrink: 0,
                opacity: p.excluded ? 0.5 : 1,
                textDecoration: p.excluded ? 'line-through' : 'none',
              }}
            >
              <span
                aria-hidden="true"
                style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }}
              />
              {isEditing ? (
                <input
                  autoFocus
                  aria-label={t('renameChipAriaLabel', { label: p.label })}
                  value={pendingLabel}
                  onChange={(e) => setPendingLabel(e.target.value)}
                  onBlur={() => commitEdit(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--accent)',
                    borderRadius: 4,
                    color: 'var(--text)',
                    padding: '2px 6px',
                    fontSize: 12,
                    outline: 'none',
                    minWidth: 0,
                    width: 120,
                  }}
                />
              ) : (
                <button
                  type="button"
                  aria-label={t('toggleChipAriaLabel', {
                    label: p.label,
                    area: format.number(p.area, { maximumFractionDigits: 1 }),
                  })}
                  onClick={() => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false
                      return
                    }
                    onToggleExcluded(p.id)
                  }}
                  onPointerDown={() => startLongPress(p.id, p.label)}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onPointerCancel={cancelLongPress}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text)',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                    maxWidth: 160,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 100,
                    }}
                  >
                    {p.label}
                  </span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    {format.number(p.area, { maximumFractionDigits: 1 })} {tSide('unit')}
                  </span>
                </button>
              )}
              <button
                type="button"
                aria-label={t('deleteChipAriaLabel', { label: p.label })}
                onClick={() => onDelete(p.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: '0 2px',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      <div
        data-testid="chip-bar-total"
        style={{
          background: 'var(--accent)',
          color: '#000',
          borderRadius: 18,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'Syne, sans-serif',
          flexShrink: 0,
        }}
      >
        {t('totalLabel')} {format.number(total, { maximumFractionDigits: 1 })} {tSide('unit')}
      </div>
    </div>
  )
}
