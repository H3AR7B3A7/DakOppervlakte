import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SaveResetControls } from '@/components/sidebar/SaveResetControls'
import userEvent from '@testing-library/user-event'

// Mock Clerk components
vi.mock('@clerk/nextjs', () => ({
  SignUpButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Show: ({ when, children }: { when: string; children: React.ReactNode }) => {
    // In test environment, assume we are always signed out unless explicitly mocked differently
    // For this test, we test the signed-out state
    return when === 'signed-out' ? <div>{children}</div> : null
  },
}))

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

    expect(screen.getByText('📊 Teller bijwerken')).toBeDefined()
    expect(screen.getByText('Alles wissen')).toBeDefined()
    expect(screen.getByText('Gratis registreren')).toBeDefined()
  })

  it('renders correctly when saved', () => {
    render(
      <SaveResetControls
        saved={true}
        isSignedIn={false}
        onSave={mockOnSave}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText('✓ Opgeslagen')).toBeDefined()
    expect(screen.queryByText('📊 Teller bijwerken')).toBeNull()
  })

  it('calls onSave when save button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SaveResetControls
        saved={false}
        isSignedIn={false}
        onSave={mockOnSave}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByText('📊 Teller bijwerken'))
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
