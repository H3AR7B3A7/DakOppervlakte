import { createRef } from 'react'
import { MapView } from '@/components/map/MapView'
import { render, screen } from '../../test-utils'

describe('User sees the map area', () => {
  it('shows a loading spinner while the map is not ready', () => {
    const mapRef = createRef<HTMLDivElement>()
    render(<MapView mapRef={mapRef} mapLoaded={false} />)

    expect(screen.getByRole('status', { name: /kaart laden/i })).toBeInTheDocument()
    expect(screen.getByText('Kaart laden...')).toBeInTheDocument()
  })

  it('hides the loading spinner once the map is ready', () => {
    const mapRef = createRef<HTMLDivElement>()
    render(<MapView mapRef={mapRef} mapLoaded={true} />)

    expect(screen.queryByRole('status', { name: /kaart laden/i })).not.toBeInTheDocument()
  })

  it('renders children only after map is loaded', () => {
    const mapRef = createRef<HTMLDivElement>()
    const { rerender } = render(
      <MapView mapRef={mapRef} mapLoaded={false}>
        <div data-testid="overlay">Overlay</div>
      </MapView>,
    )
    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument()

    rerender(
      <MapView mapRef={mapRef} mapLoaded={true}>
        <div data-testid="overlay">Overlay</div>
      </MapView>,
    )
    expect(screen.getByTestId('overlay')).toBeInTheDocument()
  })

  it('has an accessible landmark for the map area', () => {
    const mapRef = createRef<HTMLDivElement>()
    render(<MapView mapRef={mapRef} mapLoaded={true} />)
    expect(screen.getByRole('main', { name: /interactieve kaart/i })).toBeInTheDocument()
  })
})
