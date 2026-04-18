'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import type { PolygonEntry } from '@/lib/types'

interface PolygonChipBarProps {
  polygons: PolygonEntry[]
  onDelete: (id: string) => void
  onRename: (id: string, label: string) => void
  onToggleExcluded: (id: string) => void
}

const LONG_PRESS_MS = 500

export function PolygonChipBar({
  polygons,
  onDelete,
  onRename,
  onToggleExcluded,
}: PolygonChipBarProps) {
  const t = useTranslations('ChipBar')
  const tSide = useTranslations('Sidebar')
  const format = useFormatter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingLabel, setPendingLabel] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClickRef = useRef(false)
  const skipCommitRef = useRef(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId !== null) renameInputRef.current?.focus()
  }, [editingId])

  useEffect(
    () => () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    },
    [],
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsMobile(!mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (polygons.length === 0 || !isMobile) return null

  const total = polygons.reduce((s, p) => (p.excluded ? s : s + p.area), 0)

  const startLongPress = (id: string, label: string) => {
    suppressClickRef.current = false
    longPressTimer.current = setTimeout(() => {
      suppressClickRef.current = true
      setEditingId(id)
      setPendingLabel(label)
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
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'stretch',
        width: 'max-content',
        maxWidth: 'calc(100% - 88px)',
        zIndex: 5,
      }}
    >
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1.2,
        }}
      >
        <span>{t('totalLabel')}</span>
        <span style={{ fontSize: 11 }}>
          {format.number(total, { maximumFractionDigits: 1 })} {tSide('unit')}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
          paddingRight: 4,
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
                border: `1px solid ${color}`,
                borderRadius: 18,
                padding: '6px 10px',
                flexShrink: 0,
                opacity: p.excluded ? 0.5 : 1,
                textDecoration: p.excluded ? 'line-through' : 'none',
              }}
            >
              {isEditing ? (
                <input
                  ref={renameInputRef}
                  aria-label={t('renameChipAriaLabel', { label: p.label })}
                  value={pendingLabel}
                  onChange={(e) => setPendingLabel(e.target.value)}
                  onBlur={() => {
                    if (skipCommitRef.current) {
                      skipCommitRef.current = false
                      return
                    }
                    commitEdit(p.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      skipCommitRef.current = false
                      ;(e.target as HTMLInputElement).blur()
                    }
                    if (e.key === 'Escape') {
                      skipCommitRef.current = true
                      setEditingId(null)
                    }
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
                    flexDirection: 'column',
                    gap: 1,
                    alignItems: 'center',
                    textAlign: 'center',
                    flex: 1,
                    minWidth: 0,
                    lineHeight: 1.2,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {p.label}
                  </span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 11 }}>
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
    </div>
  )
}
