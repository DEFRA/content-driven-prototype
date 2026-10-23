const { test, expect } = require('@playwright/test')
const {
  loadJourney,
  previewVariants,
  copyVariants
} = require('../../app/lib/journey-engine')
const { copyOf, gotoTools, hasJourney } = require('./helpers/journey')

/**
 * The example journey with sign in: the shared mock GOV.UK One Login and
 * Government Gateway pages (content/shared/), signed in by
 * app/lib/mock-sign-in.js, the header's Sign out, and an exit to the other
 * example journey.
 */

const journeyId = 'renew-juggling-licence'
const present = hasJourney(journeyId)
const copy = present ? copyOf(journeyId) : {}
const {
  base,
  answer,
  fillAnswer,
  fillField,
  submit,
  act,
  rowValue,
  expectHeading,
  expectOnPage
} = copy
const applyEntry = '/apply-juggling-licence/start'

function signOut(page) {
  return page
    .locator('.govuk-service-navigation')
    .getByRole('link', { name: 'Sign out' })
}

async function chooseSignIn(page, method) {
  await page.goto(`${base}/sign-in-method`)
  await answer(page, 'sign-in-method', method)
  await submit(page, 'sign-in-method')
}

test.describe('renew a juggling licence', () => {
  test.skip(!present, `the ${journeyId} example has been removed`)

  test('the renewal needs signing in first', async ({ page }) => {
    await page.goto(`${base}/renewal-length`)
    await expectOnPage(page, 'sign-in-method')
    await expect(signOut(page)).toHaveCount(0)
  })

  test('signing in with One Login, then signing out', async ({ page }) => {
    await chooseSignIn(page, 'one-login')
    await expectOnPage(page, 'one-login-start')
    await act(page, 'one-login-start', 'secondary')
    await fillAnswer(page, 'one-login-email', 'jo@example.com')
    await submit(page, 'one-login-email')
    await fillAnswer(page, 'one-login-password', 'anything')
    await submit(page, 'one-login-password')

    await expectOnPage(page, 'renewal-length')
    await expect(signOut(page)).toBeVisible()
    await answer(page, 'renewal-length', 'three-years')
    await submit(page, 'renewal-length')
    await expectOnPage(page, 'check-your-answers')
    // The account's email, and the stand-in name in place of a real one
    await expect(page.locator('main')).toContainText('jo@example.com')
    await expect(page.locator('main')).toContainText(
      rowValue('check-your-answers', 'renewal-length', {
        renewalLength: 'three-years'
      })
    )
    await submit(page, 'check-your-answers')
    await expectHeading(page, 'confirmation')

    await signOut(page).click()
    await expectOnPage(page, 'start')
    await page.goto(`${base}/renewal-length`)
    await expectOnPage(page, 'sign-in-method')
  })

  test('creating Government Gateway sign in details signs in', async ({
    page
  }) => {
    await chooseSignIn(page, 'government-gateway')
    await expectOnPage(page, 'government-gateway-sign-in')
    await page.goto(`${base}/government-gateway-email`)
    await fillAnswer(page, 'government-gateway-email', 'gg@example.com')
    await submit(page, 'government-gateway-email')
    await fillAnswer(page, 'government-gateway-confirm-email', 'DNCLRK')
    await submit(page, 'government-gateway-confirm-email')
    await submit(page, 'government-gateway-email-confirmed')
    await fillAnswer(page, 'government-gateway-name', 'Gale Gateway')
    await submit(page, 'government-gateway-name')
    await fillField(
      page,
      'government-gateway-create-password',
      '_password',
      'a long password'
    )
    await fillField(
      page,
      'government-gateway-create-password',
      '_password-confirm',
      'a long password'
    )
    await submit(page, 'government-gateway-create-password')
    await expectOnPage(page, 'government-gateway-user-id')
    // The minted user ID: 12 digits in pairs
    await expect(page.locator('.govuk-panel')).toContainText(/\d{2}( \d{2}){5}/)
    await submit(page, 'government-gateway-user-id')
    await expectOnPage(page, 'renewal-length')
    await expect(page.locator('.govuk-caption-l')).toContainText('Gale Gateway')
  })

  test('signing in with a Government Gateway user ID', async ({ page }) => {
    await chooseSignIn(page, 'government-gateway')
    await fillField(
      page,
      'government-gateway-sign-in',
      '_user-id',
      '123456789012'
    )
    await fillField(page, 'government-gateway-sign-in', '_password', 'anything')
    await submit(page, 'government-gateway-sign-in')
    await expectOnPage(page, 'renewal-length')
    await expect(signOut(page)).toBeVisible()
  })

  test('without a licence the user goes to the other journey', async ({
    page
  }) => {
    await chooseSignIn(page, 'no-licence')
    await expect(page).toHaveURL(applyEntry)
  })
})

test.describe('journey tools show exits to other journeys', () => {
  test.skip(!present, `the ${journeyId} example has been removed`)

  test('flow.json lists the exit as an off-page transition', async ({
    request
  }) => {
    const response = await request.get(`/tools/journeys/${journeyId}/flow.json`)
    expect(response.status()).toBe(200)
    const flow = await response.json()
    expect(flow.transitions.offPage).toEqual([
      expect.objectContaining({
        fromId: 'sign-in-method',
        toPath: applyEntry,
        kind: 'next'
      })
    ])
    // The exit is not a screen of this journey
    expect(flow.screens).toHaveLength(loadJourney(journeyId).pages.length)
  })

  test('the flow diagram and screen wall show the exit', async ({ page }) => {
    const journey = loadJourney(journeyId)
    await gotoTools(page, journeyId)
    await expect(
      page.locator('#flow-diagram[data-rendered="true"]')
    ).toHaveCount(1, { timeout: 20000 })
    // One exit to the other journey; the sign in groups' own sections add
    // dashed "Back in the journey" boxes of their own
    // The diagram's dashed box is a rect; its words are on the group around it
    const diagramExits = await page
      .locator('.flow-node--external')
      .evaluateAll(
        (boxes, path) =>
          boxes.filter((box) => box.parentNode.textContent.includes(path))
            .length,
        applyEntry
      )
    expect(diagramExits).toBe(1)
    await expect(
      page.locator('.wall-card--external', { hasText: applyEntry })
    ).toHaveCount(1)
    // Placeholder cards carry no iframe, so the wall still has one per page
    // (plus one per preview variant and one per copy variant)
    const cards = journey.pages.reduce(
      (count, item) =>
        count + 1 + previewVariants(item).length + copyVariants(item).length,
      0
    )
    await expect(page.locator('iframe')).toHaveCount(cards)
  })

  test('flow.mmd gives the exit a valid node id', async ({ request }) => {
    const response = await request.get(`/tools/journeys/${journeyId}/flow.mmd`)
    expect(response.status()).toBe(200)
    const source = await response.text()
    expect(source).toContain(
      `ext0["${applyEntry}<br/>Continues in another journey"]`
    )
    expect(source).toContain('class ext0 external')
  })

  test('each sign in service is a group of its own', async ({ page }) => {
    await gotoTools(page, journeyId)
    await page.getByRole('tab', { name: 'Screens' }).click()
    await expect(page.locator('#group-one-login')).toHaveCount(1)
    await expect(page.locator('#group-government-gateway')).toHaveCount(1)
  })
})
