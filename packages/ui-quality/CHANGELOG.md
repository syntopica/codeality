# Changelog

## Unreleased

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
