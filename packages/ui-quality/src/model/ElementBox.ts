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
  isControl: boolean
  /** Computed font size in CSS pixels. */
  fontSize: number
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
}
