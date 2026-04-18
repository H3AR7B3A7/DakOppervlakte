import { StepGuide } from '@/components/sidebar/StepGuide'
import { render, screen } from '../../test-utils'

describe('User sees the step guide', () => {
  it('renders all 4 steps', () => {
    render(<StepGuide />)
    const list = screen.getByRole('list', { name: /hoe het werkt/i })
    const items = screen.getAllByRole('listitem')
    expect(list).toBeInTheDocument()
    expect(items).toHaveLength(4)
  })

  it('shows numbered step indicators', () => {
    render(<StepGuide />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('displays translated step text', () => {
    render(<StepGuide />)
    expect(screen.getByText(/typ een adres/i)).toBeInTheDocument()
    expect(screen.getByText(/roteer de kaart/i)).toBeInTheDocument()
  })
})
