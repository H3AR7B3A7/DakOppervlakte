import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { DakoppervlakteApp } from '@/components/DakoppervlakteApp'

vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div data-testid="user-button" />,
  Show: ({ when, children }: { when: string; children: React.ReactNode }) =>
    when === 'signed-out' ? <>{children}</> : null,
  useUser: () => ({ user: null }),
}))

vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ count: 0 }),
    text: async () => '{"count":0}',
  } as unknown as Response)
))

describe('User opens the app for the first time', () => {
  const user = userEvent.setup()
  afterEach(() => vi.clearAllMocks())

  it('Given the app loads, then they see the header, sidebar, and map', () => {
    // Given
    render(<DakoppervlakteApp />)

    // Then
    expect(screen.getByText('oppervlakte')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /bereken uw/i })).toBeInTheDocument()
    expect(screen.getByRole('main', { name: /interactieve kaart/i })).toBeInTheDocument()
  })

  it('Given no polygons exist, then the step guide is shown', () => {
    // Given
    render(<DakoppervlakteApp />)

    // Then
    expect(screen.getByRole('list', { name: /hoe het werkt/i })).toBeInTheDocument()
  })

  it('Given the user is signed out, then sign-in and register buttons are shown', () => {
    // Given
    render(<DakoppervlakteApp />)

    // Then
    expect(screen.getByText('Aanmelden')).toBeInTheDocument()
    expect(screen.getByText('Registreren')).toBeInTheDocument()
  })

  it('Given the app loads, when user clicks start drawing, then drawing mode activates', async () => {
    // Given
    render(<DakoppervlakteApp />)

    // When
    await user.click(screen.getByRole('button', { name: /begin met tekenen/i }))

    // Then
    expect(screen.queryByRole('button', { name: /begin met tekenen/i })).not.toBeInTheDocument()
  })

  it('Given the app loads, when user types an address and searches, then the map navigates', async () => {
    // Given
    render(<DakoppervlakteApp />)

    // When
    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1, Antwerpen')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    // Then
    expect(screen.getByRole('textbox', { name: /adres/i })).toHaveValue('Meir 1, Antwerpen')
  })
})
