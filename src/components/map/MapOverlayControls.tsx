import React from 'react'
import { useTranslations } from 'next-intl'

interface MapOverlayControlsProps {
  tilt: number
  onRotateLeft: () => void
  onRotateRight: () => void
  onResetHeading: () => void
  onTiltToggle: () => void
}

const overlayBtn: React.CSSProperties = {
  background: 'rgba(17,17,24,0.9)',
  backdropFilter: 'blur(8px)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  width: 40,
  height: 40,
  fontSize: 18,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export function MapOverlayControls({
  tilt,
  onRotateLeft,
  onRotateRight,
  onResetHeading,
  onTiltToggle,
}: MapOverlayControlsProps) {
  const t = useTranslations('Map')

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <button onClick={onRotateLeft} aria-label={t('rotateLeftAriaLabel')} style={overlayBtn}>
        ↺
      </button>

      <button
        onClick={onResetHeading}
        aria-label={t('resetHeadingAriaLabel')}
        style={{
          ...overlayBtn,
          color: 'var(--text-muted)',
          fontSize: 11,
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
        }}
      >
        N
      </button>

      <button onClick={onRotateRight} aria-label={t('rotateRightAriaLabel')} style={overlayBtn}>
        ↻
      </button>

      <button
        onClick={onTiltToggle}
        aria-label={t('tiltAriaLabel')}
        aria-pressed={tilt === 45}
        style={{
          ...overlayBtn,
          background: tilt === 45 ? 'rgba(110,231,183,0.2)' : 'rgba(17,17,24,0.9)',
          border: `1px solid ${tilt === 45 ? 'rgba(110,231,183,0.5)' : 'var(--border)'}`,
          color: tilt === 45 ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        3D
      </button>
    </div>
  )
}
