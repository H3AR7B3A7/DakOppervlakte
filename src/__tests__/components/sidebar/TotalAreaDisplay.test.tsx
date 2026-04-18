import { TotalAreaDisplay } from '@/components/sidebar/TotalAreaDisplay'
import { render, screen } from '../../test-utils'

describe('User sees the total roof area', () => {
  it('renders nothing when the total area is zero', () => {
    const { container } = render(<TotalAreaDisplay totalArea={0} polygonCount={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('displays the formatted total area', () => {
    render(<TotalAreaDisplay totalArea={123.4} polygonCount={1} />)
    // 123.4 → "123,4" in nl-BE locale
    expect(screen.getByText('123,4')).toBeInTheDocument()
    expect(screen.getByText('m²')).toBeInTheDocument()
  })

  it('shows singular label for one polygon', () => {
    render(<TotalAreaDisplay totalArea={50} polygonCount={1} />)
    expect(screen.getByText(/totale oppervlakte/i)).toBeInTheDocument()
  })

  it('shows a combined-total label with polygon count for multiple polygons', () => {
    render(<TotalAreaDisplay totalArea={200} polygonCount={3} />)
    // Updated to match nl.json key Sidebar.totalArea which is "Totale oppervlakte"
    expect(screen.getByText(/totale oppervlakte \(3\)/i)).toBeInTheDocument()
  })

  it('is accessible as a region with a label', () => {
    render(<TotalAreaDisplay totalArea={80} polygonCount={1} />)
    expect(screen.getByRole('region', { name: /totale oppervlakte/i })).toBeInTheDocument()
  })

  it('announces area updates to assistive technologies', () => {
    render(<TotalAreaDisplay totalArea={80} polygonCount={1} />)
    expect(screen.getByText('80')).toHaveAttribute('aria-live', 'polite')
  })
})
