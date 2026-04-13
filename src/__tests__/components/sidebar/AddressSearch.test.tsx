import { render, screen } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { AddressSearch } from '@/components/sidebar/AddressSearch'

function setup(overrides: Partial<React.ComponentProps<typeof AddressSearch>> = {}) {
  const props = {
    value: '',
    onChange: vi.fn(),
    onSearch: vi.fn(),
    searching: false,
    error: '',
    ...overrides,
  }
  render(<AddressSearch {...props} />)
  return props
}

describe('User searches for an address', () => {
  it('shows the address input field', () => {
    setup()
    expect(screen.getByRole('textbox', { name: /adres/i })).toBeInTheDocument()
  })

  it('calls onChange as the user types', async () => {
    const onChange = vi.fn()
    setup({ onChange })
    await userEvent.type(screen.getByRole('textbox'), 'M')
    expect(onChange).toHaveBeenCalled()
  })

  it('calls onSearch when the search button is clicked', async () => {
    const onSearch = vi.fn()
    setup({ value: 'Meir 1', onSearch })
    await userEvent.click(screen.getByRole('button', { name: /zoeken/i }))
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('calls onSearch when Enter is pressed in the input', async () => {
    const onSearch = vi.fn()
    setup({ value: 'Meir 1', onSearch })
    await userEvent.type(screen.getByRole('textbox'), '{Enter}')
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('disables the search button when the input is empty', () => {
    setup({ value: '' })
    expect(screen.getByRole('button', { name: /zoeken/i })).toBeDisabled()
  })

  it('disables the search button while a search is in progress', () => {
    setup({ value: 'Meir 1', searching: true })
    expect(screen.getByRole('button', { name: /zoeken/i })).toBeDisabled()
  })

  it('shows an error message when the address is not found', () => {
    setup({ error: 'Adres niet gevonden. Probeer een vollediger adres.' })
    expect(screen.getByRole('alert')).toHaveTextContent(/adres niet gevonden/i)
  })

  it('shows no error message in the happy path', () => {
    setup()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
