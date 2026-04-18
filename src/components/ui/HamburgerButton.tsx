import React from 'react'

interface HamburgerButtonProps {
  ariaLabel: string
  onClick: () => void
  expanded: boolean
  controls?: string
  className?: string
}

export function HamburgerButton({
  ariaLabel,
  onClick,
  expanded,
  controls,
  className,
}: HamburgerButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      className={className}
      style={{
        background: 'transparent',
        border: 'none',
        width: 40,
        height: 40,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text)',
        padding: 0,
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  )
}
