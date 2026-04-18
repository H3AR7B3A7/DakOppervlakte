import { useTranslations } from 'next-intl'

interface DrawingOverlayProps {
  pointCount: number
  onUndo?: () => void
}

export function DrawingOverlay({ pointCount, onUndo }: DrawingOverlayProps) {
  const t = useTranslations('Map')
  const text =
    pointCount < 3
      ? t('drawingOverlayInitial', { count: pointCount })
      : t('drawingOverlayReady', { count: pointCount })

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
        padding: '10px 16px',
        border: '1px solid rgba(110,231,183,0.3)',
        color: 'var(--accent)',
        fontSize: 13,
        fontFamily: 'Syne, sans-serif',
        fontWeight: 600,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span>{text}</span>
      {onUndo && pointCount > 0 && (
        <button
          type="button"
          className="md:hidden"
          onClick={onUndo}
          aria-label={t('undoLastPoint')}
          title={t('undoLastPoint')}
          style={{
            pointerEvents: 'auto',
            background: 'rgba(110,231,183,0.15)',
            border: '1px solid rgba(110,231,183,0.4)',
            color: 'var(--accent)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 14,
            lineHeight: 1,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ↶
        </button>
      )}
    </div>
  )
}
