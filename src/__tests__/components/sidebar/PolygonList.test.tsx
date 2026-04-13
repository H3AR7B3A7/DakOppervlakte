import { render, screen } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { PolygonList } from '@/components/sidebar/PolygonList'
import type { PolygonEntry } from '@/lib/types'

// Real stub — no vi.mock() needed. The component only uses .get('fillColor') on the polygon.
function makeEntry(overrides: Partial<PolygonEntry> = {}): PolygonEntry {
  const path = {
    addListener: vi.fn(),
    forEach: vi.fn(),
    push: vi.fn(),
    getLength: vi.fn(() => 0),
  }
  return {
    id: crypto.randomUUID(),
    label: 'Vlak 1',
    area: 42.5,
    polygon: {
      setMap: vi.fn(),
      getPath: vi.fn(() => path),
      get: vi.fn((key: string) => (key === 'fillColor' ? '#6ee7b7' : undefined)),
      set: vi.fn(),
    } as unknown as google.maps.Polygon,
    ...overrides,
  }
}

describe('User manages polygons', () => {
  it('renders nothing when there are no polygons', () => {
    const { container } = render(
      <PolygonList polygons={[]} onDelete={vi.fn()} onRename={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows each polygon label and area', () => {
    const entries = [
      makeEntry({ label: 'Voordak', area: 38.2 }),
      makeEntry({ label: 'Achterdak', area: 51.0 }),
    ]
    render(<PolygonList polygons={entries} onDelete={vi.fn()} onRename={vi.fn()} />)
    expect(screen.getByText('Voordak')).toBeInTheDocument()
    expect(screen.getByText('Achterdak')).toBeInTheDocument()
    expect(screen.getByText(/38,2 m²/)).toBeInTheDocument()
    expect(screen.getByText(/51 m²/)).toBeInTheDocument()
  })

  it('calls onDelete with the correct id when the delete button is clicked', async () => {
    const onDelete = vi.fn()
    const entry = makeEntry({ id: 'abc-123', label: 'Vlak 1' })
    render(<PolygonList polygons={[entry]} onDelete={onDelete} onRename={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /verwijder vlak 1/i }))
    expect(onDelete).toHaveBeenCalledWith('abc-123')
  })

  it('lets the user rename a polygon by clicking its label', async () => {
    const onRename = vi.fn()
    const entry = makeEntry({ id: 'xyz', label: 'Oud label' })
    render(<PolygonList polygons={[entry]} onDelete={vi.fn()} onRename={onRename} />)

    await userEvent.click(screen.getByRole('button', { name: /hernoem vlak: oud label/i }))
    const input = screen.getByRole('textbox', { name: /naam van het vlak/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'Nieuw label{Enter}')

    expect(onRename).toHaveBeenCalledWith('xyz', 'Nieuw label')
  })

  it('does not rename when the new label is empty', async () => {
    const onRename = vi.fn()
    const entry = makeEntry({ label: 'Vlak 1' })
    render(<PolygonList polygons={[entry]} onDelete={vi.fn()} onRename={onRename} />)

    await userEvent.click(screen.getByRole('button', { name: /hernoem/i }))
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.keyboard('{Enter}')

    expect(onRename).not.toHaveBeenCalled()
  })

  it('cancels editing on Escape and keeps the original label', async () => {
    const onRename = vi.fn()
    const entry = makeEntry({ label: 'Vlak 1' })
    render(<PolygonList polygons={[entry]} onDelete={vi.fn()} onRename={onRename} />)

    await userEvent.click(screen.getByRole('button', { name: /hernoem/i }))
    await userEvent.keyboard('{Escape}')

    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /hernoem vlak: vlak 1/i })).toBeInTheDocument()
  })
})
