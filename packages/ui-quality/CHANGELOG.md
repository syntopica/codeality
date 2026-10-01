# Changelog

## 0.1.0

- `codeality-ui check`, `baseline` and `init`: drive each configured route in
  Playwright at every viewport, in light and dark, and report design defects
  with a screenshot per screen and `.codeality-ui/report.json`.
- Rules: every axe violation as `a11y/<id>`, `text-clipped`, `text-hard-cut`,
  `row-misaligned`, `control-inset`, `content-width`, `palette`, `blank-route`
  and `horizontal-overflow`.
