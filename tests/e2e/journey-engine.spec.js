const { test, expect } = require('@playwright/test')
const {
  loadJourney,
  getJourneyIds,
  validateChoiceValues,
  previewData
} = require('../../app/lib/journey-engine')

/**
 * The loader's guard on the answers a journey branches on: a rule in
 * journey.yaml that compares a choice with a value none of the page's
 * options can store is a content mistake (a reworded label, a mistyped
 * `store:` key) that would send the journey the wrong way, so it fails at
 * load time with a message naming the page.
 */

// A minimal journey the way the loader builds one, with the parts the
// guard reads
function journeyWith(pages, preview = {}) {
  return {
    id: 'test',
    preview: { data: preview },
    pages: pages.map((page) => ({
      type: 'content',
      contentFile: `content/test/pages/${page.id}.md`,
      next: [],
      content: { options: [], rows: [], body: '' },
      ...page,
      content: { options: [], rows: [], body: '', ...(page.content || {}) }
    }))
  }
}

const options = (...values) =>
  values.map((value) => ({ label: `Label ${value}`, value }))

function problemsOf(journey) {
  const problems = []
  validateChoiceValues(journey, problems)
  return problems
}

test.describe('journey engine: choice values', () => {
  test('every real journey passes', () => {
    for (const id of getJourneyIds()) {
      expect(() => loadJourney(id), id).not.toThrow()
    }
  })

  test('a rule comparing an answer with a value no option stores is refused', () => {
    const problems = problemsOf(
      journeyWith([
        {
          id: 'housing',
          type: 'radios',
          sessionKey: 'isHousing',
          content: { options: options('Yes', 'No') },
          next: [
            { when: { key: 'isHousing', equals: 'Nope' }, goto: 'not-housing' },
            { goto: 'units' }
          ]
        }
      ])
    )
    expect(problems).toEqual([
      "pages.housing.next[0].when: 'isHousing' is compared with 'Nope' but no option on housing can store it (the options store 'Yes', 'No')"
    ])
  })

  test('a store: key that matches no option is refused', () => {
    const problems = problemsOf(
      journeyWith([
        {
          id: 'redline-map',
          type: 'radios',
          sessionKey: 'hasFile',
          store: { uploads: true, draw: false },
          content: { options: options('upload', 'draw') }
        }
      ])
    )
    expect(problems).toEqual([
      "pages.redline-map.store: 'uploads' matches no option in content/test/pages/redline-map.md (the options' values are 'upload', 'draw')"
    ])
  })

  test('values are checked as strings, through store: and set:', () => {
    const problems = problemsOf(
      journeyWith([
        {
          id: 'redline-map',
          type: 'radios',
          sessionKey: 'hasFile',
          store: { upload: true, draw: false },
          content: { options: options('upload', 'draw') },
          next: [
            { when: { key: 'hasFile', equals: true }, goto: 'upload' },
            { goto: 'map', set: { referrer: 'redline-map' } }
          ]
        },
        {
          id: 'referrer',
          type: 'radios',
          sessionKey: 'referrer',
          content: { options: options('upload-redline') },
          next: [
            {
              when: { key: 'referrer', in: ['redline-map', 'upload-redline'] },
              goto: 'map'
            },
            { goto: 'map' }
          ]
        }
      ])
    )
    expect(problems).toEqual([])
  })

  test('guards, back rules, summary rows and :::if blocks are checked too', () => {
    const problems = problemsOf(
      journeyWith([
        {
          id: 'user-type',
          type: 'radios',
          sessionKey: 'userType',
          content: { options: options('individual', 'agent') }
        },
        {
          id: 'guidance',
          guard: {
            key: 'userType',
            equals: 'organisation',
            redirect: 'user-type'
          },
          back: [
            {
              when: { key: 'userType', notEquals: 'company' },
              goto: 'user-type'
            },
            { goto: 'user-type' }
          ],
          content: { body: ':::if userType equals business\nHello\n:::' }
        },
        {
          id: 'check',
          type: 'check-answers',
          content: {
            rows: [
              {
                key: 'Who',
                value: {
                  when: { key: 'userType', equals: 'individual' },
                  then: 'You',
                  else: {
                    when: { key: 'userType', equals: 'client' },
                    then: 'Them',
                    else: 'Other'
                  }
                },
                change: [
                  {
                    when: { key: 'userType', equals: 'agent' },
                    goto: 'user-type'
                  }
                ],
                changeHidden: {
                  when: { key: 'userType', equals: 'firm' },
                  then: 'a',
                  else: 'b'
                }
              }
            ]
          }
        }
      ])
    )
    const expected = [
      "pages.guidance.guard: 'userType' is compared with 'organisation'",
      "pages.guidance.back[0].when: 'userType' is compared with 'company'",
      "content/test/pages/guidance.md ':::if userType equals business': 'userType' is compared with 'business'",
      "pages.check.rows[0].value.when: 'userType' is compared with 'client'",
      "pages.check.rows[0].changeHidden.when: 'userType' is compared with 'firm'"
    ]
    expect(problems).toHaveLength(expected.length)
    for (const prefix of expected) {
      expect(
        problems.some((problem) => problem.startsWith(prefix)),
        prefix
      ).toBe(true)
    }
  })

  test('keys no choice page writes, engine values and paths are left alone', () => {
    const problems = problemsOf(
      journeyWith([
        {
          id: 'housing',
          type: 'radios',
          sessionKey: 'isHousing',
          content: { options: options('Yes', 'No') },
          next: [
            { when: { key: '$navFromSummary', truthy: true }, goto: 'check' },
            {
              when: { key: 'account.accountType', equals: 'agent' },
              goto: 'check'
            },
            { when: { key: 'accountCreated', equals: 'Yes' }, goto: 'check' },
            { when: { key: 'isHousing', gt: 3 }, goto: 'check' },
            { when: { key: 'isHousing', isSet: true }, goto: 'check' },
            {
              when: { all: [{ key: 'isHousing', equals: 'No' }] },
              goto: 'check'
            },
            {
              when: { not: { key: 'isHousing', equals: 'Yes' } },
              goto: 'check'
            },
            { goto: 'check' }
          ]
        },
        {
          id: 'units',
          type: 'number',
          sessionKey: 'units',
          next: [
            { when: { key: 'units', equals: 'lots' }, goto: 'check' },
            { goto: 'check' }
          ]
        },
        // A select is a fixture list (addresses), not a branch
        {
          id: 'address',
          type: 'select',
          sessionKey: 'address',
          content: { options: options('1 Meadow Lane') },
          next: [
            { when: { key: 'address', equals: 'anywhere' }, goto: 'check' },
            { goto: 'check' }
          ]
        }
      ])
    )
    expect(problems).toEqual([])
  })

  test('a sample answer no option can give is refused', () => {
    const problems = problemsOf(
      journeyWith(
        [
          {
            id: 'housing',
            type: 'radios',
            sessionKey: 'isHousing',
            content: { options: options('Yes', 'No') }
          }
        ],
        { isHousing: 'Maybe', units: 120 }
      )
    )
    expect(problems).toEqual([
      "preview.data.isHousing: 'Maybe' is not an answer housing can store (the options store 'Yes', 'No')"
    ])
  })

  test('a checkboxes sample answer is checked item by item', () => {
    const page = {
      id: 'objects',
      type: 'checkboxes',
      sessionKey: 'objects',
      content: { options: options('balls', 'clubs') }
    }
    expect(
      problemsOf(journeyWith([page], { objects: ['balls', 'clubs'] }))
    ).toEqual([])
    expect(
      problemsOf(journeyWith([page], { objects: ['balls', 'knives'] }))
    ).toEqual([
      "preview.data.objects: 'knives' is not an answer objects can store (the options store 'balls', 'clubs')"
    ])
  })
})

/**
 * Copy variants: `pages/<id>~<name>.md` beside a page is an alternative
 * copy of it, built from the same journey.yaml entry. The loader lists it
 * on the page and refuses one that would change what the page does. These
 * tests load a copy of content/ from a temporary folder, so nothing under
 * the real content/ is touched.
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { copyVariants } = require('../../app/lib/journey-engine')
const { hasJourney } = require('./helpers/journey')

const APPLY = 'apply-juggling-licence'
const RENEW = 'renew-juggling-licence'

function withContentCopy(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'journey-content-'))
  const contentDir = path.join(dir, 'content')
  fs.cpSync(path.join(__dirname, '../../content'), contentDir, {
    recursive: true
  })
  try {
    return run(contentDir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

// The loader's problems for a journey, or '' when it loads
function problemsLoading(journeyId, contentDir) {
  try {
    loadJourney(journeyId, { contentDir })
    return ''
  } catch (error) {
    return error.message
  }
}

const RADIOS = `---
variant: Other words
type: radios
options:
  - label: Three balls or more
    value: three-or-more
  - label: One or two balls
    value: one-or-two
  - label: I cannot juggle
    value: none
errors:
  required: Choose one
---

# How many can you keep in the air?
`

test.describe('journey engine: copy variants', () => {
  test.skip(!hasJourney(APPLY), `the ${APPLY} example has been removed`)

  test('a sibling <id>~<name>.md is listed on the page, copy only', () => {
    withContentCopy((contentDir) => {
      const pagesDir = path.join(contentDir, APPLY, 'pages')
      fs.writeFileSync(path.join(pagesDir, 'how-many-balls~words.md'), RADIOS)
      const journey = loadJourney(APPLY, { contentDir })
      const page = journey.byId.get('how-many-balls')
      const variant = page.copyVariants.find((item) => item.id === 'words')
      expect(variant).toMatchObject({
        id: 'words',
        label: 'Other words',
        contentFile: `content/${APPLY}/pages/how-many-balls~words.md`
      })
      expect(variant.page.content.heading).toBe(
        'How many can you keep in the air?'
      )
      expect(variant.page.content.options.map((o) => o.label)).toContain(
        'I cannot juggle'
      )
      expect(variant.page.path).toBe(page.path)
      expect(variant.page.next).toEqual(page.next)
      expect(variant.page.copyVariant).toEqual({
        id: 'words',
        label: 'Other words',
        description: null,
        sample: null
      })
      // Only the page itself is a page of the journey
      expect(
        journey.pages.filter((item) => item.id === 'how-many-balls')
      ).toHaveLength(1)
      expect(copyVariants(page).map((item) => item.id)).toContain('words')
      expect(copyVariants(variant.page)).toEqual([])
    })
  })

  test('a variant that changes what the page does is refused', () => {
    withContentCopy((contentDir) => {
      const pagesDir = path.join(contentDir, APPLY, 'pages')
      fs.writeFileSync(
        path.join(pagesDir, 'how-many-balls~values.md'),
        RADIOS.replace('value: none', 'value: zero')
      )
      fs.writeFileSync(
        path.join(pagesDir, 'how-many-balls~Type.md'),
        '---\ntype: content\n---\n\n# Heading\n'
      )
      const message = problemsLoading(APPLY, contentDir)
      expect(message).toContain(
        "pages.how-many-balls~values: a variant keeps the options' values (none, one-or-two, three-or-more); reword the labels, not the values"
      )
      expect(message).toContain(
        "pages.how-many-balls~Type: a variant keeps the page's type ('radios', not 'content')"
      )
      expect(message).toContain(
        "pages.how-many-balls~Type: a variant's name (after the ~) uses lower-case letters, digits and hyphens only"
      )
    })
  })

  test('sample: shows a variant with one of the page’s preview variants', () => {
    withContentCopy((contentDir) => {
      const pagesDir = path.join(contentDir, APPLY, 'pages')
      const source = fs.readFileSync(
        path.join(pagesDir, 'check-your-answers.md'),
        'utf8'
      )
      const withSample = (sample) =>
        source.replace('---\n', `---\nsample: ${sample}\n`)
      fs.writeFileSync(
        path.join(pagesDir, 'check-your-answers~sampled.md'),
        withSample('beginner')
      )
      const journey = loadJourney(APPLY, { contentDir })
      const page = journey.byId.get('check-your-answers')
      const variant = page.copyVariants.find((item) => item.id === 'sampled')
      const beginner = page.preview.variants.find(
        (item) => item.id === 'beginner'
      )
      expect(variant.page.copyVariant.sample).toBe('beginner')
      // Unless another is asked for
      expect(previewData(journey, variant.page)).toMatchObject(beginner.data)
      expect(previewData(journey, page).ballCount).not.toBe(
        beginner.data.ballCount
      )

      fs.writeFileSync(
        path.join(pagesDir, 'check-your-answers~sampled.md'),
        withSample('nope')
      )
      expect(problemsLoading(APPLY, contentDir)).toContain(
        "pages.check-your-answers~sampled: 'sample: nope' names none of the page's preview variants"
      )
    })
  })

  test('a shared page varies from the shared folder', () => {
    test.skip(!hasJourney(RENEW), `the ${RENEW} example has been removed`)
    withContentCopy((contentDir) => {
      const folder = path.join(contentDir, 'shared', 'one-login')
      const source = fs.readFileSync(
        path.join(folder, 'one-login-start.md'),
        'utf8'
      )
      // Reword the heading, which is the first H1 after the frontmatter
      // (the frontmatter has `# ` comments of its own)
      const [frontmatter, body] = source.split(/\n---\n/).slice(0, 2)
      fs.writeFileSync(
        path.join(folder, 'one-login-start~b.md'),
        `${frontmatter}\n---\n${body.replace(/^# .*$/m, '# Another start')}`
      )
      const page = loadJourney(RENEW, { contentDir }).byId.get(
        'one-login-start'
      )
      expect(copyVariants(page)).toEqual([
        {
          id: 'b',
          label: 'b',
          description: null,
          contentFile: 'content/shared/one-login/one-login-start~b.md'
        }
      ])
      expect(page.copyVariants[0].page.content.heading).toBe('Another start')
    })
  })
})

/**
 * Pages shared by more than one journey: `shared: true` reads the page's
 * copy from content/shared/pages/<id>.md, `shared: <folder>` from
 * content/shared/<folder>/<id>.md
 */
test.describe('journey engine: shared pages', () => {
  test.skip(!hasJourney(APPLY), `the ${APPLY} example has been removed`)

  test('shared: true takes the copy from content/shared/pages/', () => {
    withContentCopy((contentDir) => {
      const own = path.join(contentDir, APPLY, 'pages', 'start.md')
      const shared = path.join(contentDir, 'shared', 'pages', 'start.md')
      fs.mkdirSync(path.dirname(shared), { recursive: true })
      fs.writeFileSync(shared, '---\ntype: start\n---\n\n# Shared start\n')
      fs.rmSync(own)
      const file = path.join(contentDir, APPLY, 'journey.yaml')
      fs.writeFileSync(
        file,
        fs
          .readFileSync(file, 'utf8')
          .replace('  - id: start\n', '  - id: start\n    shared: true\n')
      )
      const page = loadJourney(APPLY, { contentDir }).byId.get('start')
      expect(page.contentFile).toBe('content/shared/pages/start.md')
      expect(page.content.heading).toBe('Shared start')

      // A page cannot be both shared and the journey's own
      fs.writeFileSync(own, '---\ntype: start\n---\n\n# Own start\n')
      expect(problemsLoading(APPLY, contentDir)).toMatch(/start/)
    })
  })

  test('the sign in pages come from their own shared folders', () => {
    test.skip(!hasJourney(RENEW), `the ${RENEW} example has been removed`)
    const journey = loadJourney(RENEW)
    expect(journey.byId.get('one-login-email').contentFile).toBe(
      'content/shared/one-login/one-login-email.md'
    )
    expect(journey.byId.get('government-gateway-sign-in').contentFile).toBe(
      'content/shared/government-gateway/government-gateway-sign-in.md'
    )
  })
})

/**
 * Markdown tables: a GOV.UK table, with a bold first cell as the row's
 * header and a right-aligned column as a numeric column, the way the
 * design system's tables are marked up.
 */
const {
  createMarkdown,
  interpolate
} = require('../../app/lib/journey-engine/markdown')

test.describe('journey engine: markdown tables', () => {
  const html = (markdown) => createMarkdown().render(markdown)

  test('a table gets the GOV.UK classes', () => {
    const out = html('| A | B |\n| - | - |\n| one | two |\n')
    expect(out).toContain('<table class="govuk-table">')
    expect(out).toContain('<thead class="govuk-table__head">')
    expect(out).toContain('<th class="govuk-table__header">A</th>')
    expect(out).toContain('<tbody class="govuk-table__body">')
    expect(out).toContain('<tr class="govuk-table__row">')
    expect(out).toContain('<td class="govuk-table__cell">one</td>')
  })

  test('a bold first cell is the row header', () => {
    const out = html('| A | B |\n| - | - |\n| **one** | **two** |\n')
    expect(out).toContain(
      '<th scope="row" class="govuk-table__header">one</th>'
    )
    // Only the first cell: other bold cells stay bold cells
    expect(out).toContain(
      '<td class="govuk-table__cell"><strong>two</strong></td>'
    )
  })

  test('a partly bold first cell is an ordinary cell', () => {
    const out = html('| A | B |\n| - | - |\n| **one** more | two |\n')
    expect(out).toContain(
      '<td class="govuk-table__cell"><strong>one</strong> more</td>'
    )
    expect(out).not.toContain('scope="row"')
  })

  test('a right-aligned column is numeric, without inline styles', () => {
    const out = html('| A | B |\n| - | -: |\n| **one** | 2 |\n')
    expect(out).toContain(
      '<th class="govuk-table__header govuk-table__header--numeric">B</th>'
    )
    expect(out).toContain(
      '<td class="govuk-table__cell govuk-table__cell--numeric">2</td>'
    )
    expect(out).not.toContain('style=')
  })
})

test.describe('journey engine: answers in copy', () => {
  test('a list answer is joined with commas, before any filter', () => {
    const data = { objects: ['balls', 'clubs'] }
    expect(interpolate('{{ objects }}', data)).toBe('balls, clubs')
    expect(interpolate('{{ objects | upper }}', data)).toBe('BALLS, CLUBS')
  })
})

test.describe('journey engine: Back links from emails', () => {
  test.skip(!hasJourney(APPLY), `the ${APPLY} example has been removed`)

  function problemsWith(edit) {
    return withContentCopy((contentDir) => {
      const file = path.join(contentDir, APPLY, 'journey.yaml')
      const yaml = fs.readFileSync(file, 'utf8')
      const edited = edit(yaml, contentDir)
      expect(edited).not.toBe(yaml)
      fs.writeFileSync(file, edited)
      return problemsLoading(APPLY, contentDir)
    })
  }

  test('a Back link to an email page is refused', () => {
    const message = problemsWith((yaml) =>
      yaml.replace(
        '  - id: ineligible\n',
        '  - id: ineligible\n    back: confirmation-email\n'
      )
    )
    expect(message).toContain(
      "pages 'ineligible': its Back link goes to the email 'confirmation-email'"
    )
  })

  test('so is the default Back link to the email whose link led here', () => {
    const message = problemsWith((yaml, contentDir) => {
      fs.writeFileSync(
        path.join(contentDir, APPLY, 'pages', 'licence-ready.md'),
        '---\ntype: content\n---\n\n# Your licence is ready\n'
      )
      return yaml
        .replace(
          '  - id: confirmation-email\n    back: confirmation\n',
          '  - id: confirmation-email\n    back: confirmation\n    next: licence-ready\n'
        )
        .concat('\n  - id: licence-ready\n')
    })
    expect(message).toContain(
      "pages 'licence-ready': its Back link goes to the email 'confirmation-email'"
    )
  })

  test('back: [] means no Back link, and is allowed', () => {
    const message = problemsWith((yaml, contentDir) => {
      fs.writeFileSync(
        path.join(contentDir, APPLY, 'pages', 'licence-ready.md'),
        '---\ntype: content\n---\n\n# Your licence is ready\n'
      )
      return yaml
        .replace(
          '  - id: confirmation-email\n    back: confirmation\n',
          '  - id: confirmation-email\n    back: confirmation\n    next: licence-ready\n'
        )
        .concat('\n  - id: licence-ready\n    back: []\n')
    })
    expect(message).toBe('')
  })
})

test.describe('journey engine: journey settings', () => {
  test.skip(!hasJourney(APPLY), `the ${APPLY} example has been removed`)

  function problemsWith(edit) {
    return withContentCopy((contentDir) => {
      const file = path.join(contentDir, APPLY, 'journey.yaml')
      fs.writeFileSync(file, edit(fs.readFileSync(file, 'utf8')))
      return problemsLoading(APPLY, contentDir)
    })
  }

  test('an unknown layout is refused', () => {
    expect(
      problemsWith((yaml) =>
        yaml.replace(
          '  - id: ineligible\n',
          '  - id: ineligible\n    layout: defra-id\n'
        )
      )
    ).toContain("pages.ineligible: unknown layout 'defra-id'")
  })

  test('participant: is staff or nothing', () => {
    expect(
      problemsWith((yaml) =>
        yaml.replace('start: start\n', 'start: start\nparticipant: council\n')
      )
    ).toContain("participant: unknown value 'council'")
    expect(
      problemsWith((yaml) =>
        yaml.replace('start: start\n', 'start: start\nparticipant: staff\n')
      )
    ).toBe('')
  })
})
