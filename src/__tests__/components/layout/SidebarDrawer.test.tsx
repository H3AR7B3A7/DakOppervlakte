import { render, screen } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { SidebarDrawer } from '@/components/layout/SidebarDrawer'

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

function setDesktopViewport() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('min-width: 768px'),
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

describe('SidebarDrawer', () => {
  describe('On mobile', () => {
    beforeEach(setMobileViewport)

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
    beforeEach(setDesktopViewport)

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
