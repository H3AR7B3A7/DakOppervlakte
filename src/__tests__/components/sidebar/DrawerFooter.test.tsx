import { DrawerFooter } from '@/components/sidebar/DrawerFooter'
import { render, screen } from '../../test-utils'

const { mockUserRef } = vi.hoisted(() => ({
  mockUserRef: { current: null as { id: string } | null },
}))

vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Show: ({ when, children }: { when: string; children: React.ReactNode }) => {
    const isSignedIn = !!mockUserRef.current
    if (when === 'signed-in' && isSignedIn) return <>{children}</>
    if (when === 'signed-out' && !isSignedIn) return <>{children}</>
    return null
  },
}))

beforeEach(() => {
  mockUserRef.current = null
})

describe('DrawerFooter', () => {
  it('renders the stats boast when usageCount is positive', () => {
    render(<DrawerFooter usageCount={42} autogenCount={8} />)
    expect(screen.getByText(/42/)).toBeInTheDocument()
    expect(screen.getByText(/8/)).toBeInTheDocument()
  })

  it('does not render the stats boast when usageCount is null or zero', () => {
    const { rerender } = render(<DrawerFooter usageCount={null} autogenCount={null} />)
    expect(screen.queryByText(/42/)).not.toBeInTheDocument()
    rerender(<DrawerFooter usageCount={0} autogenCount={0} />)
    expect(screen.queryByText(/42/)).not.toBeInTheDocument()
  })

  it('renders sign-in and register buttons when the user is signed out', () => {
    render(<DrawerFooter usageCount={1} autogenCount={0} />)
    expect(screen.getByText(/aanmelden/i)).toBeInTheDocument()
    expect(screen.getByText(/registreren/i)).toBeInTheDocument()
  })

  it('hides sign-in and register buttons when the user is signed in', () => {
    mockUserRef.current = { id: 'u_1' }
    render(<DrawerFooter usageCount={1} autogenCount={0} />)
    expect(screen.queryByText(/aanmelden/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/registreren/i)).not.toBeInTheDocument()
  })
})
