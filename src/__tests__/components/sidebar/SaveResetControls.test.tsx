import { render, screen } from '../../test-utils'
import { SaveResetControls } from '@/components/sidebar/SaveResetControls'
import userEvent from '@testing-library/user-event'

describe('SaveResetControls', () => {
  const mockOnSave = vi.fn()
  const mockOnReset = vi.fn()

  it('renders correctly when unsaved and signed out', () => {
    render(
      <SaveResetControls
        saved={false}
        isSignedIn={false}
        onSave={mockOnSave}
        onReset={mockOnReset}
      />
    )

    expect(screen.queryByText('💾 Opslaan in geschiedenis')).toBeNull()
    expect(screen.getByText('Alles wissen')).toBeDefined()
  })

  it('renders correctly when saved and signed in', () => {
    render(
      <SaveResetControls
        saved={true}
        isSignedIn={true}
        onSave={mockOnSave}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText('✓ Opgeslagen')).toBeDefined()
    expect(screen.queryByText('💾 Opslaan in geschiedenis')).toBeNull()
  })

  it('calls onSave when save button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SaveResetControls
        saved={false}
        isSignedIn={true}
        onSave={mockOnSave}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('💾 Opslaan in geschiedenis'))
    expect(mockOnSave).toHaveBeenCalledTimes(1)
  })

  it('calls onReset when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SaveResetControls
        saved={false}
        isSignedIn={false}
        onSave={mockOnSave}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('Alles wissen'))
    expect(mockOnReset).toHaveBeenCalledTimes(1)
  })

  it('shows user is signed in', () => {
    render(
      <SaveResetControls
        saved={false}
        isSignedIn={true}
        onSave={mockOnSave}
        onReset={mockOnReset}
      />
    )
    expect(screen.getByText('💾 Opslaan in geschiedenis')).toBeDefined()
  })
})
