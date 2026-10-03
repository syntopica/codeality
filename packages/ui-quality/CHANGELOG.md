# Changelog

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
