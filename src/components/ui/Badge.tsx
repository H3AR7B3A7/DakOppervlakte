import type React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'accent' | 'muted'
}

export function Badge({ children, variant = 'accent' }: BadgeProps) {
  return (
    <span
      style={{
        fontSize: 12,
        fontFamily: 'Syne, sans-serif',
        fontWeight: 600,
        color: variant === 'accent' ? 'var(--accent)' : 'var(--text-muted)',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}
