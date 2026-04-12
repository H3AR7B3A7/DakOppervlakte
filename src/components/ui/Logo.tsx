import React from 'react'

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <polygon
          points="14,2 26,10 26,24 2,24 2,10"
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="1.5"
        />
        <polygon
          points="14,6 22,12 22,22 6,22 6,12"
          fill="#6ee7b7"
          fillOpacity="0.15"
          stroke="#6ee7b7"
          strokeWidth="1"
        />
      </svg>
      <span
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: '-0.02em',
          color: 'var(--text)',
        }}
      >
        dak<span style={{ color: 'var(--accent)' }}>oppervlakte</span>
      </span>
    </div>
  )
}
