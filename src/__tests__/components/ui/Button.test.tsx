import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Zoeken</Button>)
    expect(screen.getByRole('button', { name: 'Zoeken' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Klik mij</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const handler = vi.fn()
    render(
      <Button disabled onClick={handler}>
        Geblokkeerd
      </Button>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('is visually dimmed when disabled', () => {
    render(<Button disabled>Geblokkeerd</Button>)
    expect(screen.getByRole('button')).toHaveStyle({ opacity: '0.5' })
  })
})
