---
name: new-journey
description: Start a new content-driven journey from a description, a list of pages or a spec, following content/README.md
parameters:
  - name: id
    description: The journey id, used as its URL and folder name (e.g. 'register-a-boat')
    required: true
  - name: spec
    description: What the journey does, or a path to a file describing its pages, questions and branches
    required: true
---

# New journey

Create the content-driven journey `{{id}}` from `{{spec}}`.

## Before you start

1. Read `content/README.md`: it is the reference for every page type, block, setting and `journey.yaml` key. Use only what it describes.
2. Read `content/apply-juggling-licence/` (journey.yaml and pages/) as the worked example, and `content/renew-juggling-licence/` if the journey needs sign in.
3. If the spec is unclear about a page's type, where an answer leads, or the wording, ask before writing. Do not invent copy beyond what the spec says: where wording is missing, write a short placeholder that reads as one (`[Hint about what counts]`) and list it in your summary.

## Build it

1. Create `content/{{id}}/journey.yaml` with `id`, `name`, `serviceName`, `start`, `summaryPage` (if there is a check your answers page), a `homepage:` block (a family from `app/config/shared/journeys.yaml`, `status: in-progress`), `session:` listing every key the journey writes, and `preview.data` with a sample answer for every key.
2. Create one `content/{{id}}/pages/<page>.md` per screen, in GOV.UK style and British English. Every question page has `errors:` with at least `required`, and a `button`.
3. Give every option the journey branches on an explicit `value:`.
4. Decide every page's Back link (see "Back links" in the guide): `back: []` for a page reached from an email or a new tab.
5. Pages reachable from check your answers get `changeable: true` and a `$navFromSummary` rule ending in `goto: $summary`.
6. Behaviour that no setting covers (a reference number made on submit, a lookup, sign in) goes in `app/lib/{{id}}/hooks.js`. For sign in, spread `...mockSignIn()` from `app/lib/mock-sign-in.js` and list the shared sign in pages as `renew-juggling-licence` does.

## Check it

1. `node -e "require('./app/lib/journey-engine/loader').loadJourney('{{id}}')"` from the repo root: it throws with every problem listed. Fix them all.
2. Restart `npm run dev` if it is running, so the journey mounts. Open `/tools/journeys/{{id}}` and check the flow diagram matches the spec and every screen on the wall renders.
3. `npx playwright test tests/e2e/smoke.spec.js` (it covers the new journey's first page).
4. `npm run format`.

## Summary

Tell the user: the journey's URL and tools page, every page you created, any placeholder copy you wrote, and any part of the spec you could not express with the engine's settings.
