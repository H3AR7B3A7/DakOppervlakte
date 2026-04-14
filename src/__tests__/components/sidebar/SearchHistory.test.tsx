import { render, screen, fireEvent } from '../../test-utils'
import { SearchHistory } from '@/components/sidebar/SearchHistory'
import type { Search } from '@/lib/types'
import { vi } from 'vitest'

const ENTRIES: Search[] = [
  {
    address: 'Meir 1, Antwerpen',
    area_m2: 45.5,
    created_at: '2024-01-01T00:00:00Z',
    polygons: [{ id: '1', label: 'Vlak 1', area: 45.5, path: [] }],
  },
  {
    address: 'Grote Markt 2, Gent',
    area_m2: 120,
    created_at: '2024-01-02T00:00:00Z',
  },
]

describe('User views their search history', () => {
  const onRestore = vi.fn()

  it('renders nothing when history is empty', () => {
    const { container } = render(<SearchHistory history={[]} onRestore={onRestore} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the address of each history entry', () => {
    render(<SearchHistory history={ENTRIES} onRestore={onRestore} />)
    expect(screen.getByText('Meir 1, Antwerpen')).toBeInTheDocument()
    expect(screen.getByText('Grote Markt 2, Gent')).toBeInTheDocument()
  })

  it('shows the formatted area for each entry', () => {
    render(<SearchHistory history={ENTRIES} onRestore={onRestore} />)
    expect(screen.getByText(/45,5 m²/)).toBeInTheDocument()
    expect(screen.getByText(/120 m²/)).toBeInTheDocument()
  })

  it('is accessible as a navigation landmark', () => {
    render(<SearchHistory history={ENTRIES} onRestore={onRestore} />)
    expect(screen.getByRole('navigation', { name: /zoekgeschiedenis/i })).toBeInTheDocument()
  })

  it('calls onRestore with the full search object when clicked', () => {
    render(<SearchHistory history={ENTRIES} onRestore={onRestore} />)
    fireEvent.click(screen.getByText('Meir 1, Antwerpen'))
    expect(onRestore).toHaveBeenCalledWith(ENTRIES[0])
  })
})
