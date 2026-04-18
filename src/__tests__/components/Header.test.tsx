import userEvent from '@testing-library/user-event'
import { Header } from '@/components/Header'
import { render, screen } from '../test-utils'

vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div data-testid="user-button" />,
  Show: ({ when, children }: { when: string; children: React.ReactNode }) =>
    when === 'signed-out' ? <>{children}</> : null,
}))

describe('Header', () => {
  describe('Usage count display', () => {
    it('shows the boast with both counts when searches exist', () => {
      render(<Header usageCount={42} autogenCount={7} />)
      expect(screen.getByText(/7 van 42 daken in één klik/)).toBeInTheDocument()
    })

    it('hides the boast when search count is zero', () => {
      render(<Header usageCount={0} />)
      expect(screen.queryByText(/in één klik/)).not.toBeInTheDocument()
    })

    it('shows the boast with a zero autogen count', () => {
      render(<Header usageCount={5} autogenCount={0} />)
      expect(screen.getByText(/0 van 5 daken in één klik/)).toBeInTheDocument()
    })

    it('treats a missing autogen count as zero', () => {
      render(<Header usageCount={5} />)
      expect(screen.getByText(/0 van 5 daken in één klik/)).toBeInTheDocument()
    })
  })

  describe('Brand', () => {
    it('renders the logo', () => {
      render(<Header usageCount={0} />)
      expect(screen.getAllByText('oppervlakte').length).toBeGreaterThan(0)
    })
  })

  describe('Authentication (signed-out state)', () => {
    it('shows sign-in button', () => {
      render(<Header usageCount={0} />)
      expect(screen.getByText('Aanmelden')).toBeInTheDocument()
    })

    it('shows register button', () => {
      render(<Header usageCount={0} />)
      expect(screen.getByText('Registreren')).toBeInTheDocument()
    })
  })

  describe('Mobile menu button', () => {
    it('renders the hamburger when onMenuClick is provided', () => {
      render(<Header usageCount={0} onMenuClick={vi.fn()} drawerOpen={false} />)
      const btn = screen.getByRole('button', { name: /menu openen/i })
      expect(btn).toBeInTheDocument()
      expect(btn).toHaveAttribute('aria-expanded', 'false')
    })

    it('omits the hamburger when onMenuClick is not provided', () => {
      render(<Header usageCount={0} />)
      expect(screen.queryByRole('button', { name: /menu openen/i })).not.toBeInTheDocument()
    })

    it('reflects drawerOpen via aria-expanded and uses the close label when open', () => {
      render(<Header usageCount={0} onMenuClick={vi.fn()} drawerOpen={true} />)
      const btn = screen.getByRole('button', { name: /menu sluiten/i })
      expect(btn).toHaveAttribute('aria-expanded', 'true')
    })

    it('calls onMenuClick when tapped', async () => {
      const onMenuClick = vi.fn()
      render(<Header usageCount={0} onMenuClick={onMenuClick} drawerOpen={false} />)
      await userEvent.click(screen.getByRole('button', { name: /menu openen/i }))
      expect(onMenuClick).toHaveBeenCalledTimes(1)
    })
  })
})
