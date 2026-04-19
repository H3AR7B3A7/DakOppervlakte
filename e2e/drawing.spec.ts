import { expect, test } from '@playwright/test'
import { HomePage } from './pages/HomePage'

test.describe('Polygon drawing', () => {
  test('entering manual drawing mode shows the drawing hint overlay', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.waitForMapReady()

    // Manual mode: auto-generate OFF, search, then the app auto-enters drawing
    // mode 600ms after the geocode resolves (see DakoppervlakteApp.handleSearch).
    await home.disableAutoGenerate()
    await home.searchAddress('Meir 1, Antwerpen')

    // Drawing overlay on the map announces "Klik hoekpunten aan (0 geplaatst)".
    await expect(page.getByText(/Klik hoekpunten aan/)).toBeVisible({ timeout: 20_000 })
  })

  test('"Nieuwe zoekopdracht" re-expands the address form with the previous value', async ({
    page,
  }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.waitForMapReady()

    await home.disableAutoGenerate()
    await home.searchAddress('Meir 1, Antwerpen')
    await expect(home.newSearchButton).toBeVisible({ timeout: 20_000 })

    await home.newSearchButton.click()

    // The input is back with the previous value pre-filled so users can tweak it.
    await expect(home.addressInput).toBeVisible()
    await expect(home.addressInput).toHaveValue('Meir 1, Antwerpen')
    await expect(home.searchButton).toBeEnabled()
  })
})
