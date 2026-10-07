# Changelog

## [Unreleased]

## 0.7.0

- New rules, all `warn`: `off-scale-spacing` (at least 3 distinct padding,
  vertical margin or gap values in the main region that are not multiples of
  4px), `heading-rhythm` (2 or more headings with no more space above than
  below), `group-gap-ratio` (a form whose field groups are not at least twice as
  far apart as a label is from its field), `text-cramped` (text under 8px, or
  6px in a box under 24px tall, from a left or right edge that a border or a
  fill draws), `gray-on-color` (mid-grey text on a coloured fill, in OKLCH) and
  `line-length` (a wrapped paragraph over 80ch). They may report on projects
  that passed before. The probe now also reads margins, gap, glyph extents, the
  measure in `ch`, cursor, role, transitions, `z-index`, gradients, shadows,
  `color-scheme`, `theme-color`, the document height and the running animations,
  and the capture reads the animations that run with motion not reduced (the
  screens are captured with it reduced).

- New rules, `warn`: `ascii-ellipsis` (`...` instead of `…`),
  `placeholder-as-label` (a field named only by its placeholder),
  `time-without-datetime` (a relative time or date in a cell with no
  `<time datetime>` and no `title`) and the opt-in `label-punctuation` (a
  trailing colon or a required asterisk on a label). New top-level config
  `enable` lists the opt-in rules a project switches on; the only one is
  `label-punctuation`.

- New rules, `warn`: `clickable-non-semantic` (a pointer cursor on something
  that is not a link, button or ARIA widget), `reduced-motion-ignored` (an
  animation that moves, or loops opacity for over a second, still running with
  reduced motion on) and `layout-animation` (a transition on width, height, top,
  left, margin or padding, or a control transitioning for over 300ms).

- New rules, `warn`: `id-first-column` (UUIDs or opaque tokens leading a table
  of more than 5 rows), `sticky-table-header` (a table over 1.5 viewport heights
  whose header does not stick) and `row-height-scale` (body rows more than 2px
  apart, or a header row more than 8px off them).

- New rules, `warn`: `clipped-popover` (a menu, listbox or tooltip cut off by an
  `overflow: hidden` ancestor), `z-index-sprawl` (more than 6 distinct layers,
  or one from 1000 up; options `rules.z-index-sprawl.maxLayers` and `.ceiling`),
  `dark-scheme-incomplete` (a dark page without `color-scheme: dark`, with a
  light native field, or without a dark `theme-color`) and `page-scroll-thread`
  (a long live region that grows the page instead of scrolling in a pane).

- New advisory rules, `warn`: `gradient-text`, `glow-shadow`,
  `side-stripe-accent`, `eyebrow-label`, `pulsing-decoration` and
  `purple-gradient`, the AI-made tells of the design rubric.

- New rules, all `warn`: `off-scale-spacing` (at least 3 distinct padding,
  vertical margin or gap values in the main region that are not multiples of
  4px), `heading-rhythm` (2 or more headings with no more space above than
  below), `group-gap-ratio` (a form whose field groups are not at least twice as
  far apart as a label is from its field), `text-cramped` (text under 8px, or
  6px in a box under 24px tall, from a left or right edge that a border or a
  fill draws), `gray-on-color` (mid-grey text on a coloured fill, in OKLCH) and
  `line-length` (a wrapped paragraph over 80ch). They may report on projects
  that passed before. The probe now also reads margins, gap, glyph extents, the
  measure in `ch`, cursor, role, transitions, `z-index`, gradients, shadows,
  `color-scheme`, `theme-color`, the document height and the running animations,
  and the capture reads the animations that run with motion not reduced (the
  screens are captured with it reduced).

- New rules, `warn`: `ascii-ellipsis` (`...` instead of `…`),
  `placeholder-as-label` (a field named only by its placeholder),
  `time-without-datetime` (a relative time or date in a cell with no
  `<time datetime>` and no `title`) and the opt-in `label-punctuation` (a
  trailing colon or a required asterisk on a label). New top-level config
  `enable` lists the opt-in rules a project switches on; the only one is
  `label-punctuation`.

- New rules, `warn`: `clickable-non-semantic` (a pointer cursor on something
  that is not a link, button or ARIA widget), `reduced-motion-ignored` (an
  animation that moves, or loops opacity for over a second, still running with
  reduced motion on) and `layout-animation` (a transition on width, height, top,
  left, margin or padding, or a control transitioning for over 300ms).

- New rules, `warn`: `id-first-column` (UUIDs or opaque tokens leading a table
  of more than 5 rows), `sticky-table-header` (a table over 1.5 viewport heights
  whose header does not stick) and `row-height-scale` (body rows more than 2px
  apart, or a header row more than 8px off them).

- New rules, `warn`: `clipped-popover` (a menu, listbox or tooltip cut off by an
  `overflow: hidden` ancestor), `z-index-sprawl` (more than 6 distinct layers,
  or one from 1000 up; options `rules.z-index-sprawl.maxLayers` and `.ceiling`),
  `dark-scheme-incomplete` (a dark page without `color-scheme: dark`, with a
  light native field, or without a dark `theme-color`) and `page-scroll-thread`
  (a long live region that grows the page instead of scrolling in a pane).

- New rules, all `warn`: `off-scale-spacing` (at least 3 distinct padding,
  vertical margin or gap values in the main region that are not multiples of
  4px), `heading-rhythm` (2 or more headings with no more space above than
  below), `group-gap-ratio` (a form whose field groups are not at least twice as
  far apart as a label is from its field), `text-cramped` (text under 8px, or
  6px in a box under 24px tall, from a left or right edge that a border or a
  fill draws), `gray-on-color` (mid-grey text on a coloured fill, in OKLCH) and
  `line-length` (a wrapped paragraph over 80ch). They may report on projects
  that passed before. The probe now also reads margins, gap, glyph extents, the
  measure in `ch`, cursor, role, transitions, `z-index`, gradients, shadows,
  `color-scheme`, `theme-color`, the document height and the running animations,
  and the capture reads the animations that run with motion not reduced (the
  screens are captured with it reduced).

- New rules, `warn`: `ascii-ellipsis` (`...` instead of `…`),
  `placeholder-as-label` (a field named only by its placeholder),
  `time-without-datetime` (a relative time or date in a cell with no
  `<time datetime>` and no `title`) and the opt-in `label-punctuation` (a
  trailing colon or a required asterisk on a label). New top-level config
  `enable` lists the opt-in rules a project switches on; the only one is
  `label-punctuation`.

- New rules, `warn`: `clickable-non-semantic` (a pointer cursor on something
  that is not a link, button or ARIA widget), `reduced-motion-ignored` (an
  animation that moves, or loops opacity for over a second, still running with
  reduced motion on) and `layout-animation` (a transition on width, height, top,
  left, margin or padding, or a control transitioning for over 300ms).

- New rules, `warn`: `id-first-column` (UUIDs or opaque tokens leading a table
  of more than 5 rows), `sticky-table-header` (a table over 1.5 viewport heights
  whose header does not stick) and `row-height-scale` (body rows more than 2px
  apart, or a header row more than 8px off them).

- New rules, all `warn`: `off-scale-spacing` (at least 3 distinct padding,
  vertical margin or gap values in the main region that are not multiples of
  4px), `heading-rhythm` (2 or more headings with no more space above than
  below), `group-gap-ratio` (a form whose field groups are not at least twice as
  far apart as a label is from its field), `text-cramped` (text under 8px, or
  6px in a box under 24px tall, from a left or right edge that a border or a
  fill draws), `gray-on-color` (mid-grey text on a coloured fill, in OKLCH) and
  `line-length` (a wrapped paragraph over 80ch). They may report on projects
  that passed before. The probe now also reads margins, gap, glyph extents, the
  measure in `ch`, cursor, role, transitions, `z-index`, gradients, shadows,
  `color-scheme`, `theme-color`, the document height and the running animations,
  and the capture reads the animations that run with motion not reduced (the
  screens are captured with it reduced).

- New rules, `warn`: `ascii-ellipsis` (`...` instead of `…`),
  `placeholder-as-label` (a field named only by its placeholder),
  `time-without-datetime` (a relative time or date in a cell with no
  `<time datetime>` and no `title`) and the opt-in `label-punctuation` (a
  trailing colon or a required asterisk on a label). New top-level config
  `enable` lists the opt-in rules a project switches on; the only one is
  `label-punctuation`.

- New rules, `warn`: `clickable-non-semantic` (a pointer cursor on something
  that is not a link, button or ARIA widget), `reduced-motion-ignored` (an
  animation that moves, or loops opacity for over a second, still running with
  reduced motion on) and `layout-animation` (a transition on width, height, top,
  left, margin or padding, or a control transitioning for over 300ms).

- New rules, all `warn`: `off-scale-spacing` (at least 3 distinct padding,
  vertical margin or gap values in the main region that are not multiples of
  4px), `heading-rhythm` (2 or more headings with no more space above than
  below), `group-gap-ratio` (a form whose field groups are not at least twice as
  far apart as a label is from its field), `text-cramped` (text under 8px, or
  6px in a box under 24px tall, from a left or right edge that a border or a
  fill draws), `gray-on-color` (mid-grey text on a coloured fill, in OKLCH) and
  `line-length` (a wrapped paragraph over 80ch). They may report on projects
  that passed before. The probe now also reads margins, gap, glyph extents, the
  measure in `ch`, cursor, role, transitions, `z-index`, gradients, shadows,
  `color-scheme`, `theme-color`, the document height and the running animations,
  and the capture reads the animations that run with motion not reduced (the
  screens are captured with it reduced).

- New rules, `warn`: `ascii-ellipsis` (`...` instead of `…`),
  `placeholder-as-label` (a field named only by its placeholder),
  `time-without-datetime` (a relative time or date in a cell with no
  `<time datetime>` and no `title`) and the opt-in `label-punctuation` (a
  trailing colon or a required asterisk on a label). New top-level config
  `enable` lists the opt-in rules a project switches on; the only one is
  `label-punctuation`.

- New rules, all `warn`: `off-scale-spacing` (at least 3 distinct padding,
  vertical margin or gap values in the main region that are not multiples of
  4px), `heading-rhythm` (2 or more headings with no more space above than
  below), `group-gap-ratio` (a form whose field groups are not at least twice as
  far apart as a label is from its field), `text-cramped` (text under 8px, or
  6px in a box under 24px tall, from a left or right edge that a border or a
  fill draws), `gray-on-color` (mid-grey text on a coloured fill, in OKLCH) and
  `line-length` (a wrapped paragraph over 80ch). They may report on projects
  that passed before. The probe now also reads margins, gap, glyph extents, the
  measure in `ch`, cursor, role, transitions, `z-index`, gradients, shadows,
  `color-scheme`, `theme-color`, the document height and the running animations,
  and the capture reads the animations that run with motion not reduced (the
  screens are captured with it reduced).

## 0.6.0

- New rules, both `warn`: `radius-sprawl` (more than 4 distinct corner radii in
  the main region, pills and circles aside) and `card-radius-admin` (a card with
  a corner radius over 8px), which runs only with the new top-level config
  `"register": "product"` (`"brand"` leaves it off). The probe now resolves a
  percentage `border-radius` against the box's width.

- New rule, `warn`: `touch-target`. On a screen 480px wide or less, a link,
  button or ARIA widget whose hit area (box, label and absolutely positioned
  `::before`/`::after`) is under 44x44px, or that partly overlaps another
  target. Links inside a sentence are exempt. It may report on phone screens of
  projects that passed before. The probe now reads `display` and the tap area.

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
