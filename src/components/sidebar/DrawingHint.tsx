import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui'

interface DrawingHintProps {
  pointCount: number
  onFinish: () => void
}

export function DrawingHint({ pointCount, onFinish }: DrawingHintProps) {
  const t = useTranslations('Drawing')
  const canFinish = pointCount >= 3

  const getHintText = () => {
    if (pointCount === 0) return t('hint0')
    if (pointCount === 1) return t('hint1')
    if (pointCount === 2) return t('hint2')
    return t('hintN', { count: pointCount })
  }

  return (
    <div
      role="status"
      style={{
        background: 'rgba(110,231,183,0.08)',
        border: '1px solid rgba(110,231,183,0.3)',
        borderRadius: 10,
        padding: 14,
        marginBottom: 16,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          color: 'var(--accent)',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        {t('modeActive')}
      </p>
      <p
        aria-live="polite"
        style={{
          color: 'var(--text-muted)',
          fontSize: 12,
          lineHeight: 1.5,
          marginBottom: canFinish ? 10 : 0,
        }}
      >
        {getHintText()}
      </p>
      {canFinish && (
        <Button variant="accent" onClick={onFinish} style={{ padding: '7px 16px', fontSize: 12 }}>
          {t('closeShape')}
        </Button>
      )}
    </div>
  )
}
