import type React from 'react'

type Variant = 'accent' | 'outline' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

export function Button({
  variant = 'accent',
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn--${variant}`]
  if (fullWidth) classes.push('btn--full-width')
  if (className) classes.push(className)
  return (
    <button {...rest} className={classes.join(' ')}>
      {children}
    </button>
  )
}
