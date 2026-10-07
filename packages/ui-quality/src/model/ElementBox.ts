import type { Rgba } from '@/model/Rgba.js'
import type { ShadowLayer } from '@/model/ShadowLayer.js'

/** One visible element as the in-page probe serialises it; boxes are in document pixels. */
export type ElementBox = {
  id: number
  parent: number | null
  tag: string
  signature: string
  selector: string
  x: number
  y: number
  width: number
  height: number
  /** The element's own text, whitespace collapsed, first 80 characters. */
  text: string
  textLength: number
  textTail: string
  color: Rgba | null
  backgroundColor: Rgba | null
  /** A gradient or image paints the background, whose colour cannot be read. */
  hasBackgroundImage: boolean
  /** `:disabled` or `aria-disabled="true"`: an inactive control. */
  disabled: boolean
  borderWidths: [number, number, number, number]
  borderColors: [Rgba | null, Rgba | null, Rgba | null, Rgba | null]
  overflowX: string
  overflowY: string
  position: string
  /** Computed `flex-wrap`: a wrapping container lays its children out in lines, not rows. */
  flexWrap: string
  textOverflow: string
  scrollWidth: number
  clientWidth: number
  scrollHeight: number
  clientHeight: number
  /** `clientHeight` less vertical padding: the box the text is laid in. */
  contentHeight: number
  /** One line of a select's font, which Chromium clips to the content box; 0 for other elements. */
  lineBoxHeight: number
  /** `clientWidth` less horizontal padding: the box a field's text is laid in. */
  contentWidth: number
  /** The width of the placeholder an empty field shows; 0 when it shows none. */
  placeholderWidth: number
  /** A `transition-property: all` with a duration: every property change animates. */
  transitionAll: boolean
  /** For an svg, a hash of its markup less presentational attributes; empty otherwise. */
  svgDigest: string
  /** For an svg, `fill` or `stroke` by how its first shape is painted; empty otherwise. */
  svgPaint: string
  /** The widest blur, in px, of the visible outer box-shadows; 0 without one. */
  shadowBlur: number
  isControl: boolean
  /** Computed font size in CSS pixels. */
  fontSize: number
  /** Computed line height in px; `normal` resolved from the font's metrics. */
  lineHeight: number
  /** Computed letter spacing in px; 0 for `normal`. */
  letterSpacing: number
  fontWeight: number
  /** The first family of the computed `font-family`, lower-cased. */
  fontFamily: string
  fontVariantNumeric: string
  /** Every digit takes one width (`tabular-nums` or the font's default); false without text. */
  tabularDigits: boolean
  textAlign: string
  textTransform: string
  /** Lines the element's own text is laid out on; 0 without text. */
  lines: number
  /** Where the glyphs of the element's own text start and end, in document px; 0 without text. */
  textLeft: number
  textRight: number
  /** For text on two or more lines, the content box's width in `ch` (the width of a zero); 0 otherwise. */
  measureCh: number
  /** Computed `display`. */
  display: string
  /**
   * A link, button, tab, menu item, checkbox, radio or switch: something a
   * thumb hits. Text fields, which have their own rules, are not.
   */
  tappable: boolean
  /** For a tappable, the width in px it can be hit across: its box, label and absolute ::before/::after; 0 otherwise. */
  tapWidth: number
  /** For a tappable, the height in px it can be hit across; 0 otherwise. */
  tapHeight: number
  /** The top-left corner radius in px. */
  borderRadius: number
  /** Padding in px: top, right, bottom, left. */
  padding: [number, number, number, number]
  /** Computed margin in px: top, right, bottom, left; `auto` resolves to the used width. */
  margin: [number, number, number, number]
  /** Computed `row-gap` and `column-gap` in px; 0 for `normal`. */
  gap: [number, number]
  /** An input or textarea with a non-empty `placeholder`. */
  placeholder: boolean
  /** For an input, its `type`; `textarea` for a textarea; empty for anything else. */
  inputType: string
  /** For an input or textarea: a label with painted text, or an `aria-labelledby` target with some, names it. */
  visibleLabel: boolean
  /** A non-empty `title` attribute. */
  hasTitle: boolean
  /** A `<time>` element with a `datetime` attribute. */
  datetime: boolean
  /** Computed `z-index`; null for `auto`. */
  zIndex: number | null
  /** A live region: `role="log"`, or an `aria-live` other than `off`. */
  live: boolean
  /** `background-clip: text`: the background is the colour of the glyphs. */
  clipsText: boolean
  /** The background image is, or includes, a gradient. */
  hasGradient: boolean
  /** The colour stops of the background gradients, at most 12; empty without one. */
  gradientStops: Rgba[]
  /** The visible layers of `box-shadow`, at most 4. */
  boxShadows: ShadowLayer[]
  /** The visible layers of `text-shadow`, at most 4. */
  textShadows: ShadowLayer[]
  /** Computed `cursor`. */
  cursor: string
  /** The `role` attribute, lower-cased; empty when absent. */
  role: string
  /** For an element showing a pointer cursor: it is, or sits inside, a link, button, label or ARIA widget. */
  semantic: boolean
  /** For an element showing a pointer cursor: it contains a link, button or other operable element. */
  wrapsInteractive: boolean
  /** A transition with a duration animates width, height, top, left, a margin or a padding. */
  layoutTransition: boolean
  /** The longest transition duration, in ms, of those with a duration above zero; 0 without one. */
  transitionMs: number
  /**
   * A field the user types into (text-like input, textarea, select, or the root
   * of a contenteditable region): focusing one opens the keyboard.
   */
  isTextEntry: boolean
  /** An open dialog or drawer: `dialog[open]`, a dialog role or `aria-modal`. */
  isDialog: boolean
  /** The `aria-label`, trimmed, first 80 characters; empty when absent. */
  label: string
  isMain: boolean
  /** The page-level header (banner landmark). */
  isBanner: boolean
  /**
   * The id of the element hit at the centre of the first line of this
   * element's text when it is neither this element, its ancestor nor its
   * descendant; null when the text is on top or was not sampled.
   */
  occluder: number | null
}
