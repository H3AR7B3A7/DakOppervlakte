import { act, render, screen } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { PolygonChipBar } from '@/components/map/PolygonChipBar'
import type { PolygonEntry } from '@/lib/types'

function makeEntry(overrides: Partial<PolygonEntry> = {}): PolygonEntry {
  return {
    id: crypto.randomUUID(),
    label: 'Vlak 1',
    area: 42.5,
    heading: 0,
    tilt: 0,
    excluded: false,
    polygon: {
      setMap: vi.fn(),
      getPath: vi.fn(() => ({ addListener: vi.fn(), forEach: vi.fn(), push: vi.fn(), getLength: vi.fn(() => 0) })),
      get: vi.fn((key: string) => (key === 'fillColor' ? '#6ee7b7' : undefined)),
      set: vi.fn(),
    } as unknown as google.maps.Polygon,
    ...overrides,
  }
}

describe('PolygonChipBar', () => {
  it('renders nothing when there are no polygons', () => {
    const { container } = render(
      <PolygonChipBar
        polygons={[]}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleExcluded={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows one chip per polygon with label and area', () => {
    render(
      <PolygonChipBar
        polygons={[
          makeEntry({ label: 'Voordak', area: 38.2 }),
          makeEntry({ label: 'Achterdak', area: 51 }),
        ]}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleExcluded={vi.fn()}
      />,
    )
    expect(screen.getByText('Voordak')).toBeInTheDocument()
    expect(screen.getByText('Achterdak')).toBeInTheDocument()
    expect(screen.getByText(/38,2/)).toBeInTheDocument()
    expect(screen.getByText(/51/)).toBeInTheDocument()
  })

  it('shows the summed area of non-excluded polygons in the total pill', () => {
    render(
      <PolygonChipBar
        polygons={[
          makeEntry({ label: 'A', area: 40 }),
          makeEntry({ label: 'B', area: 60, excluded: true }),
          makeEntry({ label: 'C', area: 10 }),
        ]}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleExcluded={vi.fn()}
      />,
    )
    expect(screen.getByTestId('chip-bar-total')).toHaveTextContent(/50/)
  })

  it('toggles excluded when the chip is tapped', async () => {
    const onToggle = vi.fn()
    render(
      <PolygonChipBar
        polygons={[makeEntry({ id: 'x', label: 'Vlak 1' })]}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleExcluded={onToggle}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /schakel vlak vlak 1 in of uit/i }))
    expect(onToggle).toHaveBeenCalledWith('x')
  })

  it('calls onDelete when the × button is tapped', async () => {
    const onDelete = vi.fn()
    render(
      <PolygonChipBar
        polygons={[makeEntry({ id: 'x', label: 'Vlak 1' })]}
        onDelete={onDelete}
        onRename={vi.fn()}
        onToggleExcluded={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /verwijder vlak 1/i }))
    expect(onDelete).toHaveBeenCalledWith('x')
  })

  it('opens an inline rename input on long-press and commits on Enter', async () => {
    vi.useFakeTimers()
    try {
      const onRename = vi.fn()
      render(
        <PolygonChipBar
          polygons={[makeEntry({ id: 'x', label: 'Vlak 1' })]}
          onDelete={vi.fn()}
          onRename={onRename}
          onToggleExcluded={vi.fn()}
        />,
      )

      const chip = screen.getByRole('button', { name: /schakel vlak vlak 1 in of uit/i })

      // Simulate long-press: pointerdown → advance time → pointerup
      act(() => {
        chip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      act(() => {
        chip.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
      })

      const input = await screen.findByRole('textbox', { name: /hernoem vlak 1/i })
      vi.useRealTimers()

      await userEvent.clear(input)
      await userEvent.type(input, 'Nieuw label{Enter}')

      expect(onRename).toHaveBeenCalledWith('x', 'Nieuw label')
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders excluded chips with reduced opacity styling', () => {
    render(
      <PolygonChipBar
        polygons={[makeEntry({ id: 'x', label: 'Vlak 1', excluded: true })]}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleExcluded={vi.fn()}
      />,
    )
    const chip = screen.getByTestId('chip-x')
    expect(chip).toHaveStyle({ opacity: '0.5' })
  })
})
