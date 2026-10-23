# Journey content

This folder holds the words and the logic for the prototype's journeys. The prototype kit builds the screens from these files directly. There is no AI in the loop and no HTML to write.

```
content/
  shared/
    one-login/          the mock GOV.UK One Login (sign in, create an account)
    government-gateway/ the mock Government Gateway (sign in, create sign in details)
    pages/              screens shared by more than one journey (create it when you need it)
  apply-juggling-licence/
    journey.yaml        order of pages, branching, what is remembered (logic)
    pages/
      how-many-balls.md one file per screen (content)
      ...
```

**If you are changing copy, options, hints, error messages or button text, you only ever edit files in `pages/`.** You never need to touch `journey.yaml` for that.

See the flow and every screen side by side at `/tools/journeys/apply-juggling-licence` while `npm run dev` is running. Save a page file or `journey.yaml` and the open browser tab reloads itself with the change; no refresh and no restart needed. The flow diagram keeps the default path (following each page's default `goto` from `start`) on a single row, with branches and exits hanging below it; nothing needs marking as "main" by hand.

The three example journeys show everything below in use:

- `apply-juggling-licence`: every question type, a branch out, check your answers, a confirmation and its email, a copy variant, scenarios and handoff dates
- `renew-juggling-licence`: signing in with the mock One Login or Government Gateway, and an exit to another journey
- `review-juggling-applications`: an internal service on the `staff` layout

## Editing a page

Every page file has two parts: a short block of settings at the top between `---` lines, then the page copy in markdown.

```markdown
---
type: radios
hint: Count the most you can keep in the air for 10 catches in a row.
options:
  - label: 3 or more
    value: three-or-more
  - label: 1 or 2
    value: one-or-two
  - label: None - I cannot juggle
    value: none
errors:
  required: Select how many balls you can juggle
button: Continue
---

# How many balls can you juggle?
```

The first `# Heading` is the page's question or title. Everything after it is body copy.

### Labels and values

An option has a `label` and, where the journey branches on the answer, a short `value`:

```yaml
options:
  - label: 3 or more
    value: three-or-more
  - label: None - I cannot juggle
    value: none
```

The label is copy: reword it whenever you like. The value is the answer's short name, the one `journey.yaml` uses (`when: { key: ballCount, equals: none }`), so leave it alone when you change the label. Wherever the answer is shown back to the user (`{{ ballCount }}` on a check your answers page, in an email or a certificate) the label appears, not the value. A page whose answer nothing branches on needs no values at all. The app refuses to start a journey whose `journey.yaml` compares an answer with a value none of the page's options has, naming the page and the option, so a mismatch shows up straight away rather than as a wrong turn in the journey.

### Markdown you can use

| Write                           | You get                       |
| ------------------------------- | ----------------------------- |
| `## Heading` / `### Heading`    | medium / small heading        |
| blank line between lines        | new paragraph                 |
| `- item`                        | bulleted list                 |
| `1. item`                       | numbered list                 |
| `[link text](https://...)`      | link                          |
| `[text (opens in new tab)](…)`  | link that opens a new tab     |
| `**bold**`                      | bold                          |
| `\` at the end of a line        | line break inside a paragraph |
| `\| Heading \| Heading \|` rows | table (see below)             |

A table is written the markdown way, one row per line with `|` between the cells and a line of dashes under the headings, and comes out as a GOV.UK table. Two extras match the design system: a body row whose first cell is entirely bold (`| **Standard** | £50 |`) makes that cell the row's header, and a column whose dashes end in a colon (`---:`) is a numeric column, aligned right.

```markdown
| Licence     | Fee (excluding VAT) |
| ----------- | ------------------: |
| **1 year**  |                 £50 |
| **3 years** |                £120 |
```

Do not write HTML or template code in these files. If you need something the list above cannot do, ask a developer to add a block type.

### Blocks

Wrap copy in `:::` lines to get GOV.UK components:

```markdown
:::inset
Your licence lets you juggle in public places in England.
:::

:::details What counts as juggling
Keeping 3 or more objects in the air at once.
:::

:::warning
You must carry your licence when you perform.
:::

:::panel Application complete
Your reference number: {{ applicationReference }}
:::

:::button Start now
:::

:::notification Keeping your information secure
Do not share your sign in details with anyone else.
:::

:::after-button

[Get help with this page](#)

:::
```

`:::notification Title` is the blue notification banner. `:::after-button` moves everything from that line to the end of the file below the page's button: a "Get help with this page" link, or a details block that sits under Continue. When the block holds another block (a details, say), open and close it with four colons (`::::after-button` … `::::`) so the inner `:::` lines do not end it early.

`:::map key` draws a saved boundary (a GeoJSON polygon in the session under `key`) as a small outline, like a location plan. The prototype has no basemap; that would be an add-on.

A link written as `[text](./page-id)` points at a page of whichever journey the file is used in, so a shared page can link to a sibling page (the Government Gateway sign in page links to `./government-gateway-email`). `[text](./$next)` follows the page's own `next` rules in `journey.yaml`, evaluated for the current session, so an email's "Sign in to your account" link never names the page that comes after signing in. A link's address can carry an answer, written without spaces: `[renew your licence](/renew-juggling-licence/start?_ref={{applicationReference}})` takes the reference along, URL-encoded.

`:::if key` shows a block only when an answer exists, and `:::if key equals value` only when it matches:

```markdown
:::if trickPhoto

- a photo of your trick: {{ trickPhoto }}

:::
```

Leave a blank line before a closing `:::` when the block ends with a list, otherwise the formatter folds it into the last item.

### Showing an answer the user gave

Write the answer's name in double curly braces: `{{ applicantEmail }}`. The names are listed under `session:` in `journey.yaml`. An answer to a radios or checkboxes question shows as the option's label (see "Labels and values"); a checkboxes answer shows every label, separated by commas. Useful variations:

- `{{ ballCount | lower }}` lower-case
- `{{ applicantEmail or "user@example.com" }}` fallback when there is no answer yet
- `{{ applicantDetails.fullName }}` a value inside a value
- `{{ yearsJuggling | plural "year" }}` the number with the right word: "1 year", "6 years" (`plural "person" "people"` for a word that does not just add an s)

## Settings by page type

| `type`          | Settings you can use                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `start`         | `title`                                                                                                          |
| `content`       | `title`, `actions`                                                                                               |
| `radios`        | `hint`, `options` (each with optional `hint`), `errors`, `button`, `bodyFirst` (body copy above the options)     |
| `checkboxes`    | as radios, plus `actions` of kind `link` or `destructive` beside the button (a Delete link on an agreement page) |
| `input`         | `hint`, `errors`, `button`, `width`, `label` (see "A label under the heading")                                   |
| `number`        | as input                                                                                                         |
| `email`         | as input                                                                                                         |
| `textarea`      | `hint`, `errors`, `button`, `lines` (box height), `maxLength` (adds a count, `tooLong` error), `optional: true`  |
| `password`      | `hint`, `errors`, `button`; has a Show/Hide toggle, never stored                                                 |
| `form`          | `hint`, `fields`, `button`, `actions` (see "Several fields")                                                     |
| `select`        | `label`, `placeholder`, `options`, `errors`, `button`, `actions`; a dropdown under the heading and body copy     |
| `file-upload`   | `hint`, `errors`, `button`                                                                                       |
| `check-answers` | `rows`, `actions`                                                                                                |
| `confirmation`  | `title`, `panel` (with `title` and `body`)                                                                       |
| `document`      | `title`; a full-width document with no banner or back link                                                       |
| `custom`        | a developer-built screen; `hint`, `errors` and `text:` (named strings the template renders) still come from here |

Every page can also set `layout` to change its chrome:

- `default`: the prototype header and banner
- `one-login`: the GOV.UK One Login look used by the shared sign-in pages
- `government-gateway`: the Government Gateway look: a "Government Gateway" bar, the language toggle, no banner
- `document`: bare crown header, full width, no banner or back link; `type: document` pages get this automatically
- `email`: the same bare header at the usual reading width, for the emails the service sends, so they do not look like a page of the service
- `staff`: an internal service for the people who run it: a blue GOV.UK header with the service name and the signed-in user's account, a dropdown holding the menu and account links, the Prototype banner, and a page up to 1440px wide so tables have room

`layout:` at the top of `journey.yaml` sets the layout for every page of that journey that does not name its own; the shared sign-in pages keep theirs.

A `caption` ("Apply for a juggling licence", say) shows in grey above the heading of content, radios, form, select and check your answers pages.

### A label under the heading

An `input`, `number` or `email` page normally uses its heading as the label of the box. Add `label:` when the page has copy between the heading and the box, or the box needs its own name:

```markdown
---
type: input
label: Enter the 6 digit code
width: 10
---

# Check your email

We have sent an email to: **{{ signInEmail }}**
```

### Several fields on one page

`type: form` puts more than one text input on a page, an address for example. List the inputs under `fields:`; each has a `name` (kebab-case), a `label` and optionally `hint`, `optional: true`, `width` (a number of characters, or `two-thirds`, `one-half`...), `autocomplete`, `type` (`text` unless you say `tel`, `email`, `textarea` or `password`; a `textarea` with a `maxLength` shows how many characters are left, a `password` gets a Show/Hide button and is never shown again) and its own `errors`. A page whose fields are all passwords sets `remember: false` and names them starting with `_` (see the create password pages) so nothing is kept. The answers are remembered together as one object under the page's `sessionKey` in `journey.yaml`, so `{{ applicantDetails.fullName }}` shows one of them.

```markdown
---
type: form
fields:
  - name: full-name
    label: Full name
    autocomplete: name
    errors:
      required: Enter your full name
  - name: phone
    label: Phone number
    type: tel
    optional: true
button: Continue
---

# Your details
```

The error summary lists one link per field that is missing. A `link` or `destructive` entry under `actions:` on any question page adds a link beside its button (a Cancel link, say).

`title` is only needed when the browser tab title should differ from the heading.

### Error messages

`errors:` is a small list of situations and the message to show. The message is used in both the error summary and next to the field.

| Key           | When it shows                          |
| ------------- | -------------------------------------- |
| `required`    | nothing entered, selected or uploaded  |
| `invalid`     | not a number                           |
| `whole`       | not a whole number                     |
| `min` / `max` | number too small or too large          |
| `format`      | email address in the wrong shape       |
| `tooLong`     | more characters than a box's maxLength |
| `tooLarge`    | file over the size limit               |
| `wrongType`   | file extension not allowed             |
| `empty`       | uploaded file has nothing in it        |

Any key you leave out falls back to `required`.

### Check your answers rows

```yaml
rows:
  - heading: Your juggling # starts a new titled group of rows
  - key: Years juggling
    value: '{{ yearsJuggling | plural "year" }}'
    change: years-juggling # page the Change link goes to
    changeHidden: how many years you have been juggling # read out by screen readers
  - key: Reference
    value: '{{ applicationReference }}' # no `change` means no Change link
  - key: Phone number
    value: '{{ applicantDetails.phone or "Not given" }}'
  - key: Business name
    value: '{{ account.businessName }}'
    when: { key: account.accountType, equals: company } # row shown only then
  - key: Address
    value:
      lines: # several lines in one value; empty lines are dropped
        - '{{ address.line1 }}'
        - '{{ address.postcode }}'
    change: address
```

Rows that several pages show go in one file: write them in `partials/<name>.md` (only `rows:` in its frontmatter) and put `- include: <name>` where they belong in each page's rows.

A `value` can also be a choice, `{ when: <condition>, then: Added, else: Not added }`, whose `else` may be another choice when there are three or more possibilities, and `change` can be a list of rules so the link goes to a different page depending on an answer (a rule list with no default shows no link when nothing matches).

### Buttons and links at the bottom of a page

```yaml
actions:
  - text: Accept and send
    kind: submit
  - text: Delete
    kind: destructive # red link
    goto: delete-application
```

Kinds: `submit`, `secondary` (grey button, submits the same form), `warning` (red button), `link`, `destructive` (red link), `start`. A `submit` or `secondary` action with a `goto` renders as a button that links there instead of submitting (the "Create your GOV.UK One Login" button).

## Signing in

The mock GOV.UK One Login and Government Gateway pages live once, in `content/shared/one-login/` and `content/shared/government-gateway/`, and any journey can use them. Any email, user ID and password are accepted. `renew-juggling-licence` is the worked example:

1. List the pages in `journey.yaml` with `shared: one-login` or `shared: government-gateway` (copy the block from the example: the flow between them, and where signing in leads, is each journey's own).
2. Add `signedIn: { key: account, isSet: true }` to `journey.yaml`, so the header shows Sign out once the user has signed in.
3. Ask a developer to add the mock sign in to the journey's hooks (one line, see `app/lib/renew-juggling-licence/hooks.js`).

The account takes the name typed on the Government Gateway name page or, failing that, the research participant's name (see "User research aids"), so `{{ account.fullName }}` and `{{ account.email }}` work in the copy.

## Pages shared by more than one journey

When several journeys begin with the same start page, say, that copy can live once, in `content/shared/pages/`, and each journey lists the page with `shared: true`:

```yaml
pages:
  - id: start
    shared: true # copy comes from content/shared/pages/start.md
    next: what-would-you-like-to-do

  - id: what-would-you-like-to-do
    shared: true
    next:
      - when: { key: journeyType, equals: renew }
        goto: /renew-juggling-licence/sign-in-method # leaves this journey
      - goto: how-many-balls
```

The mock sign in services are shared the same way, each in its own folder so `shared/pages/` stays small. A journey lists those pages with the folder name instead of `true`:

```yaml
- id: one-login-start
  shared: one-login
  next: one-login-email
```

The page ids keep their provider prefix (`one-login-`, `government-gateway-`) because they become URLs in every journey that uses them. A shared page whose button links to another page (`goto:` in its `actions`, or a `[text](./page-id)` link) needs that page listed in the journey too.

The page keeps the journey's own URL, so the homepage cards, the smoke test and the screen wall work as usual. To change the shared copy, edit the file in `content/shared/`; every journey that uses it updates at once. A shared question page carries its own `type`, `field`, `sessionKey`, `options` and `errors` in its frontmatter, so the journeys only decide where each answer goes. A page can also set `serviceName` in its frontmatter (or in `journey.yaml`) to replace the journey's service name in the header and `<title>` on that page alone.

A `goto` that starts with `/` is an exit to another journey. The engine does not check that the page exists there, so **when a newer version becomes the target, update the path in the other journey's `journey.yaml`**. Exits show in the flow diagram as dashed boxes, on the screen wall as a placeholder card, and in `flow.json` under `transitions.offPage`. A page cannot be both shared and have a file of the same name in the journey's own `pages/`; the loader refuses to guess which one you meant.

### Groups on the tools page

The flow diagram and screen wall at `/tools/journeys/<id>` fold each shared provider folder into one purple box ("GOV.UK One Login, 11 screens") on the main journey, and draw the group's own screens and flow in a section of their own further down the page. Nothing needs setting up for that: a page listed with `shared: one-login` belongs to the `one-login` group. To put any other page in a group, give its entry `group: <name>` in `journey.yaml`; to change a group's title, add a `groups:` block:

```yaml
groups:
  one-login:
    title: GOV.UK One Login
```

Inside a group's section, a dashed box is a page of the journey outside the group ("Back in the journey"). The JPG export numbers the screens in the same order, the main journey first, then each group, with a folder per section in the zip; tick or untick sections on the export form to get the main journey on its own, or just one group.

## Borrowing a page from another journey

Sharing is for a page both journeys walk through in order. When a journey only needs to send the user to another journey's page _and get them back_, borrow it instead of copying it:

```yaml
# In a check-answers page's rows: a Change link to another journey's page
rows:
  - key: Years juggling
    value: '{{ yearsJuggling }}'
    change: /apply-juggling-licence/years-juggling

# In actions or a `next` rule: an exit that comes back, `return` names one
# of this journey's summaryPages
actions:
  - text: Delete
    kind: destructive
    goto: /apply-juggling-licence/delete-application
    return: check-your-answers
```

A Change link to another journey carries the way back on its own. For an exit from `actions` or a `next` rule add `return: <page>`. Either way the link opens the borrowed page with `?nav=/<this journey>/<summary page>`, and on that page:

- the Back link and any `goto: $summary` (in `next`, `back` or `actions`, a Cancel link say) return to that summary page, so the borrowed page's own rules still run and its `$navFromSummary` rule brings the user back
- a drop-out page the Change detour leads to keeps the way back, so its Back link returns to the question still in the detour and a different answer goes back to the summary page
- the header shows the borrowing journey's service name and signed-in state, so the user does not see the service change under them
- everything else (URL, session keys, hooks) stays the borrowed journey's

For this to work the borrowed page needs `changeable: true` and a `$navFromSummary` rule ending in `goto: $summary` (not a hard-coded page id). `nav` is only honoured when it names a page of a mounted journey; anything else is ignored. **The same caveat as exits applies: update the paths when a newer version becomes the target.**

## Trying out variations of a page

To try different words or a different layout for a page without a branch, save a copy of its file beside it, with `~` and a short name after the page id, and reword the copy:

```
pages/how-many-balls.md      # the page
pages/how-many-balls~b.md    # an alternative copy of it
```

```markdown
---
variant: With a hint # how the tools page labels this copy (the name after ~ if left out)
description: The same question with a hint explaining what counts # optional: on the Scenarios tab
type: radios
hint: Count the most you can keep in the air for 10 catches in a row.
options:
  - label: 3 or more
    value: three-or-more
  # ...the same options, with the same values
errors:
  required: Select how many balls you can juggle
---

# How many balls can you juggle?
```

The name after the `~` uses lower-case letters, digits and hyphens. A variant is copy only: reword the heading, hint, body, labels, error messages and button as you like, but keep the page's `type`, the `value` of every option, the fields of a form and its `field` and `sessionKey`, because `journey.yaml` branches on those. The loader refuses a variant that changes them and says which file. The one exception: a variant of a check-answers page may leave out its declaration checkbox (`options`), to try the declaration on a page of its own. A shared page varies the same way, with the file beside it in `content/shared/...`, in every journey that shares it. A variant can show one of the page's preview variants (see "Sample answers and scenarios") with `sample: <variant id>`.

Seeing the variants:

- On the screen wall at `/tools/journeys/<id>`, each variant is an orange-topped card right after the page it varies, labelled with its `variant:` name. The ⋯ menu on the page or on a variant has **Compare side by side**, which opens every copy of the page in columns at desktop or mobile width, in the error state if the page has one.
- `?_copy=b` on the page's URL shows that copy once, for that request. The wall and the export use it, so looking at a variant never changes what anyone else sees.
- `?copy=b` shows that copy for the rest of the session: every page that has a `~b` file shows it and the others show their own copy, so a research participant can be walked through variant B end to end. `?copy=default` goes back to the pages' own copy. The Copy link button on a variant's card gives that URL.
- The JPG export saves each variant beside the page as `<page>~b.jpg`.
- The **Scenarios** tab on the tools page (also linked from the journey's homepage card) lists every page's variants, with a Copy link and **Use for the session**.

Variants are for experiments, not handoffs. A variant never appears in a frozen handoff copy or in the "as handed over" export, and editing one does not turn the page's tag to **Changed since handoff**: only the page's own file counts. To keep a variant, move its words into the page's own file and delete the variant; to drop one, delete its file. Either shows up without a restart.

## Sample answers and scenarios

`preview.data` in `journey.yaml` holds sample answers for every page, so the screen wall and `?preview=1` show each screen filled in. A page can add its own `preview:` block with `data:` to override them, and `variants:` to show other states of the same screen:

```yaml
- id: check-your-answers
  preview:
    label: Experienced juggler # the standard state's name on the Scenarios tab
    description: Every answer given, phone number included
    variants:
      - id: beginner
        label: A beginner with no phone number
        description: 1 or 2 balls, less than a year, and the phone number left out
        data: { ballCount: one-or-two, yearsJuggling: 0 }
```

Each variant is a card of its own on the wall, opened with `?preview=1&variant=<id>`, and a row on the **Scenarios** tab, for picking one in a research session. A variant with `live: true` opens for real rather than as a preview, at `<page>?_scenario=<id>`: the journey's `session:` answers are cleared, the variant's `data` goes into the session and the participant carries on from the page (see `years-juggling` in the example). `scenarios: { columns: [{ label, key, pages }] }` at the top of `journey.yaml` adds a column to the Scenarios tab showing each scenario's sample answer at `key`.

## User research aids

- **Participant details**: the footer link on every page (or `?participant` on any URL) opens a box where the facilitator types the participant's name and organisation. The journeys' hooks use them wherever the prototype would otherwise make a name up: the example pre-fills the name on "Your details", and the mock sign in uses it for the account. On a journey for staff, `participant: staff` in `journey.yaml` makes the box speak to the participant, who fills it in themselves, and the staff header shows their name and organisation.
- **Research links**: `research:` on a page in `journey.yaml` adds facilitator shortcuts to a "User research" section at the top of the footer (the email the service would have sent, say):

  ```yaml
  - id: confirmation
    research:
      - text: View the confirmation email
        href: confirmation-email
  ```

  Each opens in a new tab unless `newTab: false`. An `href` is a page of this journey (a query string is fine), a path into another journey when it starts with `/`, or a full URL. `?research=false` on any page hides the section for the session (`?research=true` shows it again).

- **Turn errors off**: the footer link (or `?errors=false`) turns validation off for the session, so a participant can click through without filling anything in. Blank answers are then filled from `preview.data`, so keep the sample answers complete enough for every guard to pass.
- **Seeing any screen**: `?preview=1` on any page shows it with the sample answers, without walking the journey. `?preview=1&error=1` shows a question page with its `required` error, and `?preview=1&error=<key>` any other error it defines.

## Things that need a developer

- Adding, removing or renaming a page (the file name is the page's URL). The running server picks the new page up without a restart.
- Changing where an answer leads (`journey.yaml → next`).
- Changing what a page remembers (`journey.yaml → session`).
- New kinds of block or component.
- Behaviour no setting covers: a reference number made up on submit, looking something up, signing in. That goes in the journey's hooks, `app/lib/<journey>/hooks.js` (see the examples). Changes to hooks, or to `basePath` in `journey.yaml`, need `npm run dev` restarting.

## Handing pages to development

When a page's design is ready to build, put the date on its entry in `journey.yaml`:

```yaml
- id: how-many-balls
  handoff: 2026-10-23
```

That one line is the handoff. Anyone can add it, in an editor or on GitHub, and it is fine to hand over one page while the rest of the journey is still moving.

Running the prototype locally, the screen wall can write the line for you: open a card's ⋯ menu and choose **Mark ready for dev** (or **Hand over again** once the copy has changed since). The menu then says the handoff is not committed yet, with an **Undo** that puts the line back as it was in the last commit; **Remove** takes a committed date out. Nothing is handed over until you commit `journey.yaml` and push it to `main`, as with a date typed by hand. The deployed prototype has no such menu section. A shared page is stamped on the journey handing it over.

What happens next:

- The journey's tools page (`/tools/journeys/<id>`) lists the handed-over pages at the top of the Screens tab and tags each screen **Ready for dev**. The homepage card shows how many pages are ready.
- When the page's copy is edited after the handoff, the tag turns yellow, **Changed since handoff**, on its own: the prototype asks git whether the markdown moved after the commit that added the date. Put today's date on the page to hand the change over (when the page was already handed over today, the date cannot change, so add a comment after it, `handoff: 2026-10-23 # copy corrected`, and commit: the handoff is the commit that last wrote that line). Changes to the page's rules in `journey.yaml` (`next`, `guard`, `set`) are not spotted this way, so tell the developer about those.
- When the date lands on `main`, the Publish workflow tags that commit `handoff/<journey>/<date>`. Anyone can link to the copy as handed over on GitHub (the "Copy at handoff" link on the tools page), and developers can diff two handoffs: `git diff handoff/apply-juggling-licence/2026-10-01 handoff/apply-juggling-licence/2026-10-23 -- content/`.
- Once the date is committed, the page has a frozen URL, `/handoffs/<journey>/latest/<page>` (the "Frozen page" link and the copy-link button on the tools page). It shows the page as handed over however much the live copy moves afterwards, and the whole journey works under it, so Back and Continue stay in the frozen copy: every page under `latest` comes from its own most recent handoff, with a **Frozen** banner in place of the Prototype one, and a page never handed over shows the live copy under a grey **Not handed over** banner so nobody builds it. `/handoffs/<journey>/<date>/<page>` pins the whole journey to that one handoff's commit. Templates and behaviour are always today's: only the content is frozen, and a copy variant is never shown in a frozen copy.

Developers looking for what to build can search the content for `handoff:`.

## Adding a new journey

1. Copy `content/apply-juggling-licence/` to `content/<id>/` (the id becomes the URL, `/<id>/...`) and change `id`, `name` and `serviceName` at the top of `journey.yaml`. Delete the pages you do not need from `pages/` and from `journey.yaml`, and take out the `handoff:` dates. The example's hooks (the reference number made on check your answers) live in `app/lib/apply-juggling-licence/hooks.js`: copy that to `app/lib/<id>/hooks.js` too if you keep the page.
2. Give it a `homepage:` block so it lands in the right tab on the homepage:

   ```yaml
   homepage:
     family: example # a tab: families in app/config/shared/journeys.yaml
     version: 2 # in a versioned family, the highest version is the main card
     status: in-progress # tested | in-progress | spike
     title: Apply for a juggling licence (V2)
     description: One paragraph shown on the card.
     changes: # optional "Design changes" bullets; { heading, items } groups are allowed
       - What changed since the last version
   ```

3. Restart `npm run dev`. The journey mounts at `/<id>` (or `basePath` if set), appears on the homepage and at `/tools/journeys/<id>`. Until the restart the homepage shows the card with a "Restart to mount" tag.

Nothing else needs registering: no route file and no entry in `app/config/shared/journeys.yaml` (that file holds the homepage tabs, and hand-coded journeys if you have any). Bespoke page behaviour goes in `app/lib/<id>/hooks.js`, which is picked up automatically on the next restart.

To try a new version of a journey alongside the old one, copy its folder to a new id (`apply-juggling-licence-2`) and give it the next `version` in the same family.

## Back links

Every new page needs a decision about its Back link. Without `back`, a page goes back to the first page whose `next` leads to it, which is usually right but not always:

- **A page the user reaches from a link in an email** has nothing of the service to go back to: give it `back: []`. Where only some users arrive from an email, list `back` rules for the others and leave out a default, so no rule matches for those who came from the email.
- **A page reached from a link that opens in a new tab** usually has no Back link either.
- **A start page** goes back to the prototype's homepage.

The app refuses to start a journey where a page's Back link (its `back`, or the default) leads to an email page (`layout: email`), naming the page, so the mistake shows up straight away.

## For developers: journey.yaml

```yaml
pages:
  - id: how-many-balls # URL is /<journey>/<id>; copy is pages/<id>.md
    field: ball-count # form field name (kebab-case)
    sessionKey: ballCount # session key (defaults to camelCase of field)
    changeable: true # can be reached from check your answers with ?change=true
    next: # first matching rule wins; the last has no `when`
      - when: { key: ballCount, equals: none }
        goto: ineligible
      - when: { key: $navFromSummary, truthy: true }
        goto: $summary
      - goto: juggling-objects
```

Journey keys beside `pages`: `id`, `name`, `serviceName`, `start` (the first page's id), `basePath`, `summaryPage` or `summaryPages` (every page with Change links; a rule's `goto: $summary` returns to whichever one the user came from, which may be in another journey when the page is borrowed), `signedIn` (a condition: the header shows the user as signed in, with a Sign out link to the `SIGN_OUT` route a hook registers), `session` (every key the journey writes; `clears: $session` expands to it), `preview` (see "Sample answers and scenarios"; `preview.signedInFrom` lists the pages signing in leads to, so the header shows Sign out only from there on), `scenarios`, `groups`, `homepage`, `layout` (the default for every page), `participant` (`staff`, see "User research aids") and `header` for the `staff` layout:

```yaml
header:
  organisation: Juggling Licensing Authority # under the user's name in the account toggle
  homePage: applications # where the service name links
  account: # links in the account panel
    - { text: Your account, href: '#' }
    - { text: Sign out, href: $signOut } # the sign-out route a hook registers
  menu:
    links: # page ids, absolute paths or '#'
      - { text: Applications, href: applications }
```

Canned data a journey's pages look things up in (a list of applications, say) can sit beside `journey.yaml` as YAML; its hooks read it.

Condition operators: `equals`, `notEquals`, `in`, `notIn`, `gt`, `gte`, `lt`, `lte`, `between`, `truthy`, `falsy`, `isSet`. Combine with `all:`, `any:`, `not:`. Engine values: `$navFromSummary`, `$isChange`, `$preview`, `$borrowed` (the page was opened from another journey's summary page, see "Borrowing a page from another journey").

Other page keys:

- `handoff: YYYY-MM-DD`: the page's design was handed to development on that date (see "Handing pages to development")
- `shared: true` or `shared: <folder>`: the copy comes from `content/shared/pages/<id>.md` or `content/shared/<folder>/<id>.md`
- `back`: a page id, absolute path, or a rule list; it wins over the Back-to-the-summary shortcut a `changeable` page gets. `back: []`, or a rule list where no rule matches, means no Back link
- `guard`: a condition plus `redirect`, for a page that needs earlier answers
- `store`: map an option's `value` to what the session stores, for booleans and the like; prefer a `value` on the option in the page file
- `set`: write values on submit; also allowed on a rule
- `clears`: a list of keys, or `$session`
- `handler: custom`: marks a page that has hooks
- `template`: a hand-written view for `type: custom`
- `layout`: see "Settings by page type"
- `remember: false`: never write the answer to the session; pair it with a field name starting `_` so the kit's own auto-store skips it too, as the password pages do
- `accept` and `maxSize` for uploads, `min` and `max` for numbers
- `research`: see "User research aids"
- `group`: see "Groups on the tools page"

A `next` rule or an action whose `goto` leaves for another journey can add `return: <page id>` so that journey's page comes back here (see "Borrowing a page from another journey"). `$summary` is allowed wherever a `goto` is: `next`, `back` and `actions`.

Hooks (`app/lib/<journey>/hooks.js`) are per journey, so a shared page such as `one-login-password` only does something in the journeys that give it a hook. Every key is a page id, with `load(ctx)` (before the page is built; may put data in the session), `get(ctx, model)` (after; can add to the render model), `validate(ctx)`, `process(ctx, value)` (after validation, on submit) and `routes(router, journey)` (extra endpoints). Journey-wide keys: `context(ctx)` on every page, `scenario(ctx)` after a live scenario starts, `preview(ctx)` on a `?preview=1` page, and `routes(router, journey)`. The full list is at the top of `app/lib/journey-engine/router.js`.

`?preview=1` on a summary page (one listed in `summaryPage` or `summaryPages`) also copies the sample answers into the session, so someone opening a shared link to check your answers can follow a Change link, find the page already answered and come back with the row updated. Any other page leaves the session alone, as does an embedded preview.

`?copy=<name>` shows the page's copy variant for the session; `?_copy=<name>` for that request only (the kit never stores a query key that starts with `_`, which is why the screen wall, the compare page and the export use it). A frozen handoff copy ignores both. In the engine, `copyVariantFor` in `router.js` swaps the variant's page object in before the page is handled, so hooks, validation and rules see the page's own id, path and `next` with the variant's copy.

The definition is validated on load. A broken file fails loudly with every problem listed, both on `npm run dev` and on the journey's homepage card and `/tools/journeys/<id>` page.
