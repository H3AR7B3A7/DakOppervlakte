'use client'

import React from 'react'

interface RotationControlsProps {
  heading: number
  tilt: number
  onHeadingChange: (heading: number) => void
  onRotate: (delta: number) => void
  onTiltToggle: () => void
}

export function RotationControls({
  heading,
  tilt,
  onHeadingChange,
  onRotate,
  onTiltToggle,
}: RotationControlsProps) {
  const iconButtonStyle: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 7,
    color: 'var(--text)',
    width: 36,
    height: 36,
    fontSize: 16,
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div
      style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
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
        Kaarthoek &amp; perspectief
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button
          onClick={() => onRotate(-30)}
          aria-label="Roteer links"
          style={iconButtonStyle}
        >
          ↺
        </button>

        <div style={{ flex: 1 }}>
          <input
            type="range"
            min="0"
            max="360"
            value={heading}
            onChange={(e) => onHeadingChange(Number(e.target.value))}
            aria-label="Kaartrichting"
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            <span>N</span>
            <span aria-live="polite">{heading}°</span>
            <span>N</span>
          </div>
        </div>

        <button
          onClick={() => onRotate(30)}
          aria-label="Roteer rechts"
          style={iconButtonStyle}
        >
          ↻
        </button>
      </div>

      <button
        onClick={onTiltToggle}
        aria-pressed={tilt === 45}
        aria-label="Toggle 3D perspectief"
        style={{
          width: '100%',
          background: tilt === 45 ? 'rgba(110,231,183,0.15)' : 'var(--surface2)',
          border: `1px solid ${tilt === 45 ? 'rgba(110,231,183,0.5)' : 'var(--border)'}`,
          borderRadius: 7,
          color: tilt === 45 ? 'var(--accent)' : 'var(--text-muted)',
          padding: '8px',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
        }}
      >
        {tilt === 45 ? '🏔 Perspectief aan (45°)' : '🗺 Perspectief uit (bovenaanzicht)'}
      </button>
    </div>
  )
}
