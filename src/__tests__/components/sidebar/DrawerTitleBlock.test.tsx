import { DrawerTitleBlock } from '@/components/sidebar/DrawerTitleBlock'
import { render, screen } from '../../test-utils'

describe('DrawerTitleBlock', () => {
  it('renders the app title, accent, and subtitle from i18n', () => {
    render(<DrawerTitleBlock titleId="drawer-title" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveAttribute('id', 'drawer-title')
    expect(heading).toHaveTextContent(/bereken uw/i)
    expect(heading).toHaveTextContent(/dakoppervlakte/i)
    expect(screen.getByText(/typ een adres/i)).toBeInTheDocument()
  })
})
