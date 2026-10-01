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
  borderWidths: [number, number, number, number]
  borderColors: [Rgba | null, Rgba | null, Rgba | null, Rgba | null]
  overflowX: string
  overflowY: string
  position: string
  textOverflow: string
  scrollWidth: number
  clientWidth: number
  scrollHeight: number
  clientHeight: number
  isControl: boolean
  /** Computed font size in CSS pixels. */
  fontSize: number
  /**
   * A field the user types into (text-like input, textarea, select, or the root
   * of a contenteditable region): focusing one opens the keyboard.
   */
  isTextEntry: boolean
  isMain: boolean
  /** The page-level header (banner landmark). */
  isBanner: boolean
}
