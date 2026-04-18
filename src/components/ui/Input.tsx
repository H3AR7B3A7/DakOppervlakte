import type React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, style, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            fontFamily: 'Syne, sans-serif',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          background: 'var(--surface2)',
          border: `1px solid ${error ? '#f87171' : 'var(--border)'}`,
          borderRadius: 8,
          color: 'var(--text)',
          padding: '10px 14px',
          fontSize: 14,
          outline: 'none',
          width: '100%',
          ...style,
        }}
        {...rest}
      />
      {error && (
        <p role="alert" style={{ color: '#f87171', fontSize: 12 }}>
          {error}
        </p>
      )}
      <style>{`
        input::placeholder { color: var(--text-muted); }
        input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 2px rgba(110,231,183,0.15); }
      `}</style>
    </div>
  )
}
