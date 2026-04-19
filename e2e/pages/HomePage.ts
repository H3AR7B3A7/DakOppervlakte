import type { Locator, Page } from '@playwright/test'

/**
 * Page Object for the Dakoppervlakte home page (default locale: nl).
 * Selectors prefer ARIA roles and labels so tests survive style refactors.
 */
export class HomePage {
  readonly page: Page
  readonly mapRegion: Locator
  readonly mapLoadingStatus: Locator
  readonly addressInput: Locator
  readonly searchButton: Locator
  readonly autoGenerateCheckbox: Locator
  readonly startDrawingButton: Locator
  readonly newSearchButton: Locator
  readonly resetButton: Locator
  readonly headerStats: Locator
  readonly addressError: Locator

  constructor(page: Page) {
    this.page = page
    this.mapRegion = page.getByRole('main', { name: 'Interactieve kaart' })
    this.mapLoadingStatus = page.getByRole('status', { name: 'Kaart laden...' })
    this.addressInput = page.getByLabel('Zoek een adres')
    this.searchButton = page.getByRole('button', { name: 'Zoeken' })
    this.autoGenerateCheckbox = page.getByRole('checkbox', {
      name: 'Automatisch dakoppervlak genereren',
    })
    this.startDrawingButton = page.getByRole('button', { name: /Begin met tekenen/ })
    this.newSearchButton = page.getByRole('button', { name: 'Nieuwe zoekopdracht' })
    this.resetButton = page.getByRole('button', { name: 'Alles wissen' })
    this.headerStats = page.locator('.app-header-stats')
    // `getByRole('alert')` also matches Next.js' empty __next-route-announcer__,
    // so match the error by its visible text within the address form.
    this.addressError = page.getByText('Adres niet gevonden. Probeer een vollediger adres.')
  }

  async goto() {
    await this.page.goto('/')
  }

  async waitForMapReady() {
    // Loader disappears once the SDK resolves and the map instance is created.
    await this.mapLoadingStatus.waitFor({ state: 'hidden', timeout: 30_000 })
  }

  async searchAddress(address: string) {
    await this.addressInput.fill(address)
    await this.searchButton.click()
  }

  async disableAutoGenerate() {
    if (await this.autoGenerateCheckbox.isChecked()) {
      await this.autoGenerateCheckbox.uncheck()
    }
  }
}
