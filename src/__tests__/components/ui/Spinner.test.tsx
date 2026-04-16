import { render, screen } from '../../test-utils'
import { Spinner } from '@/components/ui/Spinner'

describe('User sees a loading indicator', () => {
  it('Given content is loading, then a spinner is shown at default size', () => {
    // Given
    render(<Spinner />)

    // Then
    const spinner = screen.getByRole('status', { name: /laden/i })
    expect(spinner).toBeInTheDocument()
    expect(spinner.style.width).toBe('40px')
  })

  it('Given a custom size is specified, then the spinner matches that size', () => {
    // Given
    render(<Spinner size={24} />)

    // Then
    const spinner = screen.getByRole('status', { name: /laden/i })
    expect(spinner.style.width).toBe('24px')
    expect(spinner.style.height).toBe('24px')
  })
})
