import { DrawingHint } from '@/components/sidebar/DrawingHint'
import { render, screen } from '../../test-utils'

describe('User draws a polygon', () => {
  it('tells the user to place points when none have been placed', () => {
    render(<DrawingHint pointCount={0} onFinish={vi.fn()} />)
    expect(screen.getByText(/klik hoekpunten op de kaart/i)).toBeInTheDocument()
  })

  it('shows tekenmode is active', () => {
    render(<DrawingHint pointCount={0} onFinish={vi.fn()} />)
    expect(screen.getByText(/tekenmode actief/i)).toBeInTheDocument()
  })

  it('shows the number of placed points', () => {
    render(<DrawingHint pointCount={5} onFinish={vi.fn()} />)
    expect(screen.getByText(/5 punten/i)).toBeInTheDocument()
  })

  it('does not offer a finish button with fewer than 3 points', () => {
    render(<DrawingHint pointCount={2} onFinish={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /vorm sluiten/i })).not.toBeInTheDocument()
  })

  it('offers a finish button once 3 points are placed', () => {
    render(<DrawingHint pointCount={3} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /vorm sluiten/i })).toBeInTheDocument()
  })

  it('calls onFinish when the finish button is clicked', () => {
    const onFinish = vi.fn()
    render(<DrawingHint pointCount={3} onFinish={onFinish} />)
    screen.getByRole('button', { name: /vorm sluiten/i }).click()
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('announces drawing state to assistive technologies', () => {
    render(<DrawingHint pointCount={1} onFinish={vi.fn()} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
