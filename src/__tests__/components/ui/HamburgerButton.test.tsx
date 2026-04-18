import userEvent from '@testing-library/user-event'
import { HamburgerButton } from '@/components/ui/HamburgerButton'
import { render, screen } from '../../test-utils'

describe('HamburgerButton', () => {
  it('renders an accessible button with the given aria-label', () => {
    render(
      <HamburgerButton
        ariaLabel="Menu openen"
        onClick={vi.fn()}
        expanded={false}
        controls="drawer"
      />,
    )
    expect(screen.getByRole('button', { name: /menu openen/i })).toBeInTheDocument()
  })

  it('exposes aria-expanded and aria-controls for screen readers', () => {
    render(
      <HamburgerButton
        ariaLabel="Menu openen"
        onClick={vi.fn()}
        expanded={true}
        controls="drawer-id"
      />,
    )
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'drawer-id')
  })

  it('calls onClick when tapped', async () => {
    const onClick = vi.fn()
    render(
      <HamburgerButton
        ariaLabel="Menu openen"
        onClick={onClick}
        expanded={false}
        controls="drawer"
      />,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
