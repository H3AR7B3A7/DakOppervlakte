import { render, screen } from '../test-utils'
import { Header } from '@/components/Header'

vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div data-testid="user-button" />,
  Show: ({ when, children }: { when: string; children: React.ReactNode }) =>
    when === 'signed-out' ? <>{children}</> : null,
}))

describe('Header', () => {
  describe('Usage count display', () => {
    it('shows calculation count when available', () => {
      render(<Header usageCount={42} />)
      expect(screen.getByText(/42 berekeningen/)).toBeInTheDocument()
    })

    it('hides count when null', () => {
      render(<Header usageCount={null} />)
      expect(screen.queryByText(/berekeningen/)).not.toBeInTheDocument()
    })

    it('shows singular form for count of 1', () => {
      render(<Header usageCount={1} />)
      expect(screen.getByText(/1 berekening(?!en)/)).toBeInTheDocument()
    })
  })

  describe('Brand', () => {
    it('renders the logo', () => {
      render(<Header usageCount={null} />)
      expect(screen.getByText('oppervlakte')).toBeInTheDocument()
    })
  })

  describe('Authentication (signed-out state)', () => {
    it('shows sign-in button', () => {
      render(<Header usageCount={null} />)
      expect(screen.getByText('Aanmelden')).toBeInTheDocument()
    })

    it('shows register button', () => {
      render(<Header usageCount={null} />)
      expect(screen.getByText('Registreren')).toBeInTheDocument()
    })
  })
})
