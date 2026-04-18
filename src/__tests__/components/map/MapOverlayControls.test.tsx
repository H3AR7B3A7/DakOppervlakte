import userEvent from '@testing-library/user-event'
import { MapOverlayControls } from '@/components/map/MapOverlayControls'
import { render, screen } from '../../test-utils'

describe('User interacts with map overlay controls', () => {
  const user = userEvent.setup()

  const defaults = {
    is3D: false,
    canEnable3D: true,
    onRotateLeft: vi.fn(),
    onRotateRight: vi.fn(),
    onResetHeading: vi.fn(),
    onTiltToggle: vi.fn(),
  }

  afterEach(() => vi.clearAllMocks())

  describe('When 3D mode is off', () => {
    it('Given 2D mode, then rotation buttons are disabled', () => {
      // Given
      render(<MapOverlayControls {...defaults} is3D={false} />)

      // Then
      expect(screen.getByRole('button', { name: /roteer kaart links/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /roteer kaart rechts/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /reset kaartrichting/i })).toBeDisabled()
    })

    it('Given 2D mode, when user clicks a disabled rotation button, then nothing happens', async () => {
      // Given
      render(<MapOverlayControls {...defaults} is3D={false} />)

      // When
      await user.click(screen.getByRole('button', { name: /roteer kaart links/i }))

      // Then
      expect(defaults.onRotateLeft).not.toHaveBeenCalled()
    })
  })

  describe('When 3D mode is on', () => {
    it('Given 3D mode, then rotation buttons are enabled', () => {
      // Given
      render(<MapOverlayControls {...defaults} is3D={true} />)

      // Then
      expect(screen.getByRole('button', { name: /roteer kaart links/i })).toBeEnabled()
      expect(screen.getByRole('button', { name: /roteer kaart rechts/i })).toBeEnabled()
    })

    it('Given 3D mode, when user clicks rotate left, then the map rotates left', async () => {
      // Given
      render(<MapOverlayControls {...defaults} is3D={true} />)

      // When
      await user.click(screen.getByRole('button', { name: /roteer kaart links/i }))

      // Then
      expect(defaults.onRotateLeft).toHaveBeenCalledOnce()
    })

    it('Given 3D mode, when user clicks rotate right, then the map rotates right', async () => {
      // Given
      render(<MapOverlayControls {...defaults} is3D={true} />)

      // When
      await user.click(screen.getByRole('button', { name: /roteer kaart rechts/i }))

      // Then
      expect(defaults.onRotateRight).toHaveBeenCalledOnce()
    })

    it('Given 3D mode, when user clicks north button, then heading resets', async () => {
      // Given
      render(<MapOverlayControls {...defaults} is3D={true} />)

      // When
      await user.click(screen.getByRole('button', { name: /reset kaartrichting/i }))

      // Then
      expect(defaults.onResetHeading).toHaveBeenCalledOnce()
    })
  })

  describe('3D toggle button', () => {
    it('Given zoom is high enough, when user clicks 3D toggle, then perspective changes', async () => {
      // Given
      render(<MapOverlayControls {...defaults} canEnable3D={true} />)

      // When
      await user.click(screen.getByRole('button', { name: /toggle 3d/i }))

      // Then
      expect(defaults.onTiltToggle).toHaveBeenCalledOnce()
    })

    it('Given zoom is too low, then 3D toggle is disabled', () => {
      // Given
      render(<MapOverlayControls {...defaults} canEnable3D={false} is3D={false} />)

      // Then
      expect(screen.getByRole('button', { name: /toggle 3d/i })).toBeDisabled()
    })

    it('Given 3D is active, then the toggle shows pressed state', () => {
      // Given
      render(<MapOverlayControls {...defaults} is3D={true} />)

      // Then
      expect(screen.getByRole('button', { name: /toggle 3d/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
  })
})
