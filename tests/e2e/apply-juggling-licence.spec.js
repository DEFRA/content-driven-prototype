const { test, expect } = require('@playwright/test')
const { copyOf, hasJourney } = require('./helpers/journey')

/**
 * The example journey end to end: every question type, a branch out, the
 * error messages, check your answers with its Change links, and the hook
 * that makes the reference. Every word on the pages comes from
 * content/apply-juggling-licence/ through the copy helpers, so rewording a
 * page never breaks this spec.
 *
 * Delete this spec along with the example journey; until then it is a
 * working pattern for a journey's own spec.
 */

const journeyId = 'apply-juggling-licence'
const present = hasJourney(journeyId)
const copy = present ? copyOf(journeyId) : {}
const {
  base,
  pageOf,
  answer,
  fillAnswer,
  answerBox,
  fillField,
  submit,
  changeLink,
  rowValue,
  expectHeading,
  expectError,
  expectFieldError,
  expectOnPage,
  researchLink
} = copy

const DETAILS = { fullName: 'Jo Bloggs', email: 'jo@example.com' }

// A 1×1 PNG, as an upload
const PHOTO = {
  name: 'trick.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  )
}

// From the first question to check your answers, with valid answers
async function answerEverything(page) {
  await page.goto(`${base}/how-many-balls`)
  await answer(page, 'how-many-balls', 'three-or-more')
  await submit(page, 'how-many-balls')
  await answer(page, 'juggling-objects', 'balls')
  await answer(page, 'juggling-objects', 'rings')
  await submit(page, 'juggling-objects')
  await fillAnswer(page, 'years-juggling', '7')
  await submit(page, 'years-juggling')
  await fillAnswer(page, 'best-trick', 'Mills mess')
  await submit(page, 'best-trick')
  await answerBox(page, 'trick-photo').setInputFiles(PHOTO)
  await submit(page, 'trick-photo')
  await fillField(page, 'your-details', 'full-name', DETAILS.fullName)
  await submit(page, 'your-details')
  await fillAnswer(page, 'email-address', DETAILS.email)
  await submit(page, 'email-address')
  await expectOnPage(page, 'check-your-answers')
}

test.describe('apply for a juggling licence', () => {
  test.skip(!present, `the ${journeyId} example has been removed`)

  test('the start page leads to the first question', async ({ page }) => {
    await page.goto(`${base}/start`)
    await expectHeading(page, 'start')
    await page.getByRole('button', { name: 'Start now' }).click()
    await expectOnPage(page, 'how-many-balls')
  })

  test('someone who cannot juggle is turned away', async ({ page }) => {
    await page.goto(`${base}/how-many-balls`)
    await answer(page, 'how-many-balls', 'none')
    await submit(page, 'how-many-balls')
    await expectOnPage(page, 'ineligible')
    await expectHeading(page, 'ineligible')
  })

  test('every question says what is missing', async ({ page }) => {
    for (const id of [
      'how-many-balls',
      'juggling-objects',
      'years-juggling',
      'best-trick',
      'trick-photo',
      'email-address'
    ]) {
      await page.goto(pageOf(id).path)
      await submit(page, id)
      await expectError(page, id)
    }
    await page.goto(`${base}/your-details`)
    await submit(page, 'your-details')
    await expectFieldError(page, 'your-details', 'full-name')
  })

  test('numbers, files and email addresses are checked', async ({ page }) => {
    await page.goto(`${base}/years-juggling`)
    await fillAnswer(page, 'years-juggling', 'lots')
    await submit(page, 'years-juggling')
    await expectError(page, 'years-juggling', 'invalid')
    await fillAnswer(page, 'years-juggling', '101')
    await submit(page, 'years-juggling')
    await expectError(page, 'years-juggling', 'max')

    await page.goto(`${base}/trick-photo`)
    await answerBox(page, 'trick-photo').setInputFiles({
      name: 'trick.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a photo')
    })
    await submit(page, 'trick-photo')
    await expectError(page, 'trick-photo', 'wrongType')

    await page.goto(`${base}/email-address`)
    await fillAnswer(page, 'email-address', 'not an email')
    await submit(page, 'email-address')
    await expectError(page, 'email-address', 'format')
  })

  test('check your answers shows the answers and a Change link returns', async ({
    page
  }) => {
    await answerEverything(page)
    const answers = {
      ballCount: 'three-or-more',
      jugglingObjects: ['balls', 'rings'],
      yearsJuggling: 7
    }
    const list = page.locator('main')
    await expect(list).toContainText(
      rowValue('check-your-answers', 'how-many-balls', answers)
    )
    // A checkboxes answer reads as its labels, joined with commas
    await expect(list).toContainText(
      rowValue('check-your-answers', 'juggling-objects', answers)
    )
    await expect(list).toContainText(DETAILS.email)
    // An upload is remembered by its file name
    await expect(list).toContainText(PHOTO.name)

    await changeLink(page, 'check-your-answers', 'years-juggling').click()
    await expectOnPage(
      page,
      'years-juggling',
      'change=true&nav=check-your-answers'
    )
    await fillAnswer(page, 'years-juggling', '8')
    await submit(page, 'years-juggling')
    await expectOnPage(page, 'check-your-answers')
    await expect(list).toContainText(
      rowValue('check-your-answers', 'years-juggling', { yearsJuggling: 8 })
    )
  })

  test('sending the application gives a reference', async ({ page }) => {
    await answerEverything(page)
    await submit(page, 'check-your-answers')
    await expectOnPage(page, 'confirmation')
    await expectHeading(page, 'confirmation')
    await expect(page.locator('.govuk-panel')).toContainText(/JL-\d{6}/)
    // The email it sends is a research aid in the footer
    const link = researchLink(page, 'confirmation', 'confirmation-email')
    await expect(link).toHaveAttribute('target', '_blank')
  })

  test('check your answers needs the answers first', async ({ page }) => {
    await page.goto(`${base}/check-your-answers`)
    await expectOnPage(page, 'email-address')
  })
})
