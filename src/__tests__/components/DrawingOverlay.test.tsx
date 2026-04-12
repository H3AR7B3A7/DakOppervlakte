import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DrawingOverlay } from '@/components/map/DrawingOverlay'

describe('DrawingOverlay', () => {
  it('shows instruction for fewer than 3 points', () => {
    render(<DrawingOverlay pointCount={1} />)
    expect(screen.getByText('✏️ Klik hoekpunten aan (1 geplaatst)')).toBeDefined()
  })

  it('shows instruction for 3 or more points', () => {
    render(<DrawingOverlay pointCount={3} />)
    expect(screen.getByText('✏️ 3 punten — dubbelklik om te sluiten')).toBeDefined()
  })
})
