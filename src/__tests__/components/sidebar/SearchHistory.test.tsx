import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchHistory } from '@/components/sidebar/SearchHistory'
import type { Search } from '@/lib/types'

const ENTRIES: Search[] = [
  { address: 'Meir 1, Antwerpen', area_m2: 45.5, created_at: '2024-01-01T00:00:00Z' },
  { address: 'Grote Markt 2, Gent', area_m2: 120, created_at: '2024-01-02T00:00:00Z' },
]

describe('User views their search history', () => {
  it('renders nothing when history is empty', () => {
    const { container } = render(<SearchHistory history={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the address of each history entry', () => {
    render(<SearchHistory history={ENTRIES} />)
    expect(screen.getByText('Meir 1, Antwerpen')).toBeInTheDocument()
    expect(screen.getByText('Grote Markt 2, Gent')).toBeInTheDocument()
  })

  it('shows the formatted area for each entry', () => {
    render(<SearchHistory history={ENTRIES} />)
    expect(screen.getByText(/45,5 m²/)).toBeInTheDocument()
    expect(screen.getByText(/120 m²/)).toBeInTheDocument()
  })

  it('is accessible as a navigation landmark', () => {
    render(<SearchHistory history={ENTRIES} />)
    expect(screen.getByRole('navigation', { name: /zoekgeschiedenis/i })).toBeInTheDocument()
  })
})
