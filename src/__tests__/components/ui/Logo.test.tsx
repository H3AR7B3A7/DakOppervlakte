import { render, screen } from '../../test-utils'
import { Logo } from '@/components/ui/Logo'

describe('User sees the app brand', () => {
  it('Given the header is visible, then the brand name is shown', () => {
    // Given
    render(<Logo />)

    // Then
    expect(screen.getByText('oppervlakte')).toBeInTheDocument()
  })

  it('Given the header is visible, then it includes a decorative logo icon', () => {
    // Given
    const { container } = render(<Logo />)

    // Then
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
