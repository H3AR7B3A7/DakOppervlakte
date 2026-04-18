// Coverage baseline (recorded 2026-04-18, Phase 3):
//   src/components/DakoppervlakteApp.tsx — handleSearch: 77.38% lines / 87.17% branches
//   Do not let Phase 4/5 coverage drop below this baseline for handleSearch.

import userEvent from '@testing-library/user-event'
import { DakoppervlakteApp } from '@/components/DakoppervlakteApp'
import { MockGeocoder, MockMap } from '../__mocks__/googleMaps'
import { act, render, screen, waitFor } from '../test-utils'

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

type BuildingResponse = 'feature' | 'non-feature' | 'reject'

function setupFetch(opts: { history?: unknown[]; building?: BuildingResponse } = {}) {
  const history = opts.history ?? []
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
    if (url.includes('/api/building-polygon')) {
      if (opts.building === 'feature') {
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [4.4, 51.1],
                [4.41, 51.1],
                [4.41, 51.11],
                [4.4, 51.1],
              ],
            ],
          },
        }
        return Promise.resolve({
          ok: true,
          json: async () => feature,
          text: async () => JSON.stringify(feature),
        })
      }
      if (opts.building === 'reject') {
        return Promise.reject(new Error('network down'))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ error: 'not found' }),
        text: async () => '{"error":"not found"}',
      })
    }
    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => '{}' })
  })
}

function wireGeocoder() {
  const geocoder = MockGeocoder.mock.results[MockGeocoder.mock.results.length - 1].value
  geocoder.geocode.mockImplementation(
    (_req: unknown, cb: (results: unknown[], status: string) => void) => {
      cb([{ geometry: { location: { lat: () => 51.1, lng: () => 4.4 } } }], 'OK')
    },
  )
  return geocoder
}

function getMapInstance() {
  return MockMap.mock.results[MockMap.mock.results.length - 1].value
}

function countFetchCalls(predicate: (url: string, init?: RequestInit) => boolean) {
  return fetchMock.mock.calls.filter(([url, init]) =>
    typeof url === 'string' ? predicate(url, init as RequestInit | undefined) : false,
  ).length
}

beforeEach(() => {
  mockUserRef.current = null
  localStorage.clear()
})
afterEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('handleSearch: auto-generate ON and the building lookup succeeds', () => {
  it('adds an auto polygon, increments both counters, collapses form, closes drawer', async () => {
    setupFetch({ building: 'feature' })
    const user = userEvent.setup()
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1, Antwerpen')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      expect(
        countFetchCalls((u, init) => u.includes('/api/counter') && init?.method === 'POST'),
      ).toBeGreaterThanOrEqual(1)
    })
    await waitFor(() => {
      expect(
        countFetchCalls((u, init) => u.includes('/api/autogen-counter') && init?.method === 'POST'),
      ).toBe(1)
    })
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /totale oppervlakte/i })).toBeInTheDocument()
    })
    expect(screen.queryByRole('textbox', { name: /adres/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nieuwe zoekopdracht/i })).toBeInTheDocument()
  })
})

describe('handleSearch: auto-generate ON and the response is not a Feature', () => {
  it('does not add a polygon, starts drawing after 600ms, skips the autogen counter', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    setupFetch({ building: 'non-feature' })
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Unknown 99')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      expect(countFetchCalls((u) => u.includes('/api/building-polygon'))).toBeGreaterThan(0)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.getByText(/tekenmode actief/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /totale oppervlakte/i })).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(
      countFetchCalls((u, init) => u.includes('/api/autogen-counter') && init?.method === 'POST'),
    ).toBe(0)
  })
})

describe('handleSearch: auto-generate ON and the building lookup rejects', () => {
  it('falls back to the same drawing path as a non-Feature response', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    setupFetch({ building: 'reject' })
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      expect(countFetchCalls((u) => u.includes('/api/building-polygon'))).toBeGreaterThan(0)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.getByText(/tekenmode actief/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /totale oppervlakte/i })).not.toBeInTheDocument()

    expect(
      countFetchCalls((u, init) => u.includes('/api/autogen-counter') && init?.method === 'POST'),
    ).toBe(0)
  })
})

describe('handleSearch: auto-generate OFF', () => {
  it('skips the building-polygon fetch and starts drawing after 600ms', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    setupFetch()
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    const autoGenCheckbox = screen.getByRole('checkbox', { name: /automatisch dakoppervlak/i })
    await user.click(autoGenCheckbox)
    expect(autoGenCheckbox).not.toBeChecked()

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.getByText(/tekenmode actief/i)).toBeInTheDocument()

    expect(countFetchCalls((u) => u.includes('/api/building-polygon'))).toBe(0)
    expect(
      countFetchCalls((u, init) => u.includes('/api/autogen-counter') && init?.method === 'POST'),
    ).toBe(0)
  })
})

describe('handleRestore: restoring a search from history', () => {
  it('populates the address, restores polygons after 500ms, collapses form, closes drawer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockUserRef.current = { id: 'user_123' }
    setupFetch({
      history: [
        {
          id: 1,
          address: 'Grote Markt 1, Brussel',
          area_m2: 250,
          created_at: '2025-01-01',
          polygons: [
            {
              id: 'p1',
              label: 'Dak A',
              area: 250,
              path: [
                { lat: 51.1, lng: 4.4 },
                { lat: 51.2, lng: 4.5 },
                { lat: 51.15, lng: 4.6 },
              ],
              heading: 0,
              tilt: 0,
            },
          ],
        },
      ],
    })
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    await waitFor(() => {
      expect(screen.getByText('Grote Markt 1, Brussel')).toBeInTheDocument()
    })

    await user.click(screen.getByTitle('Deze zoekopdracht herstellen'))

    await waitFor(() => {
      expect(screen.getAllByText('Grote Markt 1, Brussel').length).toBeGreaterThan(0)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    expect(screen.getAllByText('Dak A').length).toBeGreaterThan(0)

    expect(screen.queryByRole('textbox', { name: /adres/i })).not.toBeInTheDocument()
  })
})

// Guards the shared prelude: handleSearch must geocode + call map.setCenter before any branch runs.
describe('Map integration sanity — the map actually receives a navigation', () => {
  it('calls setCenter on the map for any successful search', async () => {
    setupFetch({ building: 'feature' })
    const user = userEvent.setup()
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())
    wireGeocoder()

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      expect(getMapInstance().setCenter).toHaveBeenCalled()
    })
  })
})
