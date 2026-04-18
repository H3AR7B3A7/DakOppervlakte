'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui'

interface SaveResetControlsProps {
  saved: boolean
  isSignedIn: boolean
  onSave: () => void
  onReset: () => void
}

export function SaveResetControls({ saved, isSignedIn, onSave, onReset }: SaveResetControlsProps) {
  const t = useTranslations()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {isSignedIn &&
        (!saved ? (
          <Button variant="accent" fullWidth onClick={onSave}>
            {t('Sidebar.saveToHistory')}
          </Button>
        ) : (
          <div
            role="status"
            aria-live="polite"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              color: 'var(--accent)',
              padding: 11,
              fontSize: 13,
              textAlign: 'center',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
            }}
          >
            ✓ {t('Common.saved')}
          </div>
        ))}

      <Button variant="ghost" fullWidth onClick={onReset} style={{ fontSize: 12 }}>
        {t('Sidebar.clearAll')}
      </Button>
    </div>
  )
}
