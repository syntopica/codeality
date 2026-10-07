# Changelog

## [Unreleased]

- New rule, `warn`: `focus-invisible` (keyboard focus that changes nothing
  visible). The capture now presses Tab through the first 30 focusable elements
  after the probe and compares each with its unfocused look; a ring painted on
  an ancestor (`:focus-within`) or a sibling counts.

## 0.5.0

- New rules, all `warn`: `nested-cards` (a card inside a card within three
  levels, once per outer card), `type-scale-sprawl` (over 6 font sizes in the
  main region, or two sizes 1px apart side by side; authored content left out),
  `accent-overuse` (more than one accent-filled button in one main region, form
  or dialog, an action bar keeping one of its own) and `text-occlusion` (text
  painted over by an opaque element, checked with `elementFromPoint` at the
  centre of its first line).
- `palette.accent` names the primary-action colour for `accent-overuse`; without
  it the most saturated filled button is taken.
- `unstable-media-size` also reports a cumulative layout shift over 0.1 while
  the page loads, from a `layout-shift` observer installed before the page's own
  scripts. `broken-image` also reports a CSS background image whose request
  failed or answered 400 and up.
- The probe now reports CSS background image addresses and, for on-screen text,
  the element painted over its first line.

## 0.4.0

- New rules, all `warn`: `undersized-text`, `tight-leading`, `letter-spacing`,
  `numeric-alignment`, `broken-image`, `unstable-media-size` and
  `content-hidden-at-rest`. The probe now reads line height, letter spacing,
  font weight and family, `font-variant-numeric` (and whether the font's digits
  are tabular), text alignment and transform, line count, corner radius and
  padding, plus every visible image and video and the share of the main region's
  text painted invisible.
- `numeric-alignment` may report a table whose amounts are left-aligned or set
  in proportional digits on projects that passed before.
- `routes[].scroll` (`"bottom"` or a selector), `routes[].hover` and
  `routes[].focus` measure a screen after scrolling, hovering or focusing; a
  target that matches nothing is reported as `click-failed`, whose message now
  names the action.
- `ghost-elevation` (warn): a bordered box in the page flow whose shadow blurs
  over 3px, past Tailwind's `shadow-sm`, so shadcn's resting Card and Input
  pass. Dialogs, popovers and anything inside a fixed or absolute layer are left
  alone.

## 0.3.0

- New rules: `empty-dialog` (an open dialog or drawer offering nothing but its
  close control), `placeholder-fit` (a placeholder over 20% wider than its
  field), `pagination-missing` now also covers a repeated list or card grid of
  over 150 items with no pager, `duplicate-nav-icon`, `mixed-icon-family` and
  `transition-all`.
- `dark-scheme-ignored`: the dark capture of a screen is byte for byte its light
  one, so the app themes by a class or stored preference; reported once per run.
- `route-uncovered`: pages listed in `baseUrl/sitemap.xml` (and one level of a
  sitemap index) under a first path segment no configured route renders. Child
  sitemaps are read only from the site under test, without following redirects,
  and a sitemap over 50 MB is ignored.
- axe's `target-size` (WCAG 2.2 AA, 24px) is switched on, so projects upgrading
  will see new `a11y/target-size` findings.
- `text-clipped` reports a select whose content box is shorter than one line of
  its font.
- `check --routes <glob>` measures only the matching configured routes; a
  selected run does not require the auth credentials up front.
- `disable[].message` keeps only the findings whose message contains that text.
- `content-width` applies only to a main region that lays out data (a table, or
  three or more row items); reading pages and lone forms keep their measure.
- A "next" link that leaves the route (the next article) is no longer taken for
  a pager unless a link named "2" sits beside it.
- The table search finds React tables (no whitespace between cells), login skips
  hidden honeypot fields, and a screen that fails twice becomes a
  `capture-failed` finding instead of ending the run.

## 0.2.0

- `viewports[].mobile` emulates a phone (touch, pixel ratio 3, the iPhone Safari
  user agent from Playwright's `iPhone 15` device) at the configured size, so a
  layout chosen from the user agent can be measured from a desktop machine. Such
  a screen is labelled `390x844 phone` in reports and screenshot names.
- `icon-contrast` reads the page colour on `<body>` and `<html>`: a dark theme
  that paints its background there was measured over white (1.52:1 reported,
  5.9:1 on screen), and a gradient there now skips the icon as one on a button
  does.
- axe leaves out sandboxed frames without `allow-scripts`, which it cannot enter
  and used to wait on forever; `axe.exclude` adds selectors, and an audit past
  `axe.timeoutMs` (60 s) is reported as `a11y/axe-timeout` instead of hanging
  the run.
- `initScripts` runs project files in every page before the app's scripts, so a
  Tauri or Electron frontend can be measured with its IPC bridge stubbed.

## 0.1.0

- `codeality-ui check`, `baseline` and `init`: drive each configured route in
  Playwright at every viewport, in light and dark, and report design defects
  with a screenshot per screen and `.codeality-ui/report.json`.
- Rules: every axe violation as `a11y/<id>`, `text-clipped`, `text-hard-cut`,
  `row-misaligned`, `control-inset`, `content-width`, `palette`, `blank-route`,
  `horizontal-overflow`, `edge-misaligned`, `fixed-overflow`, `icon-contrast`,
  `raw-placeholder`, `bare-url`, `console-error` and `input-zoom`.
- `auth.storageState` reuses a session the project mints itself (magic link,
  SSO) instead of filling a password form; a missing file or an expired session
  fails with exit 2.
- `console-error` leaves out what axe-core logs while it fetches stylesheets to
  read the CSSOM: under a narrow `connect-src` that refusal is the tool's, not
  the page's.
- Search and empty-result checks read every table of a list grouped into one
  table per group, and no behaviour check runs while a modal dialog hides the
  main region.
- Sign-in happens on the route that bounces to the login page, not on the first
  route only, so a run that starts on a public page still measures the private
  ones; missing credentials fail before the browser starts.
- `edge-misaligned` and `content-width` measure what a sideways-scrolling frame
  shows, not the full width of the wide table inside it.
- `row-misaligned` accepts a right-aligned column whose cells end at one x.
- `text-hard-cut` ignores texts that end a sentence, one label repeated on every
  row, and texts from one template that differ only in digits.
- `pagination-broken` also pages a main region with no table through its
  repeated collection (a card grid, a list), following pager links that load
  another document, and reports a next page that repeats the first page's items
  or over half of them. Pager links are also found by `rel="next"`/`rel="prev"`.
- Elements the browser does not render (inside a closed `<details>`, under
  `content-visibility: hidden`) are no longer measured.
- A page that never lets its network go idle is measured 5 seconds after the
  load event instead of failing the run on a timeout.
