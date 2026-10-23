const { test, expect } = require('@playwright/test')
const { copyOf, hasJourney } = require('./helpers/journey')

/**
 * The example staff service: the `staff` layout's header (service name,
 * the officer's account and menu), a table, a record and a decision.
 */

const journeyId = 'review-juggling-applications'
const present = hasJourney(journeyId)
const copy = present ? copyOf(journeyId) : {}
const { journey, base, answer, submit, act, expectHeading, expectOnPage } = copy

function header(page) {
  return page.locator('.app-staff-header')
}

test.describe('review juggling licence applications', () => {
  test.skip(!present, `the ${journeyId} example has been removed`)

  test('every page needs the officer signed in', async ({ page }) => {
    await page.goto(`${base}/applications`)
    await expectOnPage(page, 'sign-in')
  })

  test('the officer signs in, decides and signs out', async ({ page }) => {
    await page.goto(`${base}/sign-in`)
    await act(page, 'sign-in', 'submit')
    await expectOnPage(page, 'applications')
    await expectHeading(page, 'applications')
    await expect(page.locator('body')).toHaveClass(/app-staff/)
    await expect(header(page)).toContainText(journey.serviceName)
    await expect(header(page)).toContainText(journey.header.organisation)

    await page.locator('main .govuk-table').getByRole('link').first().click()
    await expectOnPage(page, 'application')
    await act(page, 'application', 'submit')
    await expectOnPage(page, 'decision')
    await answer(page, 'decision', 'approve')
    await submit(page, 'decision')
    await expectOnPage(page, 'decision-recorded')
    await expectHeading(page, 'decision-recorded')

    // The account panel holds Sign out (`$signOut` in journey.yaml)
    await header(page).getByRole('button').click()
    await header(page).getByRole('link', { name: 'Sign out' }).click()
    await expectOnPage(page, 'sign-in')
    await page.goto(`${base}/applications`)
    await expectOnPage(page, 'sign-in')
  })

  test('the menu links to the applications', async ({ page }) => {
    await page.goto(`${base}/applications?preview=1`)
    const menu = journey.header.menu.links[0]
    await header(page).getByRole('button').click()
    await expect(
      header(page).getByRole('link', { name: menu.text, exact: true })
    ).toHaveAttribute('href', `${base}/${menu.href}`)
  })
})
