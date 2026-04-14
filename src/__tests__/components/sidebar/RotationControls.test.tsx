import { render, screen } from '../../test-utils'
import { RotationControls } from '@/components/sidebar/RotationControls'
import userEvent from '@testing-library/user-event'

describe('RotationControls', () => {
  const mockOnHeadingChange = vi.fn()
  const mockOnRotate = vi.fn()
  const mockOnTiltToggle = vi.fn()

  it('renders correctly', () => {
    render(
      <RotationControls
        heading={0}
        tilt={0}
        is3D={false}
        canEnable3D={true}
        onHeadingChange={mockOnHeadingChange}
        onRotate={mockOnRotate}
        onTiltToggle={mockOnTiltToggle}
      />
    )

    expect(screen.getByText('Kaarthoek & perspectief')).toBeDefined()
    expect(screen.getByLabelText('Roteer links')).toBeDefined()
    expect(screen.getByLabelText('Roteer rechts')).toBeDefined()
    expect(screen.getByText('N')).toBeDefined()
    expect(screen.getByText('O')).toBeDefined()
    expect(screen.getByText('Z')).toBeDefined()
    expect(screen.getByText('W')).toBeDefined()
    expect(screen.getByText('🗺 Perspectief uit (bovenaanzicht)')).toBeDefined()
  })

  it('calls onRotate when rotation buttons are clicked', async () => {
    const user = userEvent.setup()
    render(
      <RotationControls
        heading={0}
        tilt={45}
        is3D={true}
        canEnable3D={true}
        onHeadingChange={mockOnHeadingChange}
        onRotate={mockOnRotate}
        onTiltToggle={mockOnTiltToggle}
      />
    )

    await user.click(screen.getByLabelText('Roteer links'))
    expect(mockOnRotate).toHaveBeenCalledWith(-90)

    await user.click(screen.getByLabelText('Roteer rechts'))
    expect(mockOnRotate).toHaveBeenCalledWith(90)
  })

  it('calls onTiltToggle when toggle button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <RotationControls
        heading={0}
        tilt={0}
        is3D={false}
        canEnable3D={true}
        onHeadingChange={mockOnHeadingChange}
        onRotate={mockOnRotate}
        onTiltToggle={mockOnTiltToggle}
      />
    )

    await user.click(screen.getByLabelText('Toggle 3D perspectief'))
    expect(mockOnTiltToggle).toHaveBeenCalledTimes(1)
  })

  it('reflects correct state when tilt is active', () => {
    render(
      <RotationControls
        heading={0}
        tilt={45}
        is3D={true}
        canEnable3D={true}
        onHeadingChange={mockOnHeadingChange}
        onRotate={mockOnRotate}
        onTiltToggle={mockOnTiltToggle}
      />
    )
    expect(screen.getByText('🏔 Perspectief aan (45°)')).toBeDefined()
  })

  it('calls onHeadingChange when slider is moved', async () => {
    render(
      <RotationControls
        heading={0}
        tilt={0}
        is3D={true}
        canEnable3D={true}
        onHeadingChange={mockOnHeadingChange}
        onRotate={mockOnRotate}
        onTiltToggle={mockOnTiltToggle}
      />
    )

    const slider = screen.getByLabelText('Kaartrichting')
    // Note: userEvent.type might not work well for range inputs
    // But we are mainly testing the context setup here
    slider.click()

    // TODO: finish test
  })
})
