# @syntopica/ui-quality

A design gate for rendered web UIs. `codeality-ui check` opens every route you
list in a real browser, at every viewport, in light and in dark, and reports the
defects a person sees at a glance and a code review does not: unreadable text,
text cut mid-word, columns that do not line up, fields glued to their container,
a content column that wastes a wide screen, colours from outside the palette.

It measures; it does not judge. Taste, hierarchy and what a screen is missing
belong to the `design-quality` agent skill, which reads this tool's report and
screenshots instead of measuring again.

## Install

```bash
pnpm add -D @syntopica/ui-quality playwright
pnpm exec playwright install chromium
pnpm exec codeality-ui init
```

`init` writes `codeality-ui.json` and adds `/.codeality-ui/` to `.gitignore`.

## Configure

```json
{
  "baseUrl": "http://localhost:3000",
  "auth": {
    "loginPath": "/auth/login",
    "usernameEnv": "UI_QUALITY_USER",
    "passwordEnv": "UI_QUALITY_PASSWORD"
  },
  "routes": [{ "path": "/admin/inbox", "main": "main" }],
  "viewports": [
    { "width": 1920, "height": 1080 },
    { "width": 390, "height": 844, "mobile": true }
  ],
  "colorSchemes": ["light", "dark"],
  "palette": { "variablePrefixes": ["--brand-"], "colors": ["#ffffff"] },
  "rules": { "content-width": { "minRatio": 0.8 } },
  "disable": [
    { "rule": "palette", "selector": ".vendor-widget", "reason": "third party" }
  ],
  "axe": { "exclude": ["#vendor-chat"], "timeoutMs": 60000 },
  "initScripts": ["e2e/ipc-stub.js"]
}
```

- `auth` fills a username and password form when a route bounces to `loginPath`,
  so public and private routes can share one run, and caches the session in
  `.codeality-ui/state.json`. The credentials come from the environment
  variables it names, never from the file; a missing one fails the run before
  the browser starts.
- `auth.storageState` is for a login no form can perform (a magic link, SSO):
  the path, from the project root, of a Playwright storageState file the project
  mints with its own setup. It is read as is, no credentials are asked for, and
  a route that still bounces to `loginPath` stops the run with exit 2 rather
  than measuring the login page.
- Each route is measured once its network goes idle, or 5 seconds after the load
  event when a widget (Cloudflare Turnstile, a chat embed) keeps a request open
  for good.
- `routes[].main` is the main content region (`main` by default); `waitFor` is a
  selector to wait for before measuring.
- `routes[].localStorage` is written before the route's own scripts run, for an
  app that keeps its current view in client state instead of the URL. Give each
  such route a distinct path, such as `/app?view=sales`.
- `routes[].click` is a list of Playwright selectors clicked in order after the
  route loads, to measure a tab, drawer or dialog. A selector that matches
  nothing is reported as `click-failed` and the run carries on.
- `viewports[].mobile` emulates a phone at that size: touch, a pixel ratio of 3
  and the iPhone Safari user agent, all taken from Playwright's `iPhone 15`
  device. Use it for a mobile site or webview that picks its layout from the
  user agent rather than the width. Reports and screenshots name such a screen
  `390x844 phone`, apart from a desktop window of the same size.
- `palette` is the set of colours a page may show: root custom properties whose
  names start with one of `variablePrefixes`, plus literal hex values. Without
  it the `palette` rule is off.
- `disable` keeps a finding on purpose. `route` and `selector` narrow it, and
  `message` keeps only findings whose message contains that text: one
  third-party `console-error` ("picture-in-picture is not allowed" from a
  Turnstile iframe) instead of every console error on the route. A
  `slow-request` subject is the request (`POST /api/track`), so `selector`
  matches its URL. `reason` is required.
- `axe.exclude` lists selectors axe leaves out. A sandboxed frame without
  `allow-scripts` (an email client's message body) is always left out, since axe
  cannot run inside it and used to wait on it forever. An audit that outlives
  `axe.timeoutMs` (60 s by default) is reported as `a11y/axe-timeout` and the
  run carries on.
- `initScripts` are files, from the project root, run in every page before the
  app's own scripts: the stub of a desktop shell's IPC bridge (Tauri, Electron)
  for a frontend that renders nothing without it, or a fixed clock.

## Rules

| Rule                  | Reports                                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `a11y/<id>`           | every axe-core violation, contrast included, plus `target-size` (WCAG 2.2 AA), which axe ships switched off; serious and critical ones are errors                                     |
| `text-clipped`        | text cut by its own or an ancestor's overflow with no ellipsis                                                                                                                        |
| `text-hard-cut`       | texts in one column that pile up at one length with no ellipsis: cut upstream                                                                                                         |
| `row-misaligned`      | repeated rows whose n-th cell starts at a different x                                                                                                                                 |
| `control-inset`       | a bordered input less than `minInset` (4px) from the edge of the bar or card it sits in                                                                                               |
| `edge-misaligned`     | the header's content and the main content start or end up to `maxOffset` (240px) apart                                                                                                |
| `content-width`       | the main column using less than `minRatio` (80%) of its region at `minViewport` (1280px) up, on a page with a table or repeated rows; a reading page or a lone form keeps its measure |
| `palette`             | a text, fill or border colour farther than `maxDeltaE` (5) from every palette colour                                                                                                  |
| `blank-route`         | no element matches the main selector, or the main region paints nothing                                                                                                               |
| `horizontal-overflow` | the page is wider than its viewport                                                                                                                                                   |
| `fixed-overflow`      | a fixed or sticky element taller than the window that cannot scroll: content unreachable                                                                                              |
| `icon-contrast`       | an icon-only button or link under 3:1 against its background, `<body>` and `<html>` fills included (WCAG 1.4.11)                                                                      |
| `raw-placeholder`     | a bracketed lower-case stand-in such as `[media message]` shown as content                                                                                                            |
| `bare-url`            | a web address shown as plain text outside any link                                                                                                                                    |
| `console-error`       | the page logged a console error or threw while loading (missing translation, duplicate key)                                                                                           |
| `click-failed`        | a configured click found nothing to click, so the screen behind it was not measured                                                                                                   |
| `capture-failed`      | a route's page could not be loaded or measured on two attempts (a navigation aborted by a dev-server reload); the run carries on                                                      |
| `input-zoom`          | a field the user types into sets text under 16px below 1024px wide, so iOS Safari zooms the page on focus                                                                             |
| `slow-request`        | a document, fetch or server action over `maxMs` (1000ms) while the page loaded; a GET is timed again and must still be over it                                                        |
| `sort-broken`         | a sortable header that, clicked twice, leaves its column out of order or never reverses it                                                                                            |
| `filter-broken`       | the main search, given a word shown in a row, drops that row, keeps every row, or does not restore on clear                                                                           |
| `empty-state-missing` | a search nothing matches empties the table and shows nothing in its place                                                                                                             |
| `pagination-broken`   | an enabled "next page" leaves the same rows or cards, repeats over half of them, or "previous page" does not bring them back                                                          |
| `pagination-missing`  | the main table renders over 300 body rows with no pager and no virtual scrolling                                                                                                      |
| `action-silent`       | the first form of the main region, submitted while every write fails, changes nothing the user can see                                                                                |

The behaviour rules come from using the screen once per route, after it is
measured. On the first table of the main region: the search box is found by
type, role or a "search"/"buscar" placeholder; a header sorts when it holds a
button or declares `aria-sort`; the pager is a button or link named
"Next"/"Siguiente" (or `›`, `»`) and "Previous"/"Anterior", or a link with
`rel="next"`/`rel="prev"`. Sorting and paging may persist in the app, as they
would for a person.

A main region with no table is paged through its largest repeated collection:
the visible siblings of one tag that each hold a heading or a worded link, such
as the cards of a grid, outside navigation. Each item is known by its first
link's address, else its heading. The pager is found as above, or by a link
named "2"; following it may load another document. A "next" link whose address
leaves the route (the next article, `/blog/b` from `/blog/a`, rather than
`?page=2` or `/blog/page/2`) is not taken for a pager unless a link named "2"
sits beside it. `pagination-broken` fires when the next page shows only items
the first page showed (whether or not its address changed), when over half of
its items were already on the first page, the mark of an unstable order under
`LIMIT`/`OFFSET`, or when "previous page" does not bring back the first page's
items. The route's address is restored afterwards.

`action-silent` answers every request other than GET, HEAD and OPTIONS with HTTP
500 before it leaves the browser, so nothing is written even against production,
then submits the form. Any new text, a new `role="alert"` or `aria-invalid`
field, a dialog or a change of address counts as telling the user; a form the
browser refuses for its own validation passes. Console errors and requests from
that step are not recorded, since the failure is injected.

Findings are fingerprinted on rule, route, element and, for colour rules only,
colour scheme; viewports and pixel values are left out, so a defect seen at
three widths is one finding.

## Commands

```text
codeality-ui [--project <dir>] init
codeality-ui [--project <dir>] check [--json] [--routes <glob>]
codeality-ui [--project <dir>] baseline create|update|check [--check-stale]
```

With `.codeality-ui-baseline.json` present, `check` fails only on findings the
baseline does not carry. Exit codes: 0 passed, 1 findings, 2 invalid usage or
configuration, 3 browser failure. A single page that fails twice is a
`capture-failed` finding, not an exit 3.

`--routes <glob>` measures only the configured routes whose path matches
(`/admin/**`, or `'/!(admin)**'` for everything else). A full run with `auth`
stops before the browser starts when the credentials or the session file are
missing; a selected run does not, so the public pages can be checked on a
machine without them, and a selected route that bounces to the login page still
fails there. A glob that selects nothing is an exit 2.
