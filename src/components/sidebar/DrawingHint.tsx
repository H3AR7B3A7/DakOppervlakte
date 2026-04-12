import React from 'react'
import { Button } from '@/components/ui'

interface DrawingHintProps {
  pointCount: number
  onFinish: () => void
}

const hintText = (count: number): string => {
  if (count === 0) return 'Klik hoekpunten op de kaart.'
  if (count === 1) return '1 punt — ga verder...'
  if (count === 2) return '2 punten — nog 1 meer.'
  return `${count} punten — dubbelklik of klik hieronder.`
}

export function DrawingHint({ pointCount, onFinish }: DrawingHintProps) {
  const canFinish = pointCount >= 3

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
        ✏️ Tekenmode actief
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
        {hintText(pointCount)}
      </p>
      {canFinish && (
        <Button
          variant="accent"
          onClick={onFinish}
          style={{ padding: '7px 16px', fontSize: 12 }}
        >
          ✓ Vorm sluiten
        </Button>
      )}
    </div>
  )
}
