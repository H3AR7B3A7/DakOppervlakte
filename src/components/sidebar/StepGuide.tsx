import React from 'react'

const STEPS = [
  'Typ een adres en klik →',
  'Roteer de kaart voor een beter zicht',
  'Klik "Begin met tekenen" en klik hoekpunten',
  'Voeg meerdere vlakken toe voor een totaal',
] as const

export function StepGuide() {
  return (
    <ol
      aria-label="Hoe het werkt"
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
