'use client'

import React, { useState } from 'react'
import type { PolygonEntry } from '@/lib/types'
import { Badge } from '@/components/ui'
import { formatArea } from '@/lib/utils'

interface PolygonListProps {
  polygons: PolygonEntry[]
  onDelete: (id: string) => void
  onRename: (id: string, label: string) => void
}

export function PolygonList({ polygons, onDelete, onRename }: PolygonListProps) {
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
        Vlakken
      </p>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {polygons.map((p) => (
          <li
            key={p.id}
            style={{
              background: 'var(--surface2)',
              borderRadius: 9,
              padding: '10px 12px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  aria-label="Naam van het vlak"
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
                  title="Klik om naam te wijzigen"
                  aria-label={`Hernoem vlak: ${p.label}`}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: 'var(--text)',
                    cursor: 'text',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    padding: 0,
                  }}
                >
                  {p.label}
                </button>
              )}

              <Badge variant="accent">{formatArea(p.area)} m²</Badge>

              <button
                onClick={() => onDelete(p.id)}
                aria-label={`Verwijder ${p.label}`}
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
        ))}
      </ul>
    </div>
  )
}
