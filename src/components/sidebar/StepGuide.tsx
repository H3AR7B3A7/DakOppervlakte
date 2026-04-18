import { useTranslations } from 'next-intl'

export function StepGuide() {
  const t = useTranslations('StepGuide')

  const STEPS = [t('step1'), t('step2'), t('step3'), t('step4')] as const

  return (
    <ol
      aria-label={t('title')}
      style={{
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        color: 'var(--text-muted)',
        fontSize: 13,
        marginTop: 4,
      }}
    >
      {STEPS.map((text, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span
            aria-hidden="true"
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent)',
              flexShrink: 0,
              fontFamily: 'Syne, sans-serif',
            }}
          >
            {i + 1}
          </span>
          <span style={{ paddingTop: 2 }}>{text}</span>
        </li>
      ))}
    </ol>
  )
}
