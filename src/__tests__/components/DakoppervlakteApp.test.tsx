import { render, screen, waitFor, act } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { DakoppervlakteApp } from '@/components/DakoppervlakteApp'
import { MockMap, MockGeocoder } from '../__mocks__/googleMaps'

const { mockUserRef } = vi.hoisted(() => ({
  mockUserRef: { current: null as { id: string } | null },
}))

vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div data-testid="user-button" />,
  Show: ({ when, children }: { when: string; children: React.ReactNode }) => {
    const isSignedIn = !!mockUserRef.current
    if (when === 'signed-in' && isSignedIn) return <>{children}</>
    if (when === 'signed-out' && !isSignedIn) return <>{children}</>
    return null
  },
  useUser: () => ({ user: mockUserRef.current }),
}))

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function setupFetch(
  history: unknown[] = [],
  opts: { buildingPolygon?: unknown } = {},
) {
  fetchMock.mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method ?? 'GET'
    if (url.includes('/api/autogen-counter')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ count: method === 'POST' ? 8 : 7 }),
        text: async () => JSON.stringify({ count: method === 'POST' ? 8 : 7 }),
      })
    }
    if (url.includes('/api/counter')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ count: method === 'POST' ? 43 : 42 }),
        text: async () => JSON.stringify({ count: method === 'POST' ? 43 : 42 }),
      })
    }
    if (url.includes('/api/searches')) {
      if (method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => history,
          text: async () => JSON.stringify(history),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: 1 }),
        text: async () => '{"id":1}',
      })
    }
    if (url.includes('/api/building-polygon') && opts.buildingPolygon) {
      return Promise.resolve({
        ok: true,
        json: async () => opts.buildingPolygon,
        text: async () => JSON.stringify(opts.buildingPolygon),
      })
    }
    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => '{}' })
  })
}

function getMapInstance() {
  return MockMap.mock.results[MockMap.mock.results.length - 1].value
}

async function drawOnePolygon(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /begin met tekenen/i }))
  const map = getMapInstance()
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      map._trigger('click', {
        latLng: { lat: () => 51.1 + i * 0.01, lng: () => 4.4 + i * 0.01 },
      })
    })
  }
  await user.click(screen.getByRole('button', { name: /vorm sluiten/i }))
}

describe('User opens the app for the first time', () => {
  const user = userEvent.setup()
  beforeEach(() => {
    mockUserRef.current = null
    setupFetch()
  })
  afterEach(() => vi.clearAllMocks())

  it('Given the app loads, then they see the header, sidebar, and map', () => {
    render(<DakoppervlakteApp />)
    expect(screen.getAllByText('oppervlakte').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /bereken uw/i })).toBeInTheDocument()
    expect(screen.getByRole('main', { name: /interactieve kaart/i })).toBeInTheDocument()
  })

  it('Given no polygons exist, then the step guide is shown', () => {
    render(<DakoppervlakteApp />)
    expect(screen.getByRole('list', { name: /hoe het werkt/i })).toBeInTheDocument()
  })

  it('Given the user is signed out, then sign-in and register buttons are shown', () => {
    render(<DakoppervlakteApp />)
    expect(screen.getAllByText('Aanmelden').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Registreren').length).toBeGreaterThan(0)
  })

  it('Given the app loads, when user clicks start drawing, then drawing mode activates', async () => {
    render(<DakoppervlakteApp />)
    await user.click(screen.getByRole('button', { name: /begin met tekenen/i }))
    expect(screen.queryByRole('button', { name: /begin met tekenen/i })).not.toBeInTheDocument()
  })

  it('Given the app loads, when user types an address and searches, then the map navigates', async () => {
    render(<DakoppervlakteApp />)
    const geocoder = MockGeocoder.mock.results[MockGeocoder.mock.results.length - 1].value
    geocoder.geocode.mockImplementation(
      (_req: unknown, cb: (results: unknown[], status: string) => void) => {
        cb([{ geometry: { location: { lat: () => 51.1, lng: () => 4.4 } } }], 'OK')
      },
    )
    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1, Antwerpen')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))
    await waitFor(() => {
      expect(screen.getByText('Meir 1, Antwerpen')).toBeInTheDocument()
    })
    const map = getMapInstance()
    expect(map.setCenter).toHaveBeenCalled()
  })

  it('Given a successful search, then drawing starts automatically', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const timerUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(<DakoppervlakteApp />)

    const geocoder = MockGeocoder.mock.results[MockGeocoder.mock.results.length - 1].value
    geocoder.geocode.mockImplementation(
      (_req: unknown, cb: (results: unknown[], status: string) => void) => {
        cb([{ geometry: { location: { lat: () => 51.1, lng: () => 4.4 } } }], 'OK')
      },
    )

    await timerUser.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await timerUser.click(screen.getByRole('button', { name: /zoeken/i }))

    await act(async () => { await vi.advanceTimersByTimeAsync(700) })

    expect(screen.getByText(/tekenmode actief/i)).toBeInTheDocument()
    vi.useRealTimers()
  })
})

describe('User draws a polygon', () => {
  const user = userEvent.setup()
  beforeEach(() => {
    mockUserRef.current = null
    setupFetch()
  })
  afterEach(() => vi.clearAllMocks())

  it('Given drawing mode is active, then the drawing overlay and hint appear', async () => {
    render(<DakoppervlakteApp />)
    await user.click(screen.getByRole('button', { name: /begin met tekenen/i }))

    expect(screen.getByText(/tekenmode actief/i)).toBeInTheDocument()
    expect(screen.getByText(/klik hoekpunten aan/i)).toBeInTheDocument()
  })

  it('Given the shape is closed, then the polygon list and total area appear', async () => {
    render(<DakoppervlakteApp />)
    await drawOnePolygon(user)

    expect(screen.getAllByText('Vlak 1').length).toBeGreaterThan(0)
    expect(screen.getByRole('region', { name: /totale oppervlakte/i })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /hoe het werkt/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nog een vlak toevoegen/i })).toBeInTheDocument()
  })

  it('Given a polygon exists, when clear all is clicked, then everything resets', async () => {
    render(<DakoppervlakteApp />)
    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Test address')
    await drawOnePolygon(user)

    await user.click(screen.getByRole('button', { name: /alles wissen/i }))

    expect(screen.queryByText('Vlak 1')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /totale oppervlakte/i })).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: /hoe het werkt/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin met tekenen/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /adres/i })).toHaveValue('')
  })

  it('Given the map has loaded, then the map overlay controls are rendered', () => {
    render(<DakoppervlakteApp />)

    expect(screen.getByRole('button', { name: /roteer kaart links/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /roteer kaart rechts/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset kaartrichting naar noord/i })).toBeInTheDocument()
  })
})

describe('Signed-in user saves and views history', () => {
  const user = userEvent.setup()
  beforeEach(() => {
    mockUserRef.current = { id: 'user_123' }
    setupFetch()
  })
  afterEach(() => {
    mockUserRef.current = null
    vi.clearAllMocks()
  })

  it('Given a polygon is drawn, then the save button appears', async () => {
    render(<DakoppervlakteApp />)
    await drawOnePolygon(user)

    expect(screen.getByRole('button', { name: /opslaan in geschiedenis/i })).toBeInTheDocument()
  })

  it('Given save is clicked, then a confirmation replaces the save button', async () => {
    render(<DakoppervlakteApp />)
    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1, Antwerpen')
    await drawOnePolygon(user)

    await user.click(screen.getByRole('button', { name: /opslaan in geschiedenis/i }))

    await waitFor(() => {
      expect(screen.getByText(/opgeslagen/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /opslaan in geschiedenis/i })).not.toBeInTheDocument()
  })

  it('Given search history exists, then it is displayed', async () => {
    const history = [
      { id: 1, address: 'Grote Markt 1, Brussel', area_m2: 250, created_at: '2025-01-01' },
    ]
    setupFetch(history)
    render(<DakoppervlakteApp />)

    await waitFor(() => {
      expect(screen.getByText('Grote Markt 1, Brussel')).toBeInTheDocument()
    })
  })

  it('Given a history entry is clicked, then the address field is restored', async () => {
    const history = [
      { id: 1, address: 'Grote Markt 1, Brussel', area_m2: 250, created_at: '2025-01-01' },
    ]
    setupFetch(history)
    render(<DakoppervlakteApp />)

    await waitFor(() => {
      expect(screen.getByText('Grote Markt 1, Brussel')).toBeInTheDocument()
    })

    await user.click(screen.getByTitle('Deze zoekopdracht herstellen'))

    await waitFor(() => {
      expect(screen.getAllByText('Grote Markt 1, Brussel').length).toBeGreaterThan(0)
    })
  })

  it('Given a history entry with polygons is restored, then polygons reappear', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const timerUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    const history = [
      {
        id: 1,
        address: 'Grote Markt 1, Brussel',
        area_m2: 250,
        created_at: '2025-01-01',
        polygons: [
          { id: 'p1', label: 'Dak A', area: 250, path: [{ lat: 51.1, lng: 4.4 }, { lat: 51.2, lng: 4.5 }, { lat: 51.15, lng: 4.6 }], heading: 0, tilt: 0 },
        ],
      },
    ]
    setupFetch(history)
    render(<DakoppervlakteApp />)

    const geocoder = MockGeocoder.mock.results[MockGeocoder.mock.results.length - 1].value
    geocoder.geocode.mockImplementation(
      (_req: unknown, cb: (results: unknown[], status: string) => void) => {
        cb([{ geometry: { location: { lat: () => 51.1, lng: () => 4.4 } } }], 'OK')
      },
    )

    await waitFor(() => {
      expect(screen.getByText('Grote Markt 1, Brussel')).toBeInTheDocument()
    })

    await timerUser.click(screen.getByTitle('Deze zoekopdracht herstellen'))

    await act(async () => { await vi.advanceTimersByTimeAsync(600) })

    expect(screen.getAllByText('Dak A').length).toBeGreaterThan(0)
    vi.useRealTimers()
  })
})

describe('Successful building autogeneration', () => {
  const user = userEvent.setup()
  beforeEach(() => {
    mockUserRef.current = null
    localStorage.clear()
  })
  afterEach(() => vi.clearAllMocks())

  it('increments the autogen counter when the building lookup returns a polygon', async () => {
    setupFetch([], {
      buildingPolygon: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[4.4, 51.1], [4.41, 51.1], [4.41, 51.11], [4.4, 51.1]]],
        },
      },
    })
    render(<DakoppervlakteApp />)

    const geocoder = MockGeocoder.mock.results[MockGeocoder.mock.results.length - 1].value
    geocoder.geocode.mockImplementation(
      (_req: unknown, cb: (results: unknown[], status: string) => void) => {
        cb([{ geometry: { location: { lat: () => 51.1, lng: () => 4.4 } } }], 'OK')
      },
    )

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1, Antwerpen')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      const autogenCalls = fetchMock.mock.calls.filter(
        ([url, init]) => typeof url === 'string' && url.includes('/api/autogen-counter') && (init as RequestInit | undefined)?.method === 'POST'
      )
      expect(autogenCalls).toHaveLength(1)
    })
  })

  it('does not increment the autogen counter when the building lookup fails', async () => {
    setupFetch()
    render(<DakoppervlakteApp />)

    const geocoder = MockGeocoder.mock.results[MockGeocoder.mock.results.length - 1].value
    geocoder.geocode.mockImplementation(
      (_req: unknown, cb: (results: unknown[], status: string) => void) => {
        cb([{ geometry: { location: { lat: () => 51.1, lng: () => 4.4 } } }], 'OK')
      },
    )

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Unknown Street 99')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      const buildingCalls = fetchMock.mock.calls.filter(
        ([url]) => typeof url === 'string' && url.includes('/api/building-polygon')
      )
      expect(buildingCalls.length).toBeGreaterThan(0)
    })

    const autogenPosts = fetchMock.mock.calls.filter(
      ([url, init]) => typeof url === 'string' && url.includes('/api/autogen-counter') && (init as RequestInit | undefined)?.method === 'POST'
    )
    expect(autogenPosts).toHaveLength(0)
  })
})

describe('Responsive layout — collapsible search form', () => {
  const user = userEvent.setup()
  beforeEach(() => {
    mockUserRef.current = null
    setupFetch()
  })
  afterEach(() => vi.clearAllMocks())

  it('collapses the search form after a successful search and lets the user re-expand it', async () => {
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())

    const geocoder = MockGeocoder.mock.results[MockGeocoder.mock.results.length - 1].value
    geocoder.geocode.mockImplementation(
      (_req: unknown, cb: (results: unknown[], status: string) => void) => {
        cb([{ geometry: { location: { lat: () => 51.1, lng: () => 4.4 } } }], 'OK')
      },
    )

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: /adres/i })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /nieuwe zoekopdracht/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /nieuwe zoekopdracht/i }))
    expect(screen.getByRole('textbox', { name: /adres/i })).toBeInTheDocument()
  })
})

describe('Responsive layout — mobile drawer', () => {
  const user = userEvent.setup()

  function setMobileViewport() {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: !query.includes('min-width: 768px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })
  }

  beforeEach(() => {
    mockUserRef.current = null
    setupFetch()
    setMobileViewport()
  })
  afterEach(() => vi.clearAllMocks())

  it('shows a hamburger button that opens and closes the drawer', async () => {
    render(<DakoppervlakteApp />)

    const hamburger = screen.getByRole('button', { name: /menu openen/i })
    await user.click(hamburger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByTestId('sidebar-drawer-backdrop'))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('auto-closes the drawer after a successful search', async () => {
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())

    const geocoder = MockGeocoder.mock.results[MockGeocoder.mock.results.length - 1].value
    geocoder.geocode.mockImplementation(
      (_req: unknown, cb: (results: unknown[], status: string) => void) => {
        cb([{ geometry: { location: { lat: () => 51.1, lng: () => 4.4 } } }], 'OK')
      },
    )

    await user.click(screen.getByRole('button', { name: /menu openen/i }))
    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows polygon chips at the bottom of the map after drawing', async () => {
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())

    const geocoder = MockGeocoder.mock.results[MockGeocoder.mock.results.length - 1].value
    geocoder.geocode.mockImplementation(
      (_req: unknown, cb: (results: unknown[], status: string) => void) => {
        cb([{ geometry: { location: { lat: () => 51.1, lng: () => 4.4 } } }], 'OK')
      },
    )

    // Open drawer, search, start drawing from drawer
    await user.click(screen.getByRole('button', { name: /menu openen/i }))
    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await user.click(screen.getByRole('button', { name: /menu openen/i }))
    await user.click(screen.getByRole('button', { name: /begin met tekenen/i }))
    const map = getMapInstance()
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        map._trigger('click', {
          latLng: { lat: () => 51.1 + i * 0.01, lng: () => 4.4 + i * 0.01 },
        })
      })
    }
    // Drawer closed when drawing started — reopen to reach the finish button.
    await user.click(screen.getByRole('button', { name: /menu openen/i }))
    await user.click(screen.getByRole('button', { name: /vorm sluiten/i }))

    expect(screen.getByTestId('chip-bar-total')).toBeInTheDocument()
  })
})
