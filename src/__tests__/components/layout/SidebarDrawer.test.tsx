import { render, screen, fireEvent } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { SidebarDrawer } from '@/components/layout/SidebarDrawer'

const originalMatchMedia = window.matchMedia

function setMatches(isMobile: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('min-width: 768px') ? !isMobile : false,
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

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('SidebarDrawer', () => {
  describe('On mobile', () => {
    beforeEach(() => setMatches(true))

    it('renders the drawer with dialog role when open', () => {
      render(
        <SidebarDrawer open={true} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
          <p>content</p>
        </SidebarDrawer>,
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('content')).toBeVisible()
    })

    it('calls onClose when the backdrop is clicked', async () => {
      const onClose = vi.fn()
      render(
        <SidebarDrawer open={true} onClose={onClose} titleId="t">
          <h2 id="t">Menu</h2>
          <p>content</p>
        </SidebarDrawer>,
      )
      await userEvent.click(screen.getByTestId('sidebar-drawer-backdrop'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Escape is pressed', async () => {
      const onClose = vi.fn()
      render(
        <SidebarDrawer open={true} onClose={onClose} titleId="t">
          <h2 id="t">Menu</h2>
          <p>content</p>
        </SidebarDrawer>,
      )
      await userEvent.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not render a backdrop when closed', () => {
      render(
        <SidebarDrawer open={false} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
          <p>content</p>
        </SidebarDrawer>,
      )
      expect(screen.queryByTestId('sidebar-drawer-backdrop')).not.toBeInTheDocument()
    })

    it('opens when the user swipes right from the left edge', () => {
      const onOpen = vi.fn()
      render(
        <SidebarDrawer open={false} onOpen={onOpen} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )

      fireEvent.touchStart(document, { touches: [{ clientX: 5, clientY: 200 }] })
      fireEvent.touchMove(document, { touches: [{ clientX: 90, clientY: 205 }] })
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 90, clientY: 205 }] })

      expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('does not open when the swipe starts away from the left edge', () => {
      const onOpen = vi.fn()
      render(
        <SidebarDrawer open={false} onOpen={onOpen} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )

      fireEvent.touchStart(document, { touches: [{ clientX: 150, clientY: 200 }] })
      fireEvent.touchMove(document, { touches: [{ clientX: 250, clientY: 205 }] })
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 250, clientY: 205 }] })

      expect(onOpen).not.toHaveBeenCalled()
    })

    it('does not open on a predominantly vertical swipe', () => {
      const onOpen = vi.fn()
      render(
        <SidebarDrawer open={false} onOpen={onOpen} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )

      fireEvent.touchStart(document, { touches: [{ clientX: 5, clientY: 200 }] })
      fireEvent.touchMove(document, { touches: [{ clientX: 25, clientY: 400 }] })
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 25, clientY: 400 }] })

      expect(onOpen).not.toHaveBeenCalled()
    })

    it('does not open on a tap near the left edge', () => {
      const onOpen = vi.fn()
      render(
        <SidebarDrawer open={false} onOpen={onOpen} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )

      fireEvent.touchStart(document, { touches: [{ clientX: 5, clientY: 200 }] })
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 6, clientY: 201 }] })

      expect(onOpen).not.toHaveBeenCalled()
    })

    it('closes when the user swipes left while open', () => {
      const onClose = vi.fn()
      render(
        <SidebarDrawer open={true} onClose={onClose} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )

      fireEvent.touchStart(document, { touches: [{ clientX: 250, clientY: 200 }] })
      fireEvent.touchMove(document, { touches: [{ clientX: 150, clientY: 205 }] })
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 150, clientY: 205 }] })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not close on a right swipe while open', () => {
      const onClose = vi.fn()
      render(
        <SidebarDrawer open={true} onClose={onClose} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )

      fireEvent.touchStart(document, { touches: [{ clientX: 100, clientY: 200 }] })
      fireEvent.touchMove(document, { touches: [{ clientX: 220, clientY: 205 }] })
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 220, clientY: 205 }] })

      expect(onClose).not.toHaveBeenCalled()
    })

    it('does not close on a predominantly vertical swipe while open', () => {
      const onClose = vi.fn()
      render(
        <SidebarDrawer open={true} onClose={onClose} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )

      fireEvent.touchStart(document, { touches: [{ clientX: 200, clientY: 100 }] })
      fireEvent.touchMove(document, { touches: [{ clientX: 180, clientY: 400 }] })
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 180, clientY: 400 }] })

      expect(onClose).not.toHaveBeenCalled()
    })

    it('does not close on a tap inside the drawer', () => {
      const onClose = vi.fn()
      render(
        <SidebarDrawer open={true} onClose={onClose} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )

      fireEvent.touchStart(document, { touches: [{ clientX: 150, clientY: 200 }] })
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 151, clientY: 201 }] })

      expect(onClose).not.toHaveBeenCalled()
    })

    it('locks body scroll when open', () => {
      const { rerender } = render(
        <SidebarDrawer open={false} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )
      expect(document.body.style.overflow).toBe('')

      rerender(
        <SidebarDrawer open={true} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )
      expect(document.body.style.overflow).toBe('hidden')

      rerender(
        <SidebarDrawer open={false} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('On desktop', () => {
    beforeEach(() => setMatches(false))

    it('renders children without backdrop or dialog role', () => {
      render(
        <SidebarDrawer open={false} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
          <p>content</p>
        </SidebarDrawer>,
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-drawer-backdrop')).not.toBeInTheDocument()
      expect(screen.getByText('content')).toBeVisible()
    })

    it('does not lock body scroll', () => {
      render(
        <SidebarDrawer open={true} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )
      expect(document.body.style.overflow).toBe('')
    })
  })
})
