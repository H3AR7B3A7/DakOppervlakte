'use client'

import { useTranslations } from 'next-intl'
import type { CSSProperties } from 'react'

interface RotationControlsProps {
  heading: number
  tilt: number
  is3D: boolean
  canEnable3D: boolean
  onHeadingChange: (heading: number) => void
  onRotate: (delta: number) => void
  onTiltToggle: () => void
}

export function RotationControls({
  heading,
  tilt,
  is3D,
  canEnable3D,
  onHeadingChange,
  onRotate,
  onTiltToggle,
}: RotationControlsProps) {
  const t = useTranslations('Sidebar')

  const iconButtonStyle: CSSProperties = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 7,
    color: is3D ? 'var(--text)' : 'var(--text-muted)',
    width: 36,
    height: 36,
    fontSize: 16,
    cursor: is3D ? 'pointer' : 'not-allowed',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: is3D ? 1 : 0.4,
    transition: 'opacity 0.2s',
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
        {t('rotationTitle')}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => onRotate(-90)}
          disabled={!is3D}
          aria-label={t('rotateLeftAriaLabel')}
          style={iconButtonStyle}
        >
          ↺
        </button>

        <div style={{ flex: 1, opacity: is3D ? 1 : 0.4, transition: 'opacity 0.2s' }}>
          <input
            type="range"
            min="0"
            max="270"
            step="90"
            value={heading}
            disabled={!is3D}
            onChange={(e) => onHeadingChange(Number(e.target.value))}
            aria-label={t('mapDirectionAriaLabel')}
            style={{
              width: '100%',
              accentColor: 'var(--accent)',
              cursor: is3D ? 'pointer' : 'not-allowed',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--text-muted)',
              marginTop: 2,
              padding: '0 2px',
            }}
          >
            <span>N</span>
            <span>{t('cardinalE')}</span>
            <span>{t('cardinalS')}</span>
            <span>W</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRotate(90)}
          disabled={!is3D}
          aria-label={t('rotateRightAriaLabel')}
          style={iconButtonStyle}
        >
          ↻
        </button>
      </div>

      <button
        type="button"
        onClick={onTiltToggle}
        disabled={!canEnable3D && !is3D}
        aria-pressed={tilt === 45}
        aria-label={t('tiltAriaLabel')}
        style={{
          width: '100%',
          background: is3D ? 'rgba(110,231,183,0.15)' : 'var(--surface2)',
          border: `1px solid ${is3D ? 'rgba(110,231,183,0.5)' : 'var(--border)'}`,
          borderRadius: 7,
          color: is3D ? 'var(--accent)' : 'var(--text-muted)',
          padding: '8px',
          fontSize: 12,
          cursor: !canEnable3D && !is3D ? 'not-allowed' : 'pointer',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          opacity: !canEnable3D && !is3D ? 0.4 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {is3D ? t('tiltOn') : t('tiltOff')}
      </button>

      {!is3D && (
        <p
          style={{
            marginTop: 10,
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.4,
            fontStyle: 'italic',
          }}
        >
          {!canEnable3D ? t('tiltZoomHint') : t('rotationDisabledHint')}
        </p>
      )}
    </div>
  )
}
