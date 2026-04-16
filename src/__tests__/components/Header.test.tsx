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
    it('shows search count when available', () => {
      render(<Header usageCount={42} />)
      expect(screen.getByText(/42 zoekopdrachten/)).toBeInTheDocument()
    })

    it('hides count when zero', () => {
      render(<Header usageCount={0} />)
      expect(screen.queryByText(/zoekopdrachten/)).not.toBeInTheDocument()
    })

    it('shows singular form for count of 1', () => {
      render(<Header usageCount={1} />)
      expect(screen.getByText(/1 zoekopdracht(?!en)/)).toBeInTheDocument()
    })
  })

  describe('Brand', () => {
    it('renders the logo', () => {
      render(<Header usageCount={0} />)
      expect(screen.getByText('oppervlakte')).toBeInTheDocument()
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
})
