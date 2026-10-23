# Journey Prototype Kit: porting plan

**Status (23 October 2026): phases 1 to 5 done, moved onto CDP's prototype
template as `DEFRA/content-driven-prototype`.** See ISSUES.md for what changed
along the way, what was fixed, and what is still open. Phase 6 is for later.

A GOV.UK Prototype Kit 14 with the content-driven journey workflow from
`DEFRA/nrf-prototypes`, but none of the NRF journeys, maps or Defra
infrastructure. Other teams can pick it up without forking NRF.

## Is it feasible?

Yes. The workflow is already mostly separate from NRF:

- `app/lib/journey-engine/` (about 5,900 lines) has roughly 30 NRF or Defra
  references, and most of those are comments. Only four are real coupling
  (see "Generalise" below).
- The engine needs only `js-yaml`, `markdown-it`, `markdown-it-container`,
  `multer` and `archiver`, plus Playwright for screenshots.
- None of the engine's or tools' routes use the patterns Express 5 broke
  (`*` wildcards, `:param?`). Kit 14 moves to Express 5, so this matters.

Most of the work is generalising the remaining NRF assumptions, writing a
neutral example journey and rewriting the docs. Translating the engine
itself should be small.

## What comes over

| Feature                                                | Source in nrf-prototypes                                                                                                                                    | Notes                                                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Journey engine (markdown pages + `journey.yaml` flow)  | `app/lib/journey-engine/`, `app/views/journey-engine/`                                                                                                      | Core of the port                                                                            |
| Live reload on content edits                           | `journey-engine/watch.js`                                                                                                                                   | As is                                                                                       |
| Journey registry and homepage cards                    | `app/config/shared/journeys.js`, `app/views/index.html`, `includes/journey-card.html`                                                                       | Drop the legacy hand-coded journey path, or keep it optional; families come from config     |
| Tools: flow diagram, screen wall, compare, screens.zip | `app/routes/tools.js`, `app/views/tools/`                                                                                                                   | Hosted URL moves to config                                                                  |
| Copy variants (`page~name.md`)                         | engine                                                                                                                                                      | As is                                                                                       |
| Preview data and `?preview=1`                          | engine                                                                                                                                                      | As is                                                                                       |
| Design handoff: tags, history, frozen snapshots        | `history.js`, `snapshots.js`, `handoff-marks.js`, `app/routes/handoffs.js`, `scripts/handoff-*.js`, `scripts/content-history.js`                            | Repo URL moves to config                                                                    |
| Research participant box                               | `app/routes/research.js`, `includes/research-participant.html`                                                                                              | Remove the LPA and request-to-use specifics                                                 |
| Mock sign-in pages                                     | `content/shared/one-login`, `government-gateway`, layouts                                                                                                   | One Login and Government Gateway are cross-government; Defra ID becomes optional            |
| `staff` layout (internal case-work)                    | `includes/staff-header.html`, `_staff.scss`                                                                                                                 | Generic                                                                                     |
| Session file-store fix                                 | `app/lib/session-store.js`                                                                                                                                  | Check it still applies to kit 14's session store                                            |
| Playwright helpers that read copy from content         | `tests/e2e/helpers/journey.js`, `test-conventions.spec.js`, `journey-engine.spec.js`, `copy-variants.spec.js`, `handoffs-frozen.spec.js`, `tools-*.spec.js` | Point them at the example journey                                                           |
| Written-copy guard hook                                | `.claude/hooks/guard-written-copy.sh`, `.claude/settings.json`                                                                                              | As is                                                                                       |
| Agent instructions                                     | `CLAUDE.md`                                                                                                                                                 | Rewrite, keeping only the general conventions (no cursor rules: they serve older workflows) |
| Prettier, husky, lint-staged, editorconfig, nvmrc      | repo root                                                                                                                                                   | As is (Node 22+)                                                                            |
| Publish workflow                                       | `.github/workflows/publish.yml`                                                                                                                             | Keep the handoff steps; leave the deploy step for each team to choose (CDP is Defra-only)   |

## What stays behind

All `nrf-*`, `lpa-*`, `edp-search`, `applications*` and `case-management`
journeys, plus everything for maps: `@defra/interactive-map`, tileserver,
`os-base-map`, `map-tiles`, EDP data, turf, MBTiles, tippecanoe. The prompt
files and the commands that serve the old prompt-driven journeys
(`journey-updates`, `phase-review`, `fix-journey-prompt`, `sync-instructions`)
also stay. Maps could come back later as an optional add-on.

## Generalise

The NRF coupling found in the reusable code:

- `journey-engine/validation.js` imports `validateEmail` from
  `../nrf-estimate-3/validators`. Move it into the engine.
- `journey-engine/history.js` hard-codes `REPO_URL` for DEFRA/nrf-prototypes.
  Read it from config or `git remote`.
- `app/routes/tools.js` hard-codes the hosted URL `nrf-prototypes.ext-test.cdp.defra.gov.uk`.
  Use config or an env variable.
- `journey-engine/_page.html` builds the `@defra/interactive-map` asset path.
  Load map assets only when a maps add-on is installed.
- The page layouts list (`loader.js`, `_page.html`): keep `one-login`,
  `government-gateway`, `email` and `staff`. Make `defra-id` and
  `defra-account` an opt-in Defra add-on.
- `app/routes/research.js` contains journey-specific prefill. Move it behind
  hooks.
- Homepage families (quote, request to use, LPA): set in config instead of
  the template.
- `scripts/screenshot-capture.js` (60 NRF references): drop it in favour of the
  engine's `screenshots.js` and `export-screens.js`.

## Upgrade risks (kit 13.17 → 14.0.1)

- **Express 5**: no incompatible route patterns found. Still smoke-test every
  tools and handoff route, and check that `req.query` and `req.body` work as
  before for POSTs with no body.
- **govuk-frontend 6.6** (NRF uses 6.5.1): small jump.
- **dotenv**: the kit now uses Node's built-in `.env` support, so keeping
  `dotenv` as our own dependency is optional.
- **bundleDependencies**: the kit now ships its own copies of its
  dependencies, so `require('express')` etc. from our code needs its own
  dependency.
- **Legacy pattern CSS removed**: start pages need `@govuk-prototype-kit/common-templates`,
  which the scaffold already includes.

## Phases

1. **Core engine**: copy the engine, its views, the registry and homepage.
   Remove the NRF coupling above. Add a neutral example journey (for example,
   "Apply for a licence": start page, radios, text input, check answers,
   confirmation, one branch, one copy variant). Done when `npm run dev`
   shows the example and live reload works.
2. **Tools and handoff**: the tools page, screens.zip, compare, handoff marks,
   frozen snapshots and their scripts. Done when the screen wall works and a
   handoff is frozen and served.
3. **Research aids and mock sign-in**: participant box, One Login and
   Government Gateway pages, `staff` layout.
4. **Tests and CI**: Playwright helpers and the engine and convention
   specs, run against the example journey. A `test.yml` workflow and a
   publish workflow template that doesn't assume any hosting.
5. **Docs and agent setup**: README for designers (based on
   `content/README.md`), a generic `CLAUDE.md`, the written-copy hook and a
   short "start a new journey" guide. No cursor rules.
6. **Optional add-ons, later**: maps, the Defra ID pages, and turning the
   engine into an npm package so teams get fixes by bumping a version
   instead of copying files.

## Distribution decision (open)

- **Template repo (start here)**: teams copy it and own it. Quickest to get
  going, but improvements made in NRF or this repo don't reach the copies
  automatically.
- **npm package of the engine (later)**: a kit plugin for views and assets,
  plus one `require(...)` line in `app/routes.js` to mount the routes. Fixes
  reach every team with a version bump. Worth doing once a second team
  depends on it, and NRF could then use the same package.

Keeping the engine self-contained under `app/lib/journey-engine/` in phase 1
leaves that extraction open.
