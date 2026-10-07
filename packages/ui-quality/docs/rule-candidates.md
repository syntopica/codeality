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
  Tier 1 is now empty.
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
observer) and the image requests that failed. It still does not collect gradient
`backgroundImage` details, `backgroundClip`, per-element `opacity`, `zIndex`,
`cursor`, margins, `gap` or `transition*` beyond `transition: all`. The
**Probe** column names the fields each remaining candidate needs.

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

| Rule id                  | Exact trigger                                                                                                                                                                                                                                                                                           | Sources                                                                           | FP                                                                                                          | Probe                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `off-scale-spacing`      | Padding, margin or gap values (computed px, rounded) that are not multiples of 4. Report only when at least 3 distinct off-scale values appear inside `main`. Ignore 1px and 2px (hairlines) and values of 3px or less next to a border.                                                                | G5 ("multiples of 4"), M3 4dp baseline, ID, BUI                                   | M (rem maths at odd root sizes; line-height leftovers)                                                      | padding, margin, `gap`                                    |
| `heading-rhythm`         | For at least 2 headings in `main`, the gap from the previous block's bottom to the heading top is not larger than the gap from the heading bottom to its next sibling.                                                                                                                                  | IMP `heading-rhythm`, KRE grouping (2x rule)                                      | M                                                                                                           | boxes (already probed)                                    |
| `group-gap-ratio`        | In a vertical form (`form` or `fieldset`), the label-to-input gap is at least half the field-to-field gap (groups do not separate).                                                                                                                                                                     | KRE grouping ("gap between groups at least 2x within"), Laws of UX proximity      | M                                                                                                           | boxes                                                     |
| `gray-on-color`          | Text colour with OKLCH chroma under 0.02 and L between 0.35 and 0.75, on a resolved background with chroma over 0.06.                                                                                                                                                                                   | IMP `gray-on-color`, RUI                                                          | L                                                                                                           | existing colours, plus OKLCH conversion                   |
| `line-length`            | A paragraph-like node (`p`, `li`, a message bubble) with at least 2 rendered lines whose width over the average character width (canvas `measureText`) exceeds 80ch.                                                                                                                                    | IMP `line-length`, KRE (60-75ch), RUI                                             | M (tables and code; restrict to prose tags)                                                                 | `fontSize`, `fontFamily`, width                           |
| `text-cramped`           | Extends `control-inset` from inputs to any text-bearing element with a visible border or a delta-E-distinct background: the text's ink box sits less than 8px from the padding box edge (6px for chips under 24px tall).                                                                                | IMP `cramped-padding`, KRE                                                        | M (badges and chips are intentionally tight; scale the threshold by height)                                 | reuse `inkEdgesOf`                                        |
| `clickable-non-semantic` | An element with computed `cursor: pointer` that is not `a[href]`, `button`, `label`, `summary`, `input` or `select` and has no interactive `role`, and is not inside one of those.                                                                                                                      | VWIG ("no div with onClick"), BUI, KRE semantics                                  | M (CSS-only cursors on decorative wrappers of a real link; check descendants)                               | `cursor`, `role`                                          |
| `focus-invisible`        | Tab through the first 30 focusable elements: computed `outlineStyle`/`outlineWidth`, `boxShadow` and `borderColor` on focus equal their values at rest.                                                                                                                                                 | VWIG focus, WCAG 2.4.7, KRE                                                       | L (needs a keyboard pass in capture)                                                                        | per-element style diff after `page.keyboard.press('Tab')` |
| `touch-target`           | At the phone viewport (width at most 480px), a clickable element under 44x44px whose expanded box (including `::before`/`::after` hit area) does not reach 44px, or two clickable boxes that overlap. Complements axe's 24px `target-size`.                                                             | HIG 44pt, M3 48dp, KRE hit-areas, rubric 9, IMP audit                             | M (inline text links in prose are exempt by WCAG; skip `a` inside `p`)                                      | boxes, pseudo-element sizes                               |
| `reduced-motion-ignored` | With `reducedMotion: 'reduce'` emulated, `document.getAnimations()` returns running animations whose effect targets `transform` or long `opacity` loops (over 1s, infinite).                                                                                                                            | VWIG animation, WCAG 2.3.3, EMIL, KRE                                             | L                                                                                                           | capture option plus `getAnimations()`                     |
| `layout-animation`       | `transitionProperty` includes `width`, `height`, `top`, `left`, `margin*` or `padding*` with a non-zero duration (sibling of the filed `transition-all`). Also report `transitionDuration` over 300ms on controls.                                                                                      | VWIG, BUI, IMP `layout-transition`, EMIL, userinterface-wiki `duration-max-300ms` | L                                                                                                           | `transitionProperty`, `transitionDuration`                |
| `ascii-ellipsis`         | Visible text ending in `...` or containing `\w\.\.\.` (not inside `code` or `pre`).                                                                                                                                                                                                                     | VWIG typography ("… not ..."), KRE                                                | L                                                                                                           | text (already probed)                                     |
| `label-punctuation`      | A visible `<label>` or `<legend>` whose text ends with `:`, or contains `*` as a required marker.                                                                                                                                                                                                       | GOV question pages ("no colons", "never mark mandatory fields with asterisks")    | H as a default; opt-in only, since many design systems use the asterisk                                     | text                                                      |
| `placeholder-as-label`   | An `input` or `textarea` with a `placeholder`, no associated visible label text (via `for`, a wrapping label, or `aria-labelledby` pointing at visible text) and no visible text within 48px above or to its left. axe `label` passes on `aria-label` alone, which is why this check is needed.         | GOV text input, VWIG, WCAG 3.3.2                                                  | M (search boxes with an icon; exempt `type=search` and `role=search`)                                       | `placeholder`, label association                          |
| `id-first-column`        | In a table or grid of more than 5 rows, the first visible column's text matches `^[0-9a-f]{8}-` (UUID), `^#?\d{3,}$`, or `^[A-Za-z0-9_-]{20,}$` in at least 80% of rows.                                                                                                                                | NNG data tables (human-readable first column)                                     | M (invoice or order numbers are legitimately first; the rule should only flag UUIDs and long opaque tokens) | text                                                      |
| `sticky-table-header`    | A table whose height is over 1.5x the viewport and whose `thead` cells are not `position: sticky` (and no sticky ancestor of the header row).                                                                                                                                                           | NNG data tables, CDS                                                              | L                                                                                                           | `position` (already probed)                               |
| `row-height-scale`       | Body rows of one table differ in height by more than 2px (ignoring rows that wrap by design: any cell with 2 or more lines), or the header row height differs from the body row height by more than 8px.                                                                                                | CDS data table ("header always matches the row size")                             | M                                                                                                           | boxes                                                     |
| `radius-sprawl`          | More than 4 distinct non-zero `borderRadius` values in `main` (ignoring 9999px pills and 50% circles), or a child card radius at least equal to its parent card radius while the parent padding is under 4px (non-concentric).                                                                          | ID (radius scale, concentric), KRE better-ui, OFP (cards at most 8px)             | M                                                                                                           | `borderRadius`, padding                                   |
| `card-radius-admin`      | Opt-in through config `register: "product"`: card-like elements (as in `nested-cards`) with `borderRadius` over 8px.                                                                                                                                                                                    | OFP ("cards are kept at 8px border radius or less")                               | M (brand choice; opt-in only)                                                                               | `borderRadius`                                            |
| `clipped-popover`        | An element with `overflow: hidden` or `clip` that contains an `absolute`-positioned descendant whose box extends beyond the clip box (menus and tooltips cut off). Check after opening menus when interaction is available; statically, flag only `[role=menu]`, `[role=listbox]` and `[role=tooltip]`. | IMP `clipped-overflow-container`                                                  | M                                                                                                           | `overflow`, `position`, boxes                             |
| `z-index-sprawl`         | More than 6 distinct positive computed `zIndex` values, or any value of at least 1000 besides the configured scale.                                                                                                                                                                                     | BUI ("fixed z-index scale"), UPM                                                  | M (third-party widgets; allow `disable` by selector)                                                        | `zIndex`                                                  |
| `dark-scheme-incomplete` | In the dark run: the root's computed `colorScheme` is not `dark`, or a native `select`/`input` still paints a light background (L over 90), or there is no `meta[name=theme-color]` in the dark media.                                                                                                  | VWIG dark mode, rubric 9                                                          | L                                                                                                           | `colorScheme`, control backgrounds                        |
| `time-without-datetime`  | Text that matches relative time (`/\b(\d+\s?(min\|h\|d)\|hace \d+\|ago)\b/i`) or a date pattern, inside an element that is not `<time datetime>` and has no `title`.                                                                                                                                    | rubric 8 (absolute on hover), VWIG locale                                         | M (copy that mentions times; restrict to row groups)                                                        | text, attributes                                          |
| `page-scroll-thread`     | A route with an element whose role or heuristic says "thread or list pane" (`[role=log]`, `[aria-live]` with more than 20 children) whose `overflowY` is not `auto` or `scroll`, while the document `scrollHeight` is over 3x the viewport.                                                             | G5 ("fixed height containers with internal scrolling"), rubric 4                  | M                                                                                                           | `overflowY`, `scrollHeight` (already probed)              |

## Tier 3: AI-made tells (advisory, `warning` severity)

These cost little and need little in the probe. Their value is the
`design-quality` "AI-made tells" section of the rubric (§10): today it is judged
by eye; these would let a rule report it.

| Rule id              | Exact trigger                                                                                                                                                                          | Sources                                                               | FP                                                                                                 | Probe                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `gradient-text`      | `backgroundClip`/`webkitBackgroundClip` is `text` and `backgroundImage` contains `gradient(`.                                                                                          | IMP `gradient-text`, A-BP, O-FP                                       | L                                                                                                  | `backgroundClip`, `backgroundImage`             |
| `glow-shadow`        | `boxShadow` or `textShadow` with x = y = 0, blur of at least 8px and a chromatic colour (chroma over 0.05), or any chromatic blurred shadow on a dark surface (L under 25).            | IMP `dark-glow`, `radial-halo`; BUI ("no glow as affordance")         | L                                                                                                  | `boxShadow`, `textShadow`                       |
| `side-stripe-accent` | A card-like element with exactly one side border of at least 3px whose colour differs from the other sides (left or right accent stripe).                                              | IMP `side-tab`, `border-accent-on-rounded`; impeccable craft-floor    | M (alert callouts in some design systems use it on purpose; exempt `[role=alert]` when configured) | `borderWidths`, `borderColors` (already probed) |
| `eyebrow-label`      | A text node at most 13px with `textTransform: uppercase` (or `letterSpacing` at least 0.08em), under 40 characters, whose next element sibling is an `h1`-`h3` at least 1.5x its size. | IMP `hero-eyebrow-chip`, `kicker-above-heading`; OFP                  | M                                                                                                  | `fontSize`, `textTransform`, `letterSpacing`    |
| `pulsing-decoration` | An element under 16x16px with a running infinite animation on `opacity` or `transform: scale` (a "live" dot).                                                                          | IMP `pulsing-dot`                                                     | M (real live indicators; advisory only)                                                            | `getAnimations()`                               |
| `purple-gradient`    | A `backgroundImage` linear or radial gradient whose stops include a hue in 260-310° with chroma over 0.1, on a large surface (over 20% of the viewport).                               | IMP `ai-color-palette`, A-BP, O-54 ("avoid purple-on-white defaults") | M (a brand that is genuinely purple; skip when the palette rule includes that hue)                 | `backgroundImage`                               |

## Suggested order

1. Done on 2026-10-07: the probe extension and `numeric-alignment`,
   `undersized-text`, `tight-leading`, `letter-spacing`, `broken-image`,
   `unstable-media-size` and `content-hidden-at-rest`.
2. Done on 2026-10-07: `nested-cards`, `type-scale-sprawl`, `accent-overuse`,
   `text-occlusion`, and the layout-shift and CSS background halves of
   `unstable-media-size` and `broken-image`.
3. Next: `focus-invisible` (needs a keyboard pass in capture), `touch-target`,
   then `radius-sprawl` and `card-radius-admin`, which can reuse `isCard`.

Each rule needs a fixture in `tests/` with a true positive and a near-miss
negative, following the package's existing pattern.
