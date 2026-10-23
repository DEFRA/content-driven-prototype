# Porting notes and issues

Running log from porting `../nrf-prototypes` to this kit, phase by phase
(see PLAN.md). **Fixed** items are done here; **NRF** marks a bug that also
exists in nrf-prototypes and is worth fixing there; **Open** needs a
decision or more work.

## Start here: what needs you

1. **Not committed or pushed yet.** The work sits on top of the CDP
   template's two commits in `DEFRA/content-driven-prototype` (see "Moving
   onto the CDP template" at the end). Review, then commit and push. The 12
   skipped tests (frozen handoff copies) start running once the example's
   `handoff:` dates are committed.
2. **First deploy.** Pushing to `main` runs the Publish workflow (handoff
   steps, then the CDP build action); deploy from the CDP Portal. Before
   that, add a `PASSWORD` secret in the Portal, and once you know the
   prototype's address, set `PUBLIC_BASE_URL` in cdp-app-config.
3. **Licence check.** The engine is Defra's code under OGL v3, and this is a
   Defra repo with the same licences, so this is now mostly settled. Still
   worth a word with whoever owns nrf-prototypes.
4. **Worth fixing in NRF** (marked **NRF** below): the checkboxes sample-answer
   bug, comma-less list answers, `<input type="number">`, multer and
   markdown-it advisories, Node 20 in `test.yml`, a brittle handoff test,
   and `.husky` with no `prepare` script. NRF's
   `.claude/commands/phase-review.md` also belongs to another project (the
   "NRF Impact Assessment Worker").
5. **Distribution** (PLAN.md): a template others copy now, an npm package
   later. Nothing here blocks either.

## Phase 1: core engine, homepage, example journey

- **Fixed, NRF**: `loader.js` refused a list as a checkboxes answer in
  `preview.data` (`'balls,clubs' is not an answer…`), because it compared
  `String(array)` with each option. It now checks each item. NRF never hit
  this because no NRF journey has sample answers for a checkboxes page.
- **Fixed, NRF**: a checkboxes answer printed with `{{ key }}` showed as
  `Balls,Rings`. `markdown.js` now joins a list with `, ` before any
  filters run.
- **Fixed**: `validation.js` imported `validateEmail` from
  `app/lib/nrf-estimate-3/validators`. It's now inside the engine.
- **Fixed**: `router.js` imported `../map/production-services` to set
  `hasOsKey` and `hasAerial` for the Defra map plugin. Both are removed.
- **Fixed**: `history.js` hard-coded `REPO_URL` to DEFRA/nrf-prototypes. It's
  now `repoUrl()`: `REPO_URL` env, else the git remote `origin`, else
  `repoUrl` baked into `app/data/content-history.json` by
  `npm run handoff:manifest`. Links are left out when none is known.
  Link shapes (`/tree/`, `/blob/`, `/commit/`) are GitHub's; GitLab redirects
  most of them, but other hosts may not work.
- **Fixed**: the `defra-id` and `defra-account` layouts (and their Sass, the
  `Defra ID` group title) are gone. A journey using them now fails to load
  with an "unknown layout" problem.
- **Fixed**: `_page.html` loaded `@defra/interactive-map` assets whenever a
  page had a `:::map` block. `:::map` now always draws the inline SVG.
- **Open**: `:::map` still defaults to the `redlineBoundaryPolygon` session
  key, an NRF name. It's harmless, but a maps add-on should take this on.
- **Checked**: kit 14's `session-file-store.js` is byte-for-byte the same as
  13.17's, so `app/lib/session-store.js` (atomic session writes) still
  applies.
- **Checked**: kit 14's browser-sync still watches `.tmp/public/**`, so
  `watch.js` live reload works unchanged.
- **Checked**: Express 5 routing. The journey dispatcher, POST redirects
  (303), `?preview=1`, `?errors=false`, `?_copy=` and the research footer
  links all behave as in NRF.
- **Open (upstream)**: `npm run dev` prints
  `DeprecationWarning: The util._extend API is deprecated`. It comes from a
  dependency of the kit itself, not our code.
- **Dropped**: the NRF footer loaded
  `https://mcp.figma.com/mcp/html-to-design/capture.js` on every page (for
  Figma's html-to-design). It's left out until the Figma sync is ported; see
  phase 2.
- **Dropped**: NRF's generic filters in `app/filters.js` (`formatCurrency`
  etc.) aren't used by any engine view, so the kit's empty `filters.js`
  stays.

## Phase 2: tools and design handoff

- **Fixed**: `app/routes/tools.js` defaulted `PUBLIC_BASE_URL` to the NRF
  CDP URL. Without the env variable it now uses the address the wall was
  opened on. **Set `PUBLIC_BASE_URL` on the hosted prototype** (and locally,
  if you want copied links to work for other people).
- **Fixed**: the "Copy at handoff" link on the tools page is left out when
  `repoUrl()` finds no repository.
- **Checked** (in a throwaway git copy with a GitHub-style remote):
  `handoff:manifest`, `handoff:snapshots` and `handoff:tags`;
  `/handoffs/<journey>/latest|<date>/<page>` with the Frozen and Not handed
  over banners; the frozen copy ignores a later copy edit; the tools page's
  Ready for dev table and its "Copy at handoff" links; and the ⋯ menu's
  mark, re-date and undo endpoints, which edit one line of `journey.yaml`.
- **Checked**: the tools page, flow.json, flow.mmd, compare, single-screen
  JPG (with `?error=max`) and screens.zip. Playwright is now a dev
  dependency (1.57.0, as NRF) because the export needs it.
- **Dropped**: `scripts/sync-to-figma.js`, a one-off hard-coded to one NRF
  Figma frame and a legacy view. The `/figma-journey` command and the
  html-to-design capture script stay behind too. A generic Figma sync could
  come later as an add-on.
- **Dropped**: `scripts/screenshot-capture.js` (puppeteer, NRF journeys
  hard-coded). `npm run screenshot:journey <id>` covers it.
- **Inherited (cosmetic)**: on the tools page the GOV.UK header runs to the
  left edge of the window, and a `max` error preview shows the sample
  answer (6) beside "must be 100 or fewer". NRF looks the same; neither was
  changed.
- **Note**: the engine sends a start page's Back link to the prototype
  homepage (`back-link.js`). That's deliberate, not a bug.

## Phase 3: research aids, mock sign in, staff layout

- **Changed**: NRF's participant box asked for an "organisation or client",
  or a "local planning authority" on the LPA journey (stored separately as
  `lpa`). There's now one `organisation` field. A journey for staff sets
  `participant: staff`, so the box speaks to the participant and the staff
  header shows their name and organisation. The loader rejects any other
  `participant:` value.
- **New**: `app/lib/research.js` exports `participantOf(data)`, which NRF
  kept inside one journey's hooks. The example uses it to pre-fill the name
  on `your-details`.
- **New**: `app/lib/mock-sign-in.js` gives any journey working One Login and
  Government Gateway sign in, plus a sign-out route, with
  `...mockSignIn()` in its hooks. In NRF this was mixed into the
  request-to-use hooks with NRF's account types (individual, company,
  agent, Defra ID registration). Those NRF rules become the `account()`
  option.
- **Engine change**: a journey's hooks can now have a journey-wide
  `routes(router, journey)`. Before, route hooks were only registered under
  a page id, so the sign-out route had to hang off a sign-in page. NRF
  could use this too.
- **Changed**: `_signed-in-bar.html` showed NRF's "agent" bar (organisation
  name and a link to a `sign-in-method` page). It now shows `account.actingFor`
  with an optional Change link to `account.changeActingFor`.
- **New examples**: `renew-juggling-licence` (sign in with One Login or
  Government Gateway, signed-in header, sign out) and
  `review-juggling-applications` (`layout: staff`, `participant: staff`, the
  header's menu and account, a table, a record, a decision).
- **Copied as is**: `content/shared/one-login/` and
  `content/shared/government-gateway/`. Only the YAML comments that
  mentioned NRF's account types changed; the page copy is untouched.
- **Dropped**: Defra ID registration pages (`content/shared/defra-id/`),
  their layouts and headers.
- **Checked**: both sign-in routes end to end (including creating
  Government Gateway details, the minted user ID, and the participant's
  name pre-filling the name page), guards before signing in, sign out
  clearing the session keys, `?participant`, the participant box's
  redirect refusing an off-site `_return`, and the One Login, Government
  Gateway, staff and participant box screens.

## Phase 4: tests and CI

- **Fixed, NRF**: number pages rendered `<input type="number">`. The GOV.UK
  Design System advises against it, and it meant the `invalid` ("must be
  a number") error could never show in a real browser, since browsers
  refuse non-digits. It's now a text input with `inputmode="numeric"`
  (`views/journey-engine/input.html`).
- **Fixed, NRF (security)**: `npm audit` flagged our direct dependencies
  `multer` (2.0.2, several high-severity DoS advisories) and `markdown-it`
  (14.3.1). They're now 2.5.0 and 14.3.3, both minor bumps. NRF pins the same
  old versions. The other findings (braces, chokidar, micromatch,
  follow-redirects, nodemon, nunjucks, browser-sync) are inside
  `govuk-prototype-kit` 14.0.1's bundled dependencies, so only a kit
  release can fix them.
- **Fixed, NRF (test)**: `handoffs-frozen.spec.js` "another page starts from
  the newest handoff of that date" picked the first page that wasn't the
  stamped one. It only passed in NRF because that page happened to be
  unstamped. It now picks an unstamped page.
- **Fixed, NRF (CI)**: NRF's `test.yml` runs Node 20 while `.nvmrc` says 22.
  Ours reads `.nvmrc` (kit 14 needs 22 or later), checks formatting, and
  fetches full history so the handoff specs can see git.
- **Changed**: the specs are ported to the three example journeys, with new
  specs for each example (sign in, sign out, staff layout, exits). A spec
  whose example journey has been deleted skips rather than fails.
- **New**: the smoke spec also loads the entry page of journeys that don't
  start at `/start` (the staff example), and fails if any journey in
  `content/` doesn't load.
- **New**: the apply example gained a file upload (`trick-photo`) so the
  multer path is covered, plus a live scenario, preview variants, a
  scenarios column and three `handoff:` dates, so the scenario and handoff
  specs have something to test.
- **Status**: 91 passed, 12 skipped. The 12 are the frozen-copy tests, which
  need the `handoff:` dates committed. In a throwaway copy with everything
  committed, all handoff, frozen and copy-variant specs pass with no skips.
- **Checked**: production mode (`NODE_ENV=production npm start`) in a copy
  with no `.git`, after `handoff:manifest` and `handoff:snapshots` ran in a
  git checkout. Frozen pages, the commit and "Copy at handoff" links (repo
  URL from the manifest) and the homepage "ready for dev" count all work;
  marking from the wall is switched off.
- **New, untested**: a plain `Dockerfile` (official `node:22-alpine`). The
  Docker daemon wasn't running here, so the image was never built. Running
  the same steps by hand (`npm ci --omit=dev --ignore-scripts`, copy `app/`
  and `content/`, `npm start`) works.
- **New**: `.github/workflows/publish.yml` tags handoffs and bakes the
  manifest and snapshots, then stops: **the deploy step is left for each
  team** (NRF's used Defra's CDP build action).
- **Fixed**: `"prepare": "husky || true"`, so a host that installs with
  `--omit=dev` doesn't fail when husky is missing. NRF has a `.husky/`
  folder but no `prepare` script, so its hook may never be installed on a
  fresh clone.
- **Note**: `.prettierrc.js` is CommonJS here (NRF's uses `export default`,
  which relies on Node's ESM detection).
- **Note**: production mode redirects to HTTPS unless `USE_HTTPS=false`,
  and kit 14's password form field is `password`. Both matter on hosting.

## Phase 5: docs and agent setup

- **New**: `README.md` (what it is, getting started, the examples, making
  your own journeys, research aids, tests, hosting, licence) and
  `content/README.md` (the authoring guide: NRF's, rewritten around the
  examples, with new sections on signing in, sample answers and
  scenarios, and research aids).
- **New**: `CLAUDE.md` with the general conventions (no cursor rules, as
  agreed), and a `/new-journey` command that builds a content journey
  from a description or spec, then checks it loads and renders.
- **Ported**: the written-copy guard hook. It gates `content/shared/**/*.md`
  (NRF also gated `prompts/`, which doesn't exist here). Checked with
  sample tool calls: a shared page asks, a journey's own page and a README
  pass. It needs `jq`.
- **Not ported**: NRF's Claude commands (`journey-updates`,
  `fix-journey-prompt`, `sync-instructions`, `content-review`,
  `screenshot-prototype`, `code-review`, `phase-review`). They serve the old
  prompt-to-Nunjucks workflow, or another project.
- **Licence**: NRF's `LICENSES/` (MIT for the kit, OGL v3 for Defra's code)
  replaces the scaffold's `LICENCE.txt`, and `package.json` uses NRF's
  licence string. See item 4 at the top.
- **Checked**: copying `apply-juggling-licence` to a new id loads as a new
  journey (the "Adding a new journey" steps); `npm run screenshot:journey`
  exports every screen and scenario.
- **Final state**: `npm run format:check` clean; `npm run test:e2e` 91
  passed, 12 skipped (see item 1 at the top).

## Moving onto the CDP template

The repo `DEFRA/content-driven-prototype` was created from CDP's prototype
template: the plain GOV.UK Prototype Kit (13.20.4) with CDP's Dockerfile,
publish workflow and settings. The port was laid on top of it, keeping
CDP's platform files:

- **Kept from CDP**: `Dockerfile` (Defra's node images), `publish.yml`
  (CDP build action), `.npmrc`, `.nvmrc` (Node 24), `.prettierrc.mjs` and
  Prettier 3.9.6, `.env.template`, `LICENSES/` (identical to ours), and the
  README's CDP sections (passwords, secrets, environment variables, Docker).
- **Added to CDP's files**: the Dockerfile copies `content/`; the publish
  workflow fetches full history and runs the handoff steps (tags,
  manifest, snapshots) before the build action, the same steps NRF's
  publish workflow runs on CDP; `.env.template` documents `PUBLIC_BASE_URL`
  and `REPO_URL`; `.gitignore` gains the generated files.
- **Changed from CDP**: kit 13.20.4 → 14.0.1, govuk-frontend 6.5.0 → 6.6.0,
  common-templates 3.0.0 → 3.0.1. `app/config.json` drops the `rebrand`
  setting, which kit 14 no longer needs.
- **Dropped from ours**: our Dockerfile (`node:22-alpine`) and our
  deploy-less publish workflow.
- **multer 2.4.0, not 2.5.0**: CDP's `.npmrc` has `min-release-age=7`, and
  2.5.0 was published on 22 October. 2.4.0 (14 September) has no audit
  findings. The same rule blocked kit 14.0.1 until 09:51 UTC on 23
  October, so `npm install` failed until then.
- **`ignore-scripts=true`** in CDP's `.npmrc` means `npm install` never runs
  `prepare`, so the husky git hook is only set up by running `npx husky`
  once. CI's format check still catches unformatted code.
- **Node 24**: the engine and tests were built on Node 24.14 locally, so
  this matches what was tested. Kit 14 needs 22 or later.
