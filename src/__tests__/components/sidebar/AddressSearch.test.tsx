import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { AddressSearch } from '@/components/sidebar/AddressSearch'
import { render, screen } from '../../test-utils'

function setup(overrides: Partial<ComponentProps<typeof AddressSearch>> = {}) {
  const props = {
    value: '',
    onChange: vi.fn(),
    onSearch: vi.fn(),
    searching: false,
    error: '',
    autoGenerate: false,
    onAutoGenerateChange: vi.fn(),
    collapsed: false,
    onExpand: vi.fn(),
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

  describe('Auto-generate checkbox', () => {
    it('renders the auto-generate checkbox', () => {
      setup()
      expect(screen.getByRole('checkbox', { name: /automatisch/i })).toBeInTheDocument()
    })

    it('reflects the autoGenerate prop value', () => {
      setup({ autoGenerate: true })
      expect(screen.getByRole('checkbox', { name: /automatisch/i })).toBeChecked()
    })

    it('calls onAutoGenerateChange when toggled', async () => {
      const onAutoGenerateChange = vi.fn()
      setup({ onAutoGenerateChange })
      await userEvent.click(screen.getByRole('checkbox', { name: /automatisch/i }))
      expect(onAutoGenerateChange).toHaveBeenCalledWith(true)
    })
  })
})

describe('Collapsible search form', () => {
  it('shows the full form by default (expanded)', () => {
    setup({ collapsed: false, value: 'Meir 1' })
    expect(screen.getByRole('textbox', { name: /adres/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /automatisch/i })).toBeInTheDocument()
  })

  it('shows only the address label and a "New search" button when collapsed', () => {
    setup({ collapsed: true, value: 'Meir 1, Antwerpen' })
    expect(screen.queryByRole('textbox', { name: /adres/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /automatisch/i })).not.toBeInTheDocument()
    expect(screen.getByText('Meir 1, Antwerpen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nieuwe zoekopdracht/i })).toBeInTheDocument()
  })

  it('calls onExpand when the "New search" button is clicked', async () => {
    const onExpand = vi.fn()
    setup({ collapsed: true, value: 'Meir 1', onExpand })
    await userEvent.click(screen.getByRole('button', { name: /nieuwe zoekopdracht/i }))
    expect(onExpand).toHaveBeenCalledTimes(1)
  })
})
