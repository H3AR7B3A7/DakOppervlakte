import { useFormatter, useTranslations } from 'next-intl'

interface TotalAreaDisplayProps {
  totalArea: number
  polygonCount: number
}

export function TotalAreaDisplay({ totalArea, polygonCount }: TotalAreaDisplayProps) {
  const t = useTranslations('Sidebar')
  const format = useFormatter()

  if (totalArea === 0) return null

  return (
    <section
      aria-label={t('totalArea')}
      style={{
        background: 'rgba(110,231,183,0.08)',
        border: '1px solid rgba(110,231,183,0.3)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 16,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: 'Syne, sans-serif',
          marginBottom: 4,
        }}
      >
        {polygonCount > 1 ? `${t('totalArea')} (${polygonCount})` : t('totalArea')}
      </p>
      <p
        aria-live="polite"
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 44,
          color: 'var(--accent)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        {format.number(totalArea, { maximumFractionDigits: 1 })}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{t('unit')}</p>
    </section>
  )
}
