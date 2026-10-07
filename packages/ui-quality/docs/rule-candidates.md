# Rule candidates for codeality-ui

These are new measurable checks. Two lists were read first so this file does not
repeat them, both as of 2026-10-01 and updated on 2026-10-07:

- **Shipped rules**, from `packages/ui-quality/README.md`: `a11y/*`,
  `text-clipped`, `text-hard-cut`, `row-misaligned`, `control-inset`,
  `edge-misaligned`, `content-width`, `palette`, `blank-route`,
  `horizontal-overflow`, `fixed-overflow`, `icon-contrast`, `raw-placeholder`,
  `bare-url`. Shipped from this file on 2026-10-07: `undersized-text`,
  `tight-leading`, `letter-spacing`, `numeric-alignment`, `broken-image`,
  `unstable-media-size` (its attribute and CSS half) and
  `content-hidden-at-rest`; then `nested-cards`, `type-scale-sprawl`,
  `accent-overuse`, `text-occlusion` and the open halves of
  `unstable-media-size` (layout shift) and `broken-image` (CSS backgrounds).
  Tier 1 is now empty, and so are tiers 2 and 3 (third batch below).
- **Covered by an existing check**, so not shipped as their own rule:
  `zoom-disabled` is axe's `meta-viewport` (on by default, `wcag2aa`, which
  fires on `user-scalable=no` and on `maximum-scale` under 2), reported as
  `a11y/meta-viewport`; `script-error` is `console-error`, whose recorder
  already listens to Playwright's `pageerror`.
- **Already filed** in `TODO.md` (repository root) under ui-quality:
  `placeholder-fit`, `duplicate-nav-icon`, `mixed-icon-family`,
  `oversized-list`, `ghost-elevation`, `transition-all`, axe `target-size`.

Axe runs with default tags, best-practice included. That means `heading-order`,
`label`, `button-name` and `color-contrast` are already covered and do not
appear below.

Since 2026-10-07 `assets/probe.js` also collects `fontSize`, `lineHeight`,
`letterSpacing`, `fontWeight`, the first `fontFamily`, `fontVariantNumeric` (and
whether the font's digits are tabular), `textAlign`, `textTransform`, the line
count of each element's own text, `borderRadius` (top-left), padding, every
visible `img` and `video` (broken, sized) and the share of the main region's
text at opacity 0 or `visibility: hidden`. Since the second 2026-10-07 batch it
also collects the `url()` addresses of CSS background images and, for up to 400
on-screen texts, the element `elementFromPoint` hits at the centre of the first
line; the capture adds the cumulative layout shift (from an init-script
observer) and the image requests that failed. The third batch added margins,
`gap`, glyph extents (`textLeft`, `textRight`), the measure in `ch`, `cursor`,
`role`, transitions (layout properties and the longest duration), `z-index`,
live regions, gradient stops and `background-clip`, box and text shadow layers,
the root `color-scheme`, `theme-color`, the document height and the running
animations. It still does not collect per-element `opacity`.

The two halves left open by the first batch are shipped: `unstable-media-size`
reports a cumulative layout shift over 0.1, read from a buffered
`PerformanceObserver('layout-shift')` registered in an init script before the
page's scripts (one created from the probe saw no entries in headless Chromium),
and `broken-image` reports CSS background images whose request failed or
answered 400 and up, from the capture's request log.

Impeccable (`pbakaus/impeccable`, Apache-2.0) has implemented about half of
these in its Rust detector (`crates/core/src/checks/`). Where it has, its id is
given so its thresholds and tests can be read before writing ours. Thresholds
quoted from it are its own.

The FP column is the false-positive risk: L low, M medium, H high.

## Tier 1: high value for admin screens, low false-positive risk

All shipped. The four of the second batch, as built:

- `nested-cards`: a card is a box with radius over 0, padding of at least 8px on
  every side, and a full border, a shadow or a fill at delta E over 3 from what
  is behind it; buttons, fields, `summary`, dialogs, fixed or absolute layers
  and boxes under 32px tall (badges, chips) are not cards. One finding per outer
  card.
- `type-scale-sprawl`: scoped to the main region; texts inside `article`,
  `blockquote`, `pre`, an editable region or a `.prose`, `.markdown`,
  `.rich-text`, `.user-content`, `.wysiwyg`, `.ql-editor` or `.ProseMirror`
  container are left out, as are code, `sup` and `sub`. The 1px rule compares
  texts that share a parent.
- `accent-overuse`: buttons, submit inputs and rounded links with an opaque
  fill; the fallback accent must have a Lab chroma of at least 20, so a screen
  of grey buttons has none. A parent of two or more links or buttons is an
  action bar and counts as its own region.
- `text-occlusion`: the occluder must paint opaque (fill alpha 0.9 and up, a
  background image, or an `img`, `video`, `canvas` or `iframe`); texts with
  `pointer-events: none` or scrolled out of a clipping ancestor are not sampled,
  and an open dialog, anything in it and a fixed layer while one is open are
  left alone. Only texts on screen at capture time are sampled.

## Tier 2: valuable, needs a careful threshold

Shipped from this tier, as built:

- `focus-invisible`: after the probe, the capture presses Tab up to 30 times
  and, at each stop, compares the focused element and the boxes a ring may be
  painted on instead (three ancestors for `:focus-within`, both siblings for a
  custom checkbox) with how they looked before: outline, box-shadow, border
  colour and width, background colour and image, text colour and decoration.
  Running transitions are finished before the second reading. Elements the probe
  did not walk (a visually hidden input under 2px) are not judged.
- `touch-target`: on a screen 480px wide or less (the configured viewport, not
  the page's, since a page without a viewport meta tag lays out at 980px), an
  enabled link, button, summary, ARIA tab, menu item, checkbox, radio or switch,
  or a checkbox or radio input, whose hit area is under 44px on a side. The hit
  area is its box grown by its labels and by absolutely positioned `::before`
  and `::after` (on a positioned element). Links set in a sentence (inline, with
  text around them or inside a `p`) and boxes parked off the left or top edge
  are exempt. Two targets that cross each other without one lying wholly inside
  the other are reported as overlapping.
- `radius-sprawl`: more than 4 distinct non-zero corner radii (rounded to the
  pixel) among the boxes of the main region, pills and circles (a radius of half
  the short side or more, so `9999px` and `50%`) left out. One finding per
  screen. Only the first half of the candidate is built: its second half (a
  child radius at least equal to its parent's while the parent's padding is
  under 4px) would flag a flush child, whose radius is concentric at the same
  value, and a padded child is already `nested-cards`. The probe now resolves a
  percentage radius against the box's width instead of reading `50%` as 50px.
- `card-radius-admin`: opt-in through the new top-level config `register`
  (`"product"` or `"brand"`); only `"product"` switches it on. A card as in
  `nested-cards` with a corner radius over 8px.

Shipped on 2026-10-07 (third batch), as built. Nothing in this tier is open.

- `off-scale-spacing`: padding, vertical margin and gap values of the main
  region's boxes (computed px) that are not multiples of 4, reported once per
  screen when at least 3 distinct ones appear. Horizontal margins are left out
  (`margin: auto` resolves to whatever width is left), as are 1px and 2px
  hairlines, a 3px value on a bordered box, values that are not whole pixels (em
  and rem maths such as a `h1`'s `0.67em`), the browser's own `1px 6px` button
  padding, and authored content.
- `heading-rhythm`: headings of the main region with a gap above (from the
  previous in-flow sibling) not larger than the gap below (to the next one);
  reported when at least 2 do. A heading first or last among its siblings, or
  beside another block, is not judged.
- `group-gap-ratio`: in a `form`, or a `fieldset` outside one, labels with a
  field stacked under them (within 32px) form groups; the median space between a
  field and the next label must be at least twice the median space from a label
  to its field. Side-by-side labels are not judged.
- `text-cramped`: horizontal only, since the probe reads glyph extents rather
  than line boxes (it now reports the left and right of each element's own text
  from the range rects). A box that draws an edge (a border, only on that side,
  or a fill that stands out, on both) with text closer than 8px to it, 6px when
  under 24px tall. Fields (`control-inset`'s), table parts and texts that
  overflow are left out. The measure is rounded to whole pixels, so an inset
  must be under the floor by more than 1px to count.
- `gray-on-color`: as specified, with a new OKLCH conversion; the text colour is
  composited over its backdrop first, and a text on a gradient or an image is
  not judged since its backdrop cannot be read. Disabled controls are exempt.
- `line-length`: `p`, `li` and `dd` on two or more lines whose content box is
  wider than 80ch, where `ch` is the width of a zero in the element's font (read
  with `measureText`); not inside tables or code. A message bubble cannot be
  told from any other box, so it is not special-cased.
- `clickable-non-semantic`: `cursor: pointer` on an element that is not, inside
  or around a link, button, label, summary, field, option or interactive ARIA
  role. The cursor is inherited, so only the topmost box of a pointer area is
  reported.
- `reduced-motion-ignored`: the screens are captured with
  `reducedMotion: 'reduce'` already, so the probe reads
  `document.getAnimations()` as it stands (CSS transitions aside) and reports
  those that animate `transform`, `translate`, `rotate` or `scale`, or loop
  `opacity` for over a second. It is a state read: nothing waits on a timer.
- `layout-animation`: a transition with a duration above 0 on width, height,
  top, left, a margin or a padding (`all` is `transition-all`'s), and a link,
  button or field transitioning for over 300ms.
- `ascii-ellipsis`: text matching `\w...` or ending in `...`, outside `code`,
  `pre`, `kbd`, `samp` and `var`.
- `label-punctuation`: opt-in through the new top-level config
  `"enable": ["label-punctuation"]` (the list of opt-in rules). A `label` or
  `legend` ending in a colon or containing `*`, or a child of one that is just
  `*`.
- `placeholder-as-label`: as specified. A visible label is a label with text
  that paints, or an `aria-labelledby` target with some; any other text within
  48px above the field, or to its left on the same line, also counts as its
  caption; `type=search`, `role=searchbox` and a `role=search` ancestor are
  exempt.
- `id-first-column`: only the opaque forms (`^[0-9a-f]{8}-` and 20 or more
  characters of `[A-Za-z0-9_-]`) are judged, in at least 80% of the first
  column's cells of a repeated-row group of 6 or more. The numeric form
  (`^#?\d{3,}$`) in the candidate is dropped on purpose: its own FP note says
  invoice and order numbers are legitimate first columns.
- `sticky-table-header`: a `table` taller than 1.5 viewport heights whose header
  cells (`thead`'s `th`, else the first row's), their row, section or any
  ancestor are not `position: sticky`.
- `row-height-scale`: body rows of a `table` (3 or more, with the usual cell
  count, none with a two-line cell) differing by over 2px; a header row more
  than 8px off the median body row.
- `clipped-popover`: static only. An absolutely positioned `role=menu`,
  `listbox` or `tooltip` that reaches past an ancestor with `overflow: hidden`
  or `clip`, looking only at the ancestors between it and its containing block.
  Opening menus is not attempted.
- `z-index-sprawl`: positive `z-index` values that apply (positioned, or a flex
  or grid item); more than `maxLayers` (6) distinct ones, or one at or over
  `ceiling` (1000) reported by itself. Both are options under
  `rules.z-index-sprawl`, which is how a project states its scale.
- `dark-scheme-incomplete`: only in the dark capture of a page whose canvas
  really turns dark (Lab lightness under 50); a page that stays light in the
  dark capture is `dark-scheme-ignored`'s. Reports a missing
  `color-scheme: dark`, each kind of native field still painting a light fill,
  and no `meta[name=theme-color]` that applies to the dark scheme.
- `time-without-datetime`: a text that is wholly a relative time or a date
  (numeric, or with a month name) of 32 characters or fewer, inside a `td`,
  `th`, `tr`, `li` or `dd`, with no `<time datetime>` or `title` on it or an
  ancestor. A sentence that mentions a time is not judged.
- `page-scroll-thread`: a `role=log` or `aria-live` region of over 20 visible
  children, on a document over 3 viewport heights tall, when neither it nor an
  ancestor scrolls vertically.

## Tier 3: AI-made tells (advisory, `warning` severity)

All shipped on 2026-10-07 (third batch), `warn`. They exist for the
`design-quality` "AI-made tells" section of the rubric (§10), which was judged
by eye. As built:

- `gradient-text`: `background-clip: text` (or `-webkit-`) over a gradient, on
  an element with text.
- `glow-shadow`: an outer box or text shadow layer with no offset, a blur of 8px
  or more and a colour of OKLCH chroma over 0.05; or any coloured blur on a
  surface with Lab lightness under 25.
- `side-stripe-accent`: a box with exactly one border of 3px or more, on its
  left or right, in a colour the other drawn sides do not share, that reads as a
  card (padded 8px, not a control or a layer, and rounded, shadowed or filled).
  Quotations, articles and editors are left out. The `[role=alert]` exemption
  "when configured" is `disable`'s job.
- `eyebrow-label`: text of 13px or less, under 40 characters, in capitals or
  spaced out by at least 0.08em, whose next sibling is an `h1` to `h3` at least
  1.5 times its size.
- `pulsing-decoration`: an element under 16x16px with an endless animation of
  opacity or scale. The capture switches motion back on for a second read of
  `document.getAnimations()` (two frames, then a state read) and restores it,
  since the screens are captured with motion reduced and a page that respects
  the setting would show nothing.
- `purple-gradient`: a gradient with a stop of OKLCH chroma over 0.1 and hue 270
  to 310 on a box covering over 20% of the viewport; off when the project's
  palette holds such a colour. The lower hue bound is 270, not the candidate's
  260: Tailwind's blue-600 and blue-700 sit at 263 and 264 and are a product
  blue, not the template violet.

## Suggested order

1. Done on 2026-10-07: the probe extension and `numeric-alignment`,
   `undersized-text`, `tight-leading`, `letter-spacing`, `broken-image`,
   `unstable-media-size` and `content-hidden-at-rest`.
2. Done on 2026-10-07: `nested-cards`, `type-scale-sprawl`, `accent-overuse`,
   `text-occlusion`, and the layout-shift and CSS background halves of
   `unstable-media-size` and `broken-image`.
3. Done on 2026-10-07: `focus-invisible`, `touch-target`, `radius-sprawl` and
   `card-radius-admin`.
4. Done on 2026-10-07 (third batch): the rest of tier 2 and all of tier 3.

Each rule needs a fixture in `tests/` with a true positive and a near-miss
negative, following the package's existing pattern.
