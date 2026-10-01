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
    { "width": 390, "height": 844 }
  ],
  "colorSchemes": ["light", "dark"],
  "palette": { "variablePrefixes": ["--brand-"], "colors": ["#ffffff"] },
  "rules": { "content-width": { "minRatio": 0.8 } },
  "disable": [
    { "rule": "palette", "selector": ".vendor-widget", "reason": "third party" }
  ]
}
```

- `auth` fills a username and password form when a route bounces to `loginPath`,
  so public and private routes can share one run, and caches the session in
  `.codeality-ui/state.json`. The credentials come from the environment
  variables it names, never from the file; a missing one fails the run before
  the browser starts.
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
- `palette` is the set of colours a page may show: root custom properties whose
  names start with one of `variablePrefixes`, plus literal hex values. Without
  it the `palette` rule is off.
- `disable` keeps a finding on purpose. `route` and `selector` narrow it;
  `reason` is required.

## Rules

| Rule                  | Reports                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `a11y/<id>`           | every axe-core violation, contrast included; serious and critical ones are errors                           |
| `text-clipped`        | text cut by its own or an ancestor's overflow with no ellipsis                                              |
| `text-hard-cut`       | texts in one column that pile up at one length with no ellipsis: cut upstream                               |
| `row-misaligned`      | repeated rows whose n-th cell starts at a different x                                                       |
| `control-inset`       | a bordered input less than `minInset` (4px) from the edge of the bar or card it sits in                     |
| `edge-misaligned`     | the header's content and the main content start or end up to `maxOffset` (240px) apart                      |
| `content-width`       | the main column using less than `minRatio` (80%) of its region at `minViewport` (1280px) up                 |
| `palette`             | a text, fill or border colour farther than `maxDeltaE` (5) from every palette colour                        |
| `blank-route`         | no element matches the main selector, or the main region paints nothing                                     |
| `horizontal-overflow` | the page is wider than its viewport                                                                         |
| `fixed-overflow`      | a fixed or sticky element taller than the window that cannot scroll: content unreachable                    |
| `icon-contrast`       | an icon-only button or link under 3:1 against its background (WCAG 1.4.11)                                  |
| `raw-placeholder`     | a bracketed lower-case stand-in such as `[media message]` shown as content                                  |
| `bare-url`            | a web address shown as plain text outside any link                                                          |
| `console-error`       | the page logged a console error or threw while loading (missing translation, duplicate key)                 |
| `click-failed`        | a configured click found nothing to click, so the screen behind it was not measured                         |
| `input-zoom`          | a field the user types into sets text under 16px below 1024px wide, so iOS Safari zooms the page on focus   |
| `slow-request`        | a document, fetch or server action taking over `maxMs` (1000ms) while the page loaded or was used           |
| `sort-broken`         | a sortable header that, clicked twice, leaves its column out of order or never reverses it                  |
| `filter-broken`       | the main search, given a word shown in a row, drops that row, keeps every row, or does not restore on clear |
| `empty-state-missing` | a search nothing matches empties the table and shows nothing in its place                                   |
| `pagination-broken`   | an enabled "next page" leaves the same rows, or "previous page" does not bring the first page back          |
| `action-silent`       | the first form of the main region, submitted while every write fails, changes nothing the user can see      |

The behaviour rules come from using the screen once per route, after it is
measured. On the first table of the main region: the search box is found by
type, role or a "search"/"buscar" placeholder; a header sorts when it holds a
button or declares `aria-sort`; the pager is a button or link named
"Next"/"Siguiente" (or `›`, `»`) and "Previous"/"Anterior". Sorting and paging
may persist in the app, as they would for a person.

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
codeality-ui [--project <dir>] check [--json]
codeality-ui [--project <dir>] baseline create|update|check [--check-stale]
```

With `.codeality-ui-baseline.json` present, `check` fails only on findings the
baseline does not carry. Exit codes: 0 passed, 1 findings, 2 invalid usage or
configuration, 3 browser or page failure.
