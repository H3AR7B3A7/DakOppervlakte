import { useTranslations } from 'next-intl'

export function IdleHint() {
  const t = useTranslations('Map')

  return (
    <div
      role="status"
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        borderRadius: 10,
        padding: '10px 16px',
        border: '1px solid rgba(110,231,183,0.25)',
        color: 'var(--accent)',
        fontSize: 13,
        fontFamily: 'Syne, sans-serif',
        fontWeight: 600,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {t('idleOverlayHint')}
    </div>
  )
}
