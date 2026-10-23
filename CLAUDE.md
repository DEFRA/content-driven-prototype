# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **GOV.UK Prototype Kit 14** app (Node.js 24, Express 5, Nunjucks, govuk-frontend 6), hosted on Defra's Core Delivery Platform (CDP), for prototyping user journeys in user research. Journeys are built from content files by a journey engine: page copy in markdown, flow in YAML, no HTML to write. UX and flow matter; production-grade security does not.

The three example journeys (`apply-juggling-licence`, `renew-juggling-licence`, `review-juggling-applications`) show every feature. A team may delete them; the engine specs then skip.

## Written copy is off limits without explicit instruction

**Never edit a `.md` file under `content/` (other than a `README.md`) unless the user has explicitly asked for that specific copy change in the current conversation.** These files are the content designer's words. A code, routing or test task is not permission to reword, reformat or "tidy" them; if a change seems to need it, propose the exact before/after wording and wait. `journey.yaml` is flow logic, not copy, and is not covered.

`.claude/settings.json` runs `.claude/hooks/guard-written-copy.sh` (needs `jq`) before every Edit/Write/Bash call and turns any write to `content/shared/**/*.md` (copy several journeys show) into a permission prompt, even in auto mode. A journey's own pages are not gated, so a change the user asked for lands without a prompt; always name every copy file you changed in your summary.

## Commands

```bash
nvm use                 # Node 24 (.nvmrc)
npm run dev             # http://localhost:3000 (PORT=3100 npm run dev for another port)
npm run test:e2e        # Playwright; starts its own `npm run dev` on :3300
npm run format          # prettier --write (cjs, js, json, md, scss)
npm run format:check
npm run screenshot:journey <id>   # JPG of every screen into screenshots/<id>/ (dev server must be running)
npm run handoff:manifest          # CI: bake handoff history into app/data/ (see below)
npm run handoff:snapshots         # CI: bake frozen handoff copies into app/data/handoffs/
```

Run one spec: `npx playwright test tests/e2e/smoke.spec.js`, or by title: `npx playwright test -g "start page"`.

Style (`.prettierrc.mjs`): **no semicolons, single quotes, no trailing commas, 2-space indent, brace every `if`/`for` body**. husky + lint-staged run `prettier --check` on staged files at commit time.

## Architecture: everything is a journey

- `content/<id>/journey.yaml` (flow, branching, session keys) and `content/<id>/pages/<page>.md` (copy, options, hints, errors) define a journey. `app/routes.js` mounts every content journey automatically at `/<id>` with `createJourneyRouter`; no route file, no registry entry. A new journey folder needs one restart to mount; after that, edits to copy, rules, or added and removed pages show without a restart, and `app/lib/journey-engine/watch.js` reloads the open browser tab.
- **`content/README.md` is the authoring guide and the reference for every page type, block, setting and `journey.yaml` key.** Read it before changing a journey.
- Bespoke behaviour goes in `app/lib/<id>/hooks.js` (keys are page ids: `load`, `get`, `validate`, `process`, `routes`; journey-wide: `context`, `scenario`, `preview`, `routes`; documented at the top of `app/lib/journey-engine/router.js`). Hooks and `basePath` changes need a restart.
- The engine is `app/lib/journey-engine/` (loader, router, flow, markdown, validation, back links, handoff history, snapshots, screenshots) with views in `app/views/journey-engine/`. Keep it free of anything journey-specific so it can become a package later.
- `app/config/shared/journeys.yaml` holds the homepage tabs (`families`) and any hand-coded journeys (`app/routes/<id>.js` + views, the plain kit way). `app/config/shared/journeys.js` merges those with every content journey; the homepage, `app/routes.js` and the tests read it. Homepage cards come from each journey's `homepage:` block: never edit `app/views/index.html` to change a card.
- `/tools/journeys/<id>` (`app/routes/tools.js`): flow diagram, live screen wall, scenarios, compare, JPG export. `/handoffs/<id>/<date|latest>/<page>` (`app/routes/handoffs.js`): frozen copies of handed-over pages.
- Shared pages: `shared: true` reads `content/shared/pages/<id>.md`; `shared: one-login | government-gateway` reads the mock sign in pages from `content/shared/<folder>/`. `app/lib/mock-sign-in.js` gives a journey working sign in and sign out: spread `...mockSignIn()` into its hooks and set `signedIn: { key: account, isSet: true }`.
- Research aids: the footer's Participant details box (`app/routes/research.js`, `includes/research-participant.html`) stores `data.researchParticipant`; hooks read it with `participantOf(data)` from `app/lib/research.js`. `research:` links in `journey.yaml` show in the footer.
- `app/lib/session-store.js` patches the kit's session file store to write atomically; required by `app/routes.js` before anything else.

## Session and validation

All state lives in `req.session.data` (the kit's file store under `.tmp/sessions/`). Form fields are kebab-case (`name="ball-count"`), session keys camelCase (`ballCount`). The engine validates on POST, re-renders the same page with the error on failure, and redirects (303) on success. Every error message comes from the page's `errors:` frontmatter; never hard-code wording in code.

Options a journey branches on carry an explicit `value:`; the loader refuses a rule that compares an answer with a value no option can store. The loader validates every journey on load and lists every problem, on the console and on the journey's homepage card.

## Tests

- **Tests must not hard-code journey copy.** Read headings, errors, option labels, field labels, buttons and links from `content/` through `copyOf(id)` in `tests/e2e/helpers/journey.js` (`answer`, `fillAnswer`, `fillField`, `submit`, `act`, `changeLink`, `expectHeading`, `expectError`...). Literals are fine for design-system chrome (`Continue`, `Back`, `Sign out`) and fixture data. `tests/e2e/test-conventions.spec.js` fails on literal heading/error assertions and `getByLabel(/regex/)`; `// copy-ok` at the end of a line is the escape hatch.
- A spec that writes into `content/` (copy-variants) removes what it wrote in `afterAll`. Engine tests that need a modified journey copy `content/` to a temporary folder and load it with `loadJourney(id, { contentDir })`.
- The frozen handoff specs skip until a `handoff:` date is committed. See `tests/README.md`.

## Design handoff

`handoff: YYYY-MM-DD` on a page entry in `journey.yaml` marks it ready for dev. `app/lib/journey-engine/history.js` asks git whether the copy changed since (turquoise/yellow tags on the tools page and homepage card). A deployed prototype has no `.git`, so the Publish workflow runs `npm run handoff:manifest` and `npm run handoff:snapshots` to bake `app/data/content-history.json` and `app/data/handoffs/`, and `scripts/handoff-tags.js --push` tags each new handoff `handoff/<journey>/<date>`. Locally, a screen wall card's ⋯ menu writes, re-dates, removes or undoes the line (`handoff-marks.js`, a one-line text edit so YAML comments survive).

Links to the copy as handed over use `repoUrl()` in `history.js`: `REPO_URL` env, else the git remote `origin`, else the URL baked into the manifest.

## Conventions and gotchas

- **British English** in copy and comments (colour, organise, licence as a noun). GOV.UK style: sentence case, no full stops in headings, "you" for the user.
- GOV.UK macros (`govukButton`, `govukRadios`...) are global in views: no `{% from %}` imports needed. The kit's nunjucks has no `{% set %}…{% endset %}` capture inside macros, and macros cannot see the template context.
- **Decide every new page's Back link**: a page reached from an email or a new tab gets `back: []`. The loader refuses a Back link to a `layout: email` page.
- Prototype security posture: mock sign in, placeholder contact details, basic server-side validation. No secrets in the repo: `.env` is gitignored. Redirects only to internal paths.
- Environment: `PUBLIC_BASE_URL` (the tools page's copy-link buttons), `REPO_URL` (links to the copy as handed over), and in production `PASSWORD`. On CDP, secrets go in the Portal and other variables in `cdp-app-config`; the image sets `USE_HTTPS=false`. See README.md, "Hosting on CDP".
- `.npmrc` (from the CDP template) sets `ignore-scripts=true` and `min-release-age=7`: install scripts never run (run `npx husky` once to set up the git hook), and npm refuses a package version published less than 7 days ago. Pin an older version rather than turning that off.
- When port 3000 is busy, run a second instance with `PORT=3100 npm run dev`.
