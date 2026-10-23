# End-to-end tests

Playwright tests for the prototype: the app starts, every journey's first page loads, and the journey engine, the tools page, the design handoff and the research aids work.

## Running the tests

```bash
npm run test:e2e
```

Playwright starts its own `npm run dev` on port 3300, so the dev server on 3000 can keep running. A test server left running on 3300 is reused.

- `npm run test:e2e:headed`: with a visible browser
- `npm run test:e2e:ui`: Playwright's interactive runner
- `npm run test:e2e:debug`: step through with the debugger
- `npx playwright test tests/e2e/smoke.spec.js`: one spec
- `npx playwright test -g "start page"`: tests whose title matches

The first time, install the browser with `npx playwright install chromium`.

## What the specs cover

| Spec                                   | What it checks                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `smoke.spec.js`                        | The homepage and every journey's first page load, and every journey in `content/` loads without problems   |
| `journey-engine.spec.js`               | The loader's checks: option values, copy variants, shared pages, Back links from emails, layouts           |
| `copy-variants.spec.js`                | `?copy=` and `?_copy=`, the screen wall's variant cards, the compare page and the JPG export               |
| `tools-handoff.spec.js`                | `handoff:` dates on the tools page and homepage card, the handoff history, marking pages from the wall     |
| `handoffs-frozen.spec.js`              | Frozen copies at `/handoffs/<journey>/<date>/<page>`                                                       |
| `tools-scenarios.spec.js`              | The Scenarios tab: preview variants, columns and live scenarios                                            |
| `research-participant.spec.js`         | The footer's Participant details box and the hooks that use it                                             |
| `apply-juggling-licence.spec.js`       | The example journey end to end                                                                             |
| `renew-juggling-licence.spec.js`       | The mock One Login and Government Gateway sign in, sign out, and exits to other journeys on the tools page |
| `review-juggling-applications.spec.js` | The `staff` layout                                                                                         |
| `test-conventions.spec.js`             | The other specs read journey copy from `content/` (see below)                                              |

The engine specs exercise the engine through the three example journeys. A spec whose journey has gone skips rather than fails, so you can delete the examples when you start your own journeys; delete their specs at the same time to tidy up.

`smoke.spec.js` needs no changes for a new journey: it reads the journeys from `app/config/shared/journeys.js`.

### Handoff specs skip until a handoff is committed

The frozen copy specs need a `handoff:` date that is committed, because a frozen copy is the content at the commit that wrote the date. Until then they skip (`no committed handoff to freeze`). The example journey's dates count once they are committed.

## Tests must not hard-code journey copy

Content designers reword pages in `content/` without running the tests, so a test that spells out a heading, an error message or an option label breaks on every reword. Instead, specs read the copy from the content files through `tests/e2e/helpers/journey.js`:

```js
const { copyOf } = require('./helpers/journey')
const { answer, fillAnswer, fillField, submit, expectHeading, expectError } =
  copyOf('apply-juggling-licence')

await answer(page, 'how-many-balls', 'three-or-more') // an option by its value
await fillField(page, 'your-details', 'full-name', 'Jo Bloggs') // a form field by name
await submit(page, 'your-details') // the page's own button text
await expectHeading(page, 'check-your-answers')
await expectError(page, 'how-many-balls') // the page's `required` error
```

Pages are named by id, options by their `value` and form fields by their `name`: the identifiers the journey's logic already depends on. `followLink(page, id, target)` finds a body link by where it goes, `followResearchLink(page, id, target)` opens a footer user research link's page by where it goes, `changeLink(page, id, target)` finds a summary row's Change link by the page it changes, and `expectBodyCopy(page, id, phrase)` keeps a prose assertion literal but fails naming the content file when the phrase is gone.

Literals are fine for design-system chrome (`Continue`, `Back`, `Sign out`, `There is a problem`) and for fixture data (`JL-123456`, `Jo Bloggs`). `tests/e2e/test-conventions.spec.js` scans the specs and fails on the idioms that used to break: a heading or error summary asserted against a literal string, and `getByLabel(/regex/)`. End a statement with `// copy-ok` if it really must keep one.

Branching options carry an explicit `value:` in their page file, and the loader refuses a `journey.yaml` that compares an answer with a value none of the page's options can store (see `content/README.md`), so a reword can't send the journey the wrong way either.

## Debugging failed tests

- `npm run test:e2e:headed` to watch
- screenshots of failures are saved in `test-results/`
- `npx playwright show-report` opens the HTML report

**Port 3300 in use:** stop the leftover test server.

**Tests time out:** check the test server starts with `PORT=3300 npm run dev`.
