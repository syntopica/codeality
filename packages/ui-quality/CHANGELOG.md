# Changelog

## 0.1.0

- `codeality-ui check`, `baseline` and `init`: drive each configured route in
  Playwright at every viewport, in light and dark, and report design defects
  with a screenshot per screen and `.codeality-ui/report.json`.
- Rules: every axe violation as `a11y/<id>`, `text-clipped`, `text-hard-cut`,
  `row-misaligned`, `control-inset`, `content-width`, `palette`, `blank-route`,
  `horizontal-overflow`, `edge-misaligned`, `fixed-overflow`, `icon-contrast`,
  `raw-placeholder`, `bare-url`, `console-error` and `input-zoom`.
- Sign-in happens on the route that bounces to the login page, not on the first
  route only, so a run that starts on a public page still measures the private
  ones; missing credentials fail before the browser starts.
- `edge-misaligned` and `content-width` measure what a sideways-scrolling frame
  shows, not the full width of the wide table inside it.
- `row-misaligned` accepts a right-aligned column whose cells end at one x.
- `text-hard-cut` ignores texts that end a sentence and one label repeated on
  every row.
- Elements the browser does not render (inside a closed `<details>`, under
  `content-visibility: hidden`) are no longer measured.
- A page that never lets its network go idle is measured 5 seconds after the
  load event instead of failing the run on a timeout.
