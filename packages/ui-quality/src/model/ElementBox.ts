import type { Rgba } from '@/model/Rgba.js'

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
