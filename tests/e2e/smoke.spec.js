const { test, expect } = require('@playwright/test')
const {
  getJourneys,
  getJourneysWithStartPage
} = require('../../app/config/shared/journeys')
const fs = require('fs')
const path = require('path')

/**
 * Smoke tests: the prototype starts without module errors and every
 * journey's start page loads, so a missing dependency or a broken journey
 * is caught before deployment.
 *
 * Journeys come from app/config/shared/journeys.js (every
 * content/<id>/journey.yaml plus app/config/shared/journeys.yaml), so a
 * new journey is covered without editing this file.
 */

test.describe('Application Startup', () => {
  test('app starts without module errors', async ({ page }) => {
    // Navigate to the homepage
    const response = await page.goto('/')

    // Check that the response is successful
    expect(response.status()).toBe(200)

    // Check that the GOV.UK prototype kit loaded
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Journey Start Pages', () => {
  // Journey pages are dynamically loaded from shared config
  // This ensures tests stay in sync with the application
  const journeyPages = getJourneysWithStartPage()

  for (const journey of journeyPages) {
    test(`${journey.name} (${journey.path}) start page loads without errors`, async ({
      page
    }) => {
      // Navigate to the journey start page
      const response = await page.goto(journey.path)

      // Check that the response is successful
      expect(response.status()).toBe(200)

      // Check that the GOV.UK template is present
      await expect(page.locator('.govuk-template')).toBeVisible()
    })
  }
})

test.describe('Journey entry pages', () => {
  // A journey that begins somewhere other than /start (a staff service's
  // sign in, say) is covered by its entry page instead
  const others = getJourneys().filter(
    (journey) => !journey.hasStartPage && !journey.error
  )

  for (const journey of others) {
    test(`${journey.name} (${journey.entryUrl}) entry page loads without errors`, async ({
      page
    }) => {
      const response = await page.goto(journey.entryUrl)
      expect(response.status()).toBe(200)
      await expect(page.locator('.govuk-template')).toBeVisible()
    })
  }

  test('every content journey loads without problems', () => {
    const broken = getJourneys()
      .filter((journey) => journey.error)
      .map((journey) => `${journey.id}: ${journey.error}`)
    expect(broken).toEqual([])
  })
})

test.describe('Filesystem start pages (auto-routed, not in the journey registry)', () => {
  // Cover journeys that expose a /start page but are NOT registered in
  // app/config/shared/journeys.js — for example standard-kit journeys that
  // rely on the Prototype Kit's automatic view routing. This keeps them
  // covered by the smoke test without forcing them into the registry.
  const viewsDir = path.join(__dirname, '../../app/views')
  const registryStartPaths = new Set(
    getJourneysWithStartPage().map((journey) => journey.path)
  )

  // Build the list of /<folder>/start pages that have a view file on disk and
  // are NOT already covered by the registry test above.
  const filesystemStartPages = fs
    .readdirSync(viewsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'layouts')
    .map((dir) => ({ folder: dir.name, url: `/${dir.name}/start` }))
    .filter((startPage) =>
      fs.existsSync(path.join(viewsDir, startPage.folder, 'start.html'))
    )
    .filter((startPage) => !registryStartPaths.has(startPage.url))

  for (const startPage of filesystemStartPages) {
    test(`${startPage.folder} start page loads without errors`, async ({
      page
    }) => {
      const response = await page.goto(startPage.url)

      expect(response.status()).toBe(200)
      await expect(page.locator('.govuk-template')).toBeVisible()
    })
  }
})
