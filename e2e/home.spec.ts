import { expect, test } from '@playwright/test'
import { HomePage } from './pages/HomePage'

test.describe('Home page', () => {
  test('renders the sidebar search, the map region, and anonymous-user auth buttons', async ({
    page,
  }) => {
    const home = new HomePage(page)
    await home.goto()

    // Sidebar search is front-and-center.
    await expect(home.addressInput).toBeVisible()
    await expect(home.addressInput).toHaveValue('')
    await expect(home.searchButton).toBeDisabled() // Disabled while input is empty.

    // Auto-generate default is ON (matches the `autoGenerate` useState default).
    await expect(home.autoGenerateCheckbox).toBeChecked()

    // Map region is present; loader is either visible (still booting) or already hidden.
    await expect(home.mapRegion).toBeVisible()

    // Signed-out Clerk buttons are visible.
    await expect(page.getByRole('button', { name: 'Aanmelden' })).toBeVisible()

    // Step guide (ol with aria-label) shows the how-it-works list when there are no polygons.
    await expect(page.getByRole('list', { name: 'Hoe het werkt' })).toBeVisible()
  })

  test('enables the search button once an address is typed', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()

    await expect(home.searchButton).toBeDisabled()
    await home.addressInput.fill('Meir 1, Antwerpen')
    await expect(home.searchButton).toBeEnabled()

    // Clearing the field disables the button again.
    await home.addressInput.fill('   ')
    await expect(home.searchButton).toBeDisabled()
  })
})
