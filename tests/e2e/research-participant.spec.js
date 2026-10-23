const { test, expect } = require('@playwright/test')
const { copyOf, hasJourney } = require('./helpers/journey')

/**
 * The participant details box: a user research aid in the footer of every
 * page (and behind ?participant on any URL) where the facilitator types the
 * participant's name and organisation. Journeys' hooks then use them in
 * place of the stand-in names (participantOf in app/lib/research.js).
 *
 * The box is prototype chrome, not journey copy, so its own labels are
 * literals here; everything on the journeys' pages comes from content/.
 */

const APPLY = 'apply-juggling-licence'
const RENEW = 'renew-juggling-licence'
const STAFF = 'review-juggling-applications'

const PARTICIPANT = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  organisation: 'Analytical Engines Ltd'
}

function dialog(page) {
  return page.locator('#research-participant')
}

async function describeParticipant(page, from, participant = PARTICIPANT) {
  await page.goto(`${from}?participant`)
  await expect(dialog(page)).toBeVisible()
  await dialog(page).getByLabel('First name').fill(participant.firstName)
  await dialog(page).getByLabel('Last name').fill(participant.lastName)
  await dialog(page).getByLabel('Organisation').fill(participant.organisation)
  await dialog(page).getByRole('button', { name: 'Use these details' }).click()
  // Back on the page it was opened from, without the flag
  await expect(page).toHaveURL(from)
  await expect(dialog(page)).toBeHidden()
}

test.describe('participant details', () => {
  test.skip(!hasJourney(APPLY), `the ${APPLY} example has been removed`)
  const { base, fieldBox } = hasJourney(APPLY) ? copyOf(APPLY) : {}

  test('the footer link opens the box and ?participant opens it on load', async ({
    page
  }) => {
    await page.goto(`${base}/start`)
    await expect(dialog(page)).toBeHidden()
    const footer = page.locator('.govuk-footer')
    await footer.getByRole('link', { name: 'Participant details' }).click()
    await expect(dialog(page)).toBeVisible()
    // Opened over the page, not by reloading it
    await expect(page).toHaveURL(`${base}/start`)
    await expect(dialog(page).getByRole('heading')).toHaveText(
      'Who is taking part?' // copy-ok
    )
    await dialog(page).getByRole('button', { name: 'Not now' }).click()
    await expect(dialog(page)).toBeHidden()

    await page.goto(`${base}/start?participant`)
    await expect(dialog(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
  })

  test('the details are kept for the session and can be forgotten', async ({
    page
  }) => {
    await describeParticipant(page, `${base}/start`)
    await page.goto(`${base}/how-many-balls?participant`)
    await expect(dialog(page).getByLabel('First name')).toHaveValue('Ada')
    await expect(dialog(page).getByLabel('Last name')).toHaveValue('Lovelace')
    await expect(dialog(page).getByLabel('Organisation')).toHaveValue(
      PARTICIPANT.organisation
    )
    await dialog(page).getByRole('button', { name: 'Forget them' }).click()
    await expect(page).toHaveURL(`${base}/how-many-balls`)
    await page.goto(`${base}/start?participant`)
    await expect(dialog(page).getByLabel('First name')).toHaveValue('')
    await expect(
      dialog(page).getByRole('button', { name: 'Forget them' })
    ).toHaveCount(0)
  })

  test('a previewed page comes back in preview once the details are given', async ({
    page
  }) => {
    const email = `${base}/confirmation-email`
    // The footer link keeps the page's query string
    await page.goto(`${base}/start?preview=1`)
    await expect(
      page
        .locator('.govuk-footer')
        .getByRole('link', { name: 'Participant details' })
    ).toHaveAttribute('href', `${base}/start?preview=1&participant`)
    // So does the box
    await page.goto(`${email}?preview=1&participant`)
    await expect(dialog(page)).toBeVisible()
    await dialog(page).getByLabel('First name').fill(PARTICIPANT.firstName)
    await dialog(page)
      .getByRole('button', { name: 'Use these details' })
      .click()
    await expect(page).toHaveURL(`${email}?preview=1`)
    await expect(dialog(page)).toBeHidden()
  })

  test('an embedded preview has no box', async ({ page }) => {
    await page.goto(`${base}/start?preview=1&embed=1`)
    await expect(dialog(page)).toHaveCount(0)
  })

  test('the box only returns to a page of the prototype', async ({
    request
  }) => {
    const response = await request.post('/research/participant', {
      form: { '_first-name': 'Ada', _return: 'https://example.com/' },
      maxRedirects: 0
    })
    expect(response.status()).toBe(303)
    expect(response.headers().location).toBe('/')
  })

  test('the name page starts with the participant’s name', async ({ page }) => {
    await describeParticipant(page, `${base}/start`)
    await page.goto(`${base}/your-details`)
    await expect(fieldBox(page, 'your-details', 'full-name')).toHaveValue(
      `${PARTICIPANT.firstName} ${PARTICIPANT.lastName}`
    )
  })
})

test.describe('participant details in the mock sign in', () => {
  test.skip(!hasJourney(RENEW), `the ${RENEW} example has been removed`)
  const { base, answer, submit, fillAnswer, answerBox, act } = hasJourney(RENEW)
    ? copyOf(RENEW)
    : {}

  test('the One Login account takes the participant’s name', async ({
    page
  }) => {
    await describeParticipant(page, `${base}/start`)
    await page.goto(`${base}/sign-in-method`)
    await answer(page, 'sign-in-method', 'one-login')
    await submit(page, 'sign-in-method')
    await act(page, 'one-login-start', 'secondary')
    await fillAnswer(page, 'one-login-email', 'ada@example.com')
    await submit(page, 'one-login-email')
    await fillAnswer(page, 'one-login-password', 'anything')
    await submit(page, 'one-login-password')
    await expect(page.locator('.govuk-caption-l')).toContainText(
      `${PARTICIPANT.firstName} ${PARTICIPANT.lastName}`
    )
  })

  test('the Government Gateway name page starts with it', async ({ page }) => {
    await describeParticipant(page, `${base}/start`)
    await page.goto(`${base}/government-gateway-email`)
    await fillAnswer(page, 'government-gateway-email', 'ada@example.com')
    await submit(page, 'government-gateway-email')
    await page.goto(`${base}/government-gateway-name`)
    await expect(answerBox(page, 'government-gateway-name')).toHaveValue(
      `${PARTICIPANT.firstName} ${PARTICIPANT.lastName}`
    )
  })
})

test.describe('participant details on a staff service', () => {
  test.skip(!hasJourney(STAFF), `the ${STAFF} example has been removed`)
  const { base, act } = hasJourney(STAFF) ? copyOf(STAFF) : {}

  test('the box speaks to the participant, and the header shows them', async ({
    page
  }) => {
    await page.goto(`${base}/sign-in`)
    await act(page, 'sign-in', 'submit')
    await page.goto(`${base}/applications?participant`)
    await expect(dialog(page).getByRole('heading')).toHaveText(
      'Tell us about you' // copy-ok
    )
    await dialog(page).getByLabel('First name').fill('Pat')
    await dialog(page).getByLabel('Last name').fill('Lee')
    await dialog(page).getByLabel('Organisation').fill('Northshire Council')
    await dialog(page)
      .getByRole('button', { name: 'Use these details' })
      .click()
    const header = page.locator('.app-staff-header')
    await expect(header).toContainText('Pat Lee')
    await expect(header).toContainText('Northshire Council')
  })
})
