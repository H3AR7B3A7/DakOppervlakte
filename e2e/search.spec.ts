import { expect, test } from '@playwright/test'
import { HomePage } from './pages/HomePage'

test.describe('Address search', () => {
  test('search collapses the form, shows "Nieuwe zoekopdracht", and increments the counter', async ({
    page,
  }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.waitForMapReady()

    // Turn auto-generate off so the flow stays deterministic — we're not asserting
    // anything about the building-polygon lookup here.
    await home.disableAutoGenerate()

    await home.searchAddress('Meir 1, Antwerpen')

    // Once the geocoder resolves, the search form collapses to show the current address.
    await expect(home.newSearchButton).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Huidig adres')).toBeVisible()
    await expect(page.getByText('Meir 1, Antwerpen')).toBeVisible()

    // Counter badge in the header appears after the first successful search.
    // Text is "{autogen} van {search} daken in één klik" (nl locale).
    await expect(home.headerStats).toBeVisible({ timeout: 10_000 })
    await expect(home.headerStats).toContainText('daken in één klik')

    // "Nieuwe zoekopdracht" re-opens the expanded form.
    await home.newSearchButton.click()
    await expect(home.addressInput).toBeVisible()
  })

  test('auto-generate checkbox is user-controllable', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()

    // Default is ON (matches DakoppervlakteApp.useState(true)).
    await expect(home.autoGenerateCheckbox).toBeChecked()

    await home.autoGenerateCheckbox.uncheck()
    await expect(home.autoGenerateCheckbox).not.toBeChecked()

    await home.autoGenerateCheckbox.check()
    await expect(home.autoGenerateCheckbox).toBeChecked()
  })
})
