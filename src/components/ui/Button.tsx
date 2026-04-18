import type React from 'react'

type Variant = 'accent' | 'outline' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  accent: {
    background: 'var(--accent)',
    border: 'none',
    color: '#000',
    fontWeight: 600,
  },
  outline: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
  },
  ghost: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
  },
}

export function Button({
  variant = 'accent',
  fullWidth = false,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontFamily: 'Syne, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'opacity 0.15s',
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}
