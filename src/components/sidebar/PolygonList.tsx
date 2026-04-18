'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'
import { Badge } from '@/components/ui'
import type { PolygonEntry } from '@/lib/types'
import { normalizeHeading } from '@/lib/utils'

interface PolygonListProps {
  polygons: PolygonEntry[]
  currentHeading: number
  currentTilt: number
  onDelete: (id: string) => void
  onRename: (id: string, label: string) => void
  onToggleExcluded: (id: string) => void
}

export function PolygonList({
  polygons,
  currentHeading,
  currentTilt,
  onDelete,
  onRename,
  onToggleExcluded,
}: PolygonListProps) {
  const t = useTranslations('Sidebar')
  const format = useFormatter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingLabel, setPendingLabel] = useState('')

  const startEdit = (id: string, currentLabel: string) => {
    setEditingId(id)
    setPendingLabel(currentLabel)
  }

  const commitEdit = (id: string) => {
    if (pendingLabel.trim()) {
      onRename(id, pendingLabel.trim())
    }
    setEditingId(null)
  }

  if (polygons.length === 0) return null

  return (
    <div style={{ marginBottom: 16 }}>
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
        {t('planesTitle')}
      </p>

      <ul
        className="thin-scrollbar"
        style={{
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: 168,
          overflowY: 'auto',
        }}
      >
        {polygons.map((p) => {
          const headingMatch = normalizeHeading(p.heading) === normalizeHeading(currentHeading)
          const tiltMatch = p.tilt === currentTilt
          const isActiveOrientation = headingMatch && tiltMatch

          return (
            <li
              key={p.id}
              style={{
                background: 'var(--surface2)',
                borderRadius: 9,
                padding: '10px 12px',
                border: '1px solid var(--border)',
                opacity: p.excluded ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Include/Exclude toggle (Checkbox) */}
                <input
                  type="checkbox"
                  checked={!p.excluded}
                  onChange={() => onToggleExcluded(p.id)}
                  title={p.excluded ? t('includeInTotal') : t('excludeFromTotal')}
                  style={{ cursor: 'pointer', width: 14, height: 14 }}
                />

                {/* Visibility status indicator (Static Eye) */}
                <span
                  title={isActiveOrientation ? t('visibleOnMap') : t('hiddenOnMap')}
                  style={{
                    fontSize: 16,
                    filter: isActiveOrientation ? 'none' : 'grayscale(1)',
                    opacity: isActiveOrientation ? 1 : 0.2,
                    userSelect: 'none',
                    cursor: 'default',
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  👁️
                </span>

                {/* Colour dot */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: (p.polygon.get('fillColor') as string) || 'var(--accent)',
                  }}
                />

                {/* Editable label */}
                {editingId === p.id ? (
                  <input
                    autoFocus
                    value={pendingLabel}
                    onChange={(e) => setPendingLabel(e.target.value)}
                    onBlur={() => commitEdit(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    aria-label={t('planeNameAriaLabel')}
                    style={{
                      flex: 1,
                      background: 'var(--bg)',
                      border: '1px solid var(--accent)',
                      borderRadius: 5,
                      color: 'var(--text)',
                      padding: '2px 8px',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                ) : (
                  <button
                    onClick={() => startEdit(p.id, p.label)}
                    title={t('renamePlaneTitle')}
                    aria-label={t('renamePlaneAriaLabel', { label: p.label })}
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: 'var(--text)',
                      cursor: 'text',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      padding: 0,
                      fontWeight: isActiveOrientation ? 500 : 400,
                    }}
                  >
                    {p.label}
                    {!isActiveOrientation && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>
                        ({p.heading}°, {p.tilt === 45 ? '3D' : '2D'})
                      </span>
                    )}
                  </button>
                )}

                <Badge variant="accent">
                  {format.number(p.area, { maximumFractionDigits: 1 })} {t('unit')}
                </Badge>

                <button
                  onClick={() => onDelete(p.id)}
                  aria-label={t('deletePlaneAriaLabel', { label: p.label })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: '0 2px',
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
