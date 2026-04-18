interface SpinnerProps {
  size?: number
}

export function Spinner({ size = 40 }: SpinnerProps) {
  return (
    <>
      <div
        role="status"
        aria-label="Laden..."
        style={{
          width: size,
          height: size,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          flexShrink: 0,
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
