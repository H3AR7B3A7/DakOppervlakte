import { useTranslations } from 'next-intl'
import type React from 'react'

interface MapOverlayControlsProps {
  is3D: boolean
  canEnable3D: boolean
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
  is3D,
  canEnable3D,
  onRotateLeft,
  onRotateRight,
  onResetHeading,
  onTiltToggle,
}: MapOverlayControlsProps) {
  const t = useTranslations('Map')

  const rotationDisabled = !is3D
  const disabledRotationBtn: React.CSSProperties = {
    ...overlayBtn,
    opacity: 0.35,
    cursor: 'not-allowed',
  }

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
      <button
        onClick={rotationDisabled ? undefined : onRotateLeft}
        disabled={rotationDisabled}
        aria-label={t('rotateLeftAriaLabel')}
        style={rotationDisabled ? disabledRotationBtn : overlayBtn}
      >
        ↺
      </button>

      <button
        onClick={rotationDisabled ? undefined : onResetHeading}
        disabled={rotationDisabled}
        aria-label={t('resetHeadingAriaLabel')}
        style={{
          ...(rotationDisabled ? disabledRotationBtn : overlayBtn),
          color: 'var(--text-muted)',
          fontSize: 11,
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
        }}
      >
        N
      </button>

      <button
        onClick={rotationDisabled ? undefined : onRotateRight}
        disabled={rotationDisabled}
        aria-label={t('rotateRightAriaLabel')}
        style={rotationDisabled ? disabledRotationBtn : overlayBtn}
      >
        ↻
      </button>

      <button
        onClick={onTiltToggle}
        disabled={!canEnable3D && !is3D}
        aria-label={t('tiltAriaLabel')}
        aria-pressed={is3D}
        title={!canEnable3D && !is3D ? t('tiltZoomRequiredTooltip') : undefined}
        style={{
          ...overlayBtn,
          background: is3D ? 'rgba(110,231,183,0.2)' : 'rgba(17,17,24,0.9)',
          border: `1px solid ${is3D ? 'rgba(110,231,183,0.5)' : 'var(--border)'}`,
          color: is3D ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: 14,
          opacity: !canEnable3D && !is3D ? 0.35 : 1,
          cursor: !canEnable3D && !is3D ? 'not-allowed' : 'pointer',
        }}
      >
        3D
      </button>
    </div>
  )
}
