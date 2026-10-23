# content-driven-prototype

The [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/) with content-driven journeys, and tools for user research and design handoff.

- **Pages are markdown, flow is YAML.** Each screen is one `.md` file of copy (heading, hint, options, errors, button); `journey.yaml` says where each answer leads. Content designers edit the copy directly; nothing to build and no restart.
- **See the whole journey at once.** `/tools/journeys/<id>` draws the flow and shows every screen live, side by side, with error states, copy variants and other states, and exports them all as JPGs.
- **Try variations.** A `page~b.md` beside a page is another version of its copy, to compare side by side or walk a participant through.
- **Research aids.** A Participant details box that puts the participant's own name into the prototype, footer shortcuts for the facilitator, scenarios that open a page with answers already given, and a switch to turn validation off.
- **Mock sign in.** GOV.UK One Login and Government Gateway pages any journey can use.
- **Design handoff.** Put a date on a page when it's ready to build: it's tagged in git, marked on the tools page, flagged when the copy changes afterwards, and kept as a frozen copy at a link that won't move.

It started life in Defra's Nature Restoration Fund prototype and is the same engine with the service-specific parts taken out. It runs on Defra's Core Delivery Platform (CDP), from the CDP prototype template.

## Getting started

You need [Node.js 24](https://nodejs.org/) (`nvm use` reads `.nvmrc`).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The homepage lists three example journeys:

| Journey                                                                      | Shows                                                                                                                            |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Apply for a juggling licence](content/apply-juggling-licence)               | Every question type, a branch out, check your answers, a confirmation and its email, a copy variant, scenarios and handoff dates |
| [Renew a juggling licence](content/renew-juggling-licence)                   | Signing in with the mock GOV.UK One Login or Government Gateway, signing out, and leaving for another journey                    |
| [Review juggling licence applications](content/review-juggling-applications) | An internal service on the staff layout                                                                                          |

Open a journey's tools page from its card to see the flow and every screen.

## Making your own journeys

**[content/README.md](content/README.md) is the guide**: every page type, block, setting and journey option, with examples. In short:

1. Copy `content/apply-juggling-licence/` to `content/<your-journey>/` and change the `id` and names at the top of `journey.yaml`.
2. Edit the pages in `pages/` and the flow in `journey.yaml`.
3. Restart `npm run dev` once, so the new journey mounts. After that every edit shows straight away.

Change the homepage tabs and the prototype's name in `app/config/shared/journeys.yaml` and `app/config.json`.

When you no longer need the examples, delete their folders in `content/` and `app/lib/`, and their specs in `tests/e2e/` (`apply-juggling-licence.spec.js`, `renew-juggling-licence.spec.js`, `review-juggling-applications.spec.js`). The engine's own specs skip once the examples are gone.

You can still make pages the usual Prototype Kit way, in `app/views/` with routes in `app/routes.js`, alongside the content journeys.

### With Claude Code

`CLAUDE.md` tells Claude Code how the prototype works, and `/new-journey <id> <description>` starts a journey from a description or a spec. A hook asks before Claude changes copy in `content/shared/`, which several journeys share.

## Testing with the prototype

- **Participant details**: the footer link on every page asks for the participant's name and organisation, which the prototype then uses wherever it would otherwise make a name up.
- **Turn errors off**: the footer link lets a participant click through without filling anything in.
- **Seeing any screen without walking the journey**: add `?preview=1` to a page's URL to see it with sample answers.
- **Scenarios**: the Scenarios tab on a journey's tools page lists other states of each page; a live scenario opens the page for real, with answers already given.
- **Copy variants**: `?copy=<name>` shows a page's `~<name>` copy for the rest of the session.

## Tests

```bash
npm run test:e2e
```

Playwright checks the app starts, every journey's first page loads, and the engine and tools behave. Tests read the copy from `content/`, so rewording a page never breaks them. See [tests/README.md](tests/README.md).

`npm run format` formats the code; a git hook checks staged files.

## Hosting on CDP

The prototype is deployed from the CDP Portal. Pushing to `main` runs `.github/workflows/publish.yml`, which tags each new design handoff, bakes the handoff history and frozen copies into `app/data/` (a deployed prototype has no `.git` folder to ask), then builds and publishes the image with the CDP build action. Deploy the new version from the Portal.

### Setting a password

> [!CAUTION]
> Do not commit the `.env` file to GitHub. Give a deployed prototype its password as a secret in the CDP Portal.

Basic authentication is on by default in CDP environments for prototypes, so a deployed prototype needs a password:

1. Go to the CDP Portal Frontend and log in
1. Find the prototype on the services list page and open its `Secrets` tab
1. Add a secret named `PASSWORD` with a value of your choosing
1. Re-deploy the prototype so it picks up the secret

For several passwords, see "If you want to create additional passwords" in the kit's [publishing guide](https://prototype-kit.service.gov.uk/docs/publishing) (`PASSWORD_KEYS`). To turn the password off, set `USE_AUTH=false` in the environment.

### Environment variables and secrets

| Type                                | Environment | Where to set them                                                                                                                                             |
| ----------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Secrets and other variables         | local       | `.env` (copy `.env.template`)                                                                                                                                 |
| Secrets                             | CDP         | the service's Secrets page in the CDP Portal                                                                                                                  |
| Non-sensitive environment variables | CDP         | a pull request to [cdp-app-config](https://github.com/DEFRA/cdp-app-config) ([how to](https://github.com/DEFRA/cdp-documentation/blob/main/how-to/config.md)) |

| Variable          | What it does                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `PASSWORD`        | The password the kit asks for in production                                                                          |
| `PASSWORD_KEYS`   | Comma-separated keys for several passwords                                                                           |
| `PUBLIC_BASE_URL` | The prototype's own address, for the tools page's Copy link buttons (defaults to the address the page was opened on) |
| `REPO_URL`        | Where the repository can be browsed, for links to the copy as handed over (defaults to the git remote)               |

The image sets `USE_HTTPS=false`: CDP ends HTTPS in front of the app.

### Docker

You will not usually need Docker: CDP builds the image when you deploy. To look at it locally, build from a checkout where `npm run handoff:manifest` and `npm run handoff:snapshots` have run, so the image has the handoff history:

```bash
docker build --no-cache --tag content-driven-prototype .
docker run -e PASSWORD=beepBoopBeep -e PORT=3000 -p 3000:3000 content-driven-prototype
```

`docker build --target development --tag content-driven-prototype:development .` builds the development image, and `docker run -it --entrypoint /bin/ash content-driven-prototype` opens a shell in the built one.

## Updating

The kit and GOV.UK Frontend are ordinary dependencies: see the kit's [guide to updating](https://prototype-kit.service.gov.uk/update-to-latest-version/). After updating, run `npm run test:e2e`.

## Licence

The GOV.UK Prototype Kit is © Crown copyright (Government Digital Service) under the MIT licence. Everything else is © Crown copyright (Defra), licensed under the conditions of the Open Government Licence found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
