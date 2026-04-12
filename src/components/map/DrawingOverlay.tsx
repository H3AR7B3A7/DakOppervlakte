import React from 'react'

interface DrawingOverlayProps {
  pointCount: number
}

export function DrawingOverlay({ pointCount }: DrawingOverlayProps) {
  const text =
    pointCount < 3
      ? `✏️ Klik hoekpunten aan (${pointCount} geplaatst)`
      : `✏️ ${pointCount} punten — dubbelklik om te sluiten`

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: 10,
        padding: '10px 20px',
        border: '1px solid rgba(110,231,183,0.3)',
        color: 'var(--accent)',
        fontSize: 13,
        fontFamily: 'Syne, sans-serif',
        fontWeight: 600,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  )
}
