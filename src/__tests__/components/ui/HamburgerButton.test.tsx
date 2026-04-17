import { render, screen } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { HamburgerButton } from '@/components/ui/HamburgerButton'

describe('HamburgerButton', () => {
  it('renders an accessible button with the given aria-label', () => {
    render(<HamburgerButton ariaLabel="Menu openen" onClick={vi.fn()} expanded={false} controls="drawer" />)
    expect(screen.getByRole('button', { name: /menu openen/i })).toBeInTheDocument()
  })

  it('exposes aria-expanded and aria-controls for screen readers', () => {
    render(<HamburgerButton ariaLabel="Menu openen" onClick={vi.fn()} expanded={true} controls="drawer-id" />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(btn).toHaveAttribute('aria-controls', 'drawer-id')
  })

  it('calls onClick when tapped', async () => {
    const onClick = vi.fn()
    render(<HamburgerButton ariaLabel="Menu openen" onClick={onClick} expanded={false} controls="drawer" />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
